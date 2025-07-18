import { query, response, Router } from "express";
import { ServiceFactory } from "../services/factory";
import {
  AuthRequest,
  AuthService,
  requireTenantWithUserAccountId,
} from "server/auth";
import {
  brokerProviderAssets,
  generalAssets,
  recurringContributions
} from "@server/db/schema/portfolio-assets";
import { ResourceQueryBuilder } from "@server/utils/resource-query-builder";
import {
  assetValueInsertSchema,
  assetValueOrphanInsertSchema,
  assetContributionOrphanInsertSchema,
  brokerProviderAssetInsertSchema,
  generalAssetInsertSchema,
  recurringContributionOrphanInsertSchema,
  RecurringContribution
} from "@shared/schema";
import { uuidRouteParam } from "@server/utils/uuid";

const services = ServiceFactory.getInstance();
const assetService = services.getAssetService();

const brokerProviderAssetsQueryBuilder = new ResourceQueryBuilder({
  table: brokerProviderAssets,
  allowedSortFields: [
    "createdAt",
    "updatedAt",
    "name",
    "providerId",
    "accountType",
  ],
  allowedFilterFields: ["providerId", "accountType"],
  defaultSort: { field: "createdAt", direction: "desc" },
  maxLimit: 50,
});

const recurringContributionsQueryBuilder = new ResourceQueryBuilder({
  table: recurringContributions,
  allowedSortFields: [
    "createdAt",
    "updatedAt",
    "amount",
    "startDate",
    "lastProcessedDate",
    "interval",
    "isActive"
  ],
  allowedFilterFields: ["interval", "isActive"],
  defaultSort: { field: "createdAt", direction: "desc" },
  maxLimit: 50,
});

const generalAssetsQueryBuilder = new ResourceQueryBuilder({
  table: generalAssets,
  allowedSortFields: ["createdAt", "updatedAt", "name", "assetType"],
  allowedFilterFields: ["assetType"],
  defaultSort: { field: "createdAt", direction: "desc" },
  maxLimit: 50,
});

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser, requireApiKey } = authService.getAuthMiddlewares();

  router.get("/broker", requireUser, async (req: AuthRequest, res) => {
    const response = await requireTenantWithUserAccountId(
      req.tenant,
      async (tenant) => {
        if (req.query.start || req.query.end) {
          const query = brokerProviderAssetsQueryBuilder.buildQuery(req.query);
          const assets =
            await assetService.getBrokerProviderAssetsWithAccountChangeForUser(
              tenant.userAccountId,
              {
                ...query,
                start: req.query.start,
                end: req.query.end,
              }
            );
          return assets;
        } else {
          const query = brokerProviderAssetsQueryBuilder.buildQuery(req.query);
          const assets = await assetService.getBrokerProviderAssetsForUser(
            tenant.userAccountId,
            query
          );
          return assets;
        }
      }
    );

    res.json(response);
  });

  router.post("/broker", requireUser, async (req: AuthRequest, res) => {
    const data = brokerProviderAssetInsertSchema.parse(req.body);
    const asset = await assetService.createBrokerProviderAsset(data);
    res.json(asset);
  });

  router.get(
    `/broker/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const asset = await assetService.getBrokerProviderAsset(
        req.params.assetId
      );
      res.json(asset);
    }
  );

  router.put(
    `/broker/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = brokerProviderAssetInsertSchema.parse(req.body);
      const asset = await assetService.updateBrokerProviderAsset(
        req.params.assetId,
        data
      );
      res.json(asset);
    }
  );

  router.delete(
    `/broker/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const asset = await assetService.deleteBrokerProviderAsset(
        req.params.assetId
      );
      res.json(asset);
    }
  );

  router.get(
    `/broker/${uuidRouteParam("assetId")}/history`,
    requireUser,
    async (req: AuthRequest, res) => {
      const query = brokerProviderAssetsQueryBuilder.buildQuery(req.query);
      const history = await assetService.getBrokerProviderAssetHistory(
        req.params.assetId,
        query
      );
      res.json(history);
    }
  );

  router.post(
    `/broker/${uuidRouteParam("assetId")}/history`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetValueOrphanInsertSchema.parse(req.body);
      const history = await assetService.createBrokerProviderAssetValueHistory(
        req.params.assetId,
        data
      );
      res.json(history);
    }
  );
  
  // Broker asset contributions (debits)
  router.post(
    `/broker/${uuidRouteParam("assetId")}/contributions`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetContributionOrphanInsertSchema.parse(req.body);
      const contribution = await assetService.createBrokerProviderAssetContributionHistory(
        req.params.assetId,
        data
      );
      res.json(contribution);
    }
  );
  
  router.get(
    `/broker/${uuidRouteParam("assetId")}/contributions`,
    requireUser,
    async (req: AuthRequest, res) => {
      const query = brokerProviderAssetsQueryBuilder.buildQuery(req.query);
      const contributions = await assetService.getBrokerProviderAssetContributionHistory(
        req.params.assetId,
        query
      );
      res.json(contributions);  
    }
  );
  
  router.put(
    `/broker/${uuidRouteParam("assetId")}/contributions/${uuidRouteParam("contributionId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetContributionOrphanInsertSchema.parse(req.body);
      const contribution = await assetService.updateBrokerProviderAssetContributionHistory(
        req.params.assetId,
        req.params.contributionId,
        data
      );
      res.json(contribution);
    }
  );
  
  router.delete(
    `/broker/${uuidRouteParam("assetId")}/contributions/${uuidRouteParam("contributionId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const result = await assetService.deleteBrokerProviderAssetContributionHistory(
        req.params.assetId,
        req.params.contributionId
      );
      res.json({ success: result });
    }
  );

  router.put(
    `/broker/${uuidRouteParam("assetId")}/history/${uuidRouteParam(
      "historyId"
    )}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetValueOrphanInsertSchema.parse(req.body);
      const history = await assetService.updateBrokerProviderAssetValueHistory(
        req.params.assetId,
        req.params.historyId,
        data
      );
      res.json(history);
    }
  );

  router.delete(
    `/broker/${uuidRouteParam("assetId")}/history/${uuidRouteParam(
      "historyId"
    )}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const history = await assetService.deleteBrokerProviderAssetValueHistory(
        req.params.assetId,
        req.params.historyId
      );
      res.json(history);
    }
  );

  /**
   * General Assets
   */

  router.get("/general", requireUser, async (req: AuthRequest, res) => {
    const response = await requireTenantWithUserAccountId(
      req.tenant,
      async (tenant) => {
        if (req.query.start || req.query.end) {
          const query = generalAssetsQueryBuilder.buildQuery(req.query);
          const assets =
            await assetService.getGeneralAssetsWithAccountChangeForUser(
              tenant.userAccountId,
              {
                ...query,
                start: req.query.start,
                end: req.query.end,
              }
            );
          return assets;
        } else {
          const query = generalAssetsQueryBuilder.buildQuery(req.query);
          const assets = await assetService.getGeneralAssetsForUser(
            tenant.userAccountId,
            query
          );
          return assets;
        }
      }
    );

    res.json(response);
  });

  router.post("/general", requireUser, async (req: AuthRequest, res) => {
    const data = generalAssetInsertSchema.parse(req.body);
    const asset = await assetService.createGeneralAsset(data);
    res.json(asset);
  });

  router.get(
    `/general/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const asset = await assetService.getGeneralAsset(req.params.assetId);
      res.json(asset);
    }
  );

  router.put(
    `/general/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = generalAssetInsertSchema.parse(req.body);
      const asset = await assetService.updateGeneralAsset(
        req.params.assetId,
        data
      );
      res.json(asset);
    }
  );

  router.delete(
    `/general/${uuidRouteParam("assetId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const asset = await assetService.deleteGeneralAsset(req.params.assetId);
      res.json(asset);
    }
  );

  router.get(
    `/general/${uuidRouteParam("assetId")}/history`,
    requireUser,
    async (req: AuthRequest, res) => {
      const query = generalAssetsQueryBuilder.buildQuery(req.query);
      const history = await assetService.getGeneralAssetHistory(
        req.params.assetId,
        query
      );
      res.json(history);
    }
  );

  router.post(
    `/general/${uuidRouteParam("assetId")}/history`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetValueInsertSchema.parse(req.body);
      const history = await assetService.createGeneralAssetValueHistory(
        req.params.assetId,
        data
      );
      res.json(history);
    }
  );

  router.put(
    `/general/${uuidRouteParam("assetId")}/history/${uuidRouteParam(
      "historyId"
    )}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = assetValueInsertSchema.parse(req.body);
      const history = await assetService.updateGeneralAssetValueHistory(
        req.params.assetId,
        req.params.historyId,
        data
      );
      res.json(history);
    }
  );

  router.delete(
    `/general/${uuidRouteParam("assetId")}/history/${uuidRouteParam(
      "historyId"
    )}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const history = await assetService.deleteGeneralAssetValueHistory(
        req.params.assetId,
        req.params.historyId
      );
      res.json(history);
    }
  );

  router.get(
    "/broker-providers",
    requireUser,
    async (req: AuthRequest, res) => {
      const providers = await assetService.getBrokerAssetProviders();
      res.json(providers);
    }
  );

  router.get("/portfolio-value", requireUser, async (req: AuthRequest, res) => {
    const response = await requireTenantWithUserAccountId(
      req.tenant,
      async (tenant) => {
        const startDate = req.query?.start
          ? new Date(req.query.start as string)
          : null;
        const endDate = req.query?.end
            ? new Date(req.query.end as string)
            : null;
          const value = await assetService.getPortfolioOverviewForUserForDateRange(
            tenant.userAccountId,
            startDate,
            endDate
          );
        return value;
      }
    );

    res.json(response);
  });

  router.get(
    "/portfolio-value/history",
    requireUser,
    async (req: AuthRequest, res) => {
      const response = await requireTenantWithUserAccountId(
        req.tenant,
        async (tenant) => {
          const startDate = req.query?.start
            ? new Date(req.query.start as string)
            : null;
          const endDate = req.query?.end
            ? new Date(req.query.end as string)
            : null;
          const history =
            await assetService.getPortfolioValueHistoryForUserForDateRange(
              tenant.userAccountId,
              startDate,
              endDate
            );
          return history;
        }
      );
      res.json(response);
    }
  );

  // Recurring Contributions Routes
  router.get(
    `/broker/${uuidRouteParam("assetId")}/recurring-contributions`,
    requireUser,
    async (req: AuthRequest, res) => {
      const query = recurringContributionsQueryBuilder.buildQuery(req.query);
      const recurringContributions = await assetService.getRecurringContributionsForAsset(
        req.params.assetId,
        query
      );
      res.json(recurringContributions);
    }
  );

  router.post(
    `/broker/${uuidRouteParam("assetId")}/recurring-contributions`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = recurringContributionOrphanInsertSchema.parse(req.body);
      const recurringContribution = await assetService.createRecurringContribution(
        req.params.assetId,
        data
      );
      res.json(recurringContribution);
    }
  );

  router.put(
    `/broker/${uuidRouteParam("assetId")}/recurring-contributions/${uuidRouteParam("contributionId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const data = recurringContributionOrphanInsertSchema.parse(req.body);
      const recurringContribution = await assetService.updateRecurringContribution(
        req.params.assetId,
        req.params.contributionId,
        data
      );
      res.json(recurringContribution);
    }
  );

  router.delete(
    `/broker/${uuidRouteParam("assetId")}/recurring-contributions/${uuidRouteParam("contributionId")}`,
    requireUser,
    async (req: AuthRequest, res) => {
      const result = await assetService.deleteRecurringContribution(
        req.params.assetId,
        req.params.contributionId
      );
      res.json({ success: result });
    }
  );

  // Add a route to manually trigger processing of recurring contributions (for admin/testing)
  router.post(
    `/recurring-contributions/process`,
    requireApiKey,
    async (req: AuthRequest, res) => {
      const processCount = await assetService.processRecurringContributions();
      res.json({ processedCount: processCount });
    }
  );

  return router;
}
