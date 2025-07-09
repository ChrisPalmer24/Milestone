import { Router } from "express";
import { ServiceFactory } from "../services/factory";
import {
  AuthRequest,
  AuthService,
  requireTenantWithUserAccountId,
} from "server/auth";
import { findSecurities } from "@server/services/securities";
import { parseQueryParamsExpress } from "@server/utils/resource-query-builder";
import { 
  securityInsertSchema,
  SecuritySearchResult,
  SecuritySelect,
} from "@shared/schema";
import { uuidRouteParam } from "@server/utils/uuid";
import { combineSecurityResults } from "@server/utils/securities";

const services = ServiceFactory.getInstance();
const assetService = services.getAssetService();

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser } = authService.getAuthMiddlewares();

  // Securities CRUD Operations
  router.get("/", requireUser, async (req: AuthRequest, res) => {
    const queryParams = parseQueryParamsExpress(req.query);
    const securities = await assetService.getSecurities(queryParams);
    res.json(securities);
  });

  router.get(
    `/${uuidRouteParam("securityId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      if(!req.params.securityId) {
        return res.status(400).json({ error: "Security ID is required" });
      }
      const security = await assetService.getSecurity(req.params.securityId);
      res.json(security);
    }
  );

  router.post("/", requireUser, async (req: AuthRequest, res) => {
    const data = securityInsertSchema.parse(req.body);
    const security = await assetService.createOrFindSecurity(data);
    res.json(security);
  });

  router.put(
    `/${uuidRouteParam("securityId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      if(!req.params.securityId) {
        return res.status(400).json({ error: "Security ID is required" });
      }
      const data = securityInsertSchema.parse(req.body);
      const security = await assetService.updateSecurity(
        req.params.securityId,
        data
      );
      res.json(security);
    }
  );

  router.delete(
    `/${uuidRouteParam("securityId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      if(!req.params.securityId) {
        return res.status(400).json({ error: "Security ID is required" });
      }
      const result = await assetService.deleteSecurity(req.params.securityId);
      res.json({ success: result });
    }
  );

  // Securities Search (Hybrid: Cache + External API)
  router.get("/search", requireUser, async (req: AuthRequest, res) => {
    const identifiers = req.query.q;

    if (!identifiers || typeof identifiers !== 'string') {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    
    const query = identifiers.trim();
    const minLength = 2; // Minimum query length to avoid too many results
    
    if (query.length < minLength) {
      return res.status(400).json({ 
        error: `Query must be at least ${minLength} characters long` 
      });
    }

    try {
      //Step 1: Search local cache first for exact symbol matches and partial name matches
      const cachedSecurities = await assetService.searchCachedSecurities(query);
      
      // // Step 2: If we have good cached results and query looks like exact symbol, return cache only
      // const isExactSymbolQuery = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/i.test(query);
      // if (cachedSecurities.length > 0 && isExactSymbolQuery) {
      //   return res.json({
      //     source: 'cache',
      //     securities: cachedSecurities.map(security => ({ ...security, fromCache: true })),
      //     fromExternal: false
      //   });
      // }

      // Step 3: Always search external API for fresh results, but limit frequency
      const securityIdentifiers = [query];
      const externalSecurities = await findSecurities(securityIdentifiers)

      //console.log("externalSecurities", externalSecurities);
      
      // Step 4: Combine and deduplicate results, prioritizing external data
      const combinedResults = combineSecurityResults(cachedSecurities, externalSecurities);
      
      // res.json({
      //   source: 'hybrid',
      //   securities: externalSecurities,
      //   fromExternal: true,
      //   cached: cachedSecurities.length,
      //   external: externalSecurities.length
      // });

      res.json(combinedResults);
      
    } catch (error) {
      console.error('Securities search error:', error);
      
      // Fallback to cache only if external API fails
      try {
        const cachedSecurities = await assetService.searchCachedSecurities(query);
        res.json({
          source: 'cache_fallback',
          securities: cachedSecurities.map(security => ({ ...security, fromCache: true })),
          fromExternal: false,
          warning: 'External search unavailable, showing cached results only'
        });
      } catch (cacheError) {
        console.error('Cache search error:', cacheError);
        res.status(500).json({ error: 'Search service temporarily unavailable' });
      }
    }
  });

  // // Utility endpoint to pre-cache popular securities
  // router.post("/cache", requireUser, async (req: AuthRequest, res) => {
  //   try {
  //     const requestData: SecurityCacheRequest = req.body;
      
  //     const cachedSecurities = await Promise.all(
  //       requestData.securities.map(security => assetService.createOrFindSecurity(security))
  //     );
      
  //     const response: SecuritySearchResponse = {
  //       source: 'cache',
  //       securities: cachedSecurities.map(security => ({ ...security, fromCache: true })),
  //       fromExternal: false
  //     };
      
  //     res.json({
  //       message: `Successfully cached ${cachedSecurities.length} securities`,
  //       securities: response.securities
  //     });
  //   } catch (error) {
  //     console.error('Cache securities error:', error);
  //     res.status(500).json({ error: 'Failed to cache securities' });
  //   }
  // });

  return router;
}
