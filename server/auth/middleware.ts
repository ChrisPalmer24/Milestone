import { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAMES } from "./const";
import { AuthoriseAPIKey, AuthoriseUser, AuthRequest, TenantType } from "./types";
import { IncomingHttpHeaders } from "node:http";

const createAuthMiddleware = (allowedAuthTypes: TenantType[], authoriseUser: AuthoriseUser, authoriseAPIKey: AuthoriseAPIKey) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Try browser session auth if allowed
      if (allowedAuthTypes.includes('user')) {

        console.log("allowedAuthTypes", allowedAuthTypes);

        console.log("req.cookies", req.cookies);

        const accessToken = req.cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
        const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

        console.log("accessToken", accessToken);
        console.log("refreshToken", refreshToken);

        const authResult = await authoriseUser({
          accessToken,
          refreshToken,
          userAgent: req.headers["user-agent"],
        }, res);

        console.log("authResult", authResult);

        if (authResult) {
          req.tenant = { id: authResult.tenantId, type: 'user', userAccountId: authResult.tenantAccountId };
          return next();
        }
      }

      // Try API auth if allowed
      if (allowedAuthTypes.includes('api')) {
        const apiKey = req.headers['x-api-key']?.[0] as string | undefined;
        if (apiKey) {

          const authResult = await authoriseAPIKey({
            apiKey,
          });

          if (authResult) {
            req.tenant = { id: authResult.tenantId, type: 'api' };
            return next();
          }
          // TODO: Implement API key validation
          // const apiClient = await validateApiKey(apiKey);
          // req.tenant = { id: apiClient.id, type: 'api' };

          throw new Error("API key validation not implemented");
        }
      }

      // No valid auth found
      return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
      console.error("auth middleware error", error);
      return res.status(401).json({ error: "Invalid authentication" });
    }
  };
};

// Export convenience middleware for common auth patterns
export const requireUser = (authoriseUser: AuthoriseUser, authoriseAPIKey: AuthoriseAPIKey) => createAuthMiddleware(['user'], authoriseUser, authoriseAPIKey);
export const requireApiKey = (authoriseUser: AuthoriseUser, authoriseAPIKey: AuthoriseAPIKey) => createAuthMiddleware(['api'], authoriseUser, authoriseAPIKey);
export const requireAny = (authoriseUser: AuthoriseUser, authoriseAPIKey: AuthoriseAPIKey) => createAuthMiddleware(['user', 'api'], authoriseUser, authoriseAPIKey);
export const requireBoth = (authoriseUser: AuthoriseUser, authoriseAPIKey: AuthoriseAPIKey) => createAuthMiddleware(['user', 'api'], authoriseUser, authoriseAPIKey); // For routes that need both user and API auth

// Export the factory function for custom auth requirements
export { createAuthMiddleware }; 


