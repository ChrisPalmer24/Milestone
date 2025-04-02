import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, generateRefreshToken, authorizeUser } from "../services/auth-service";
import { AUTH_COOKIE_NAMES } from "../constants/auth";

export type TenantType = 'user' | 'api' | 'service';

export type Tenant = {
  id: string;
} & (
  {
    type: 'user';
    userAccountId: string;
    apiKey?: undefined;
  } | {
    type: 'api';
    apiKey: string;
    userAccountId?: undefined;
  }
)

export interface AuthRequest extends Request {
  tenant?: Tenant;
}

const createAuthMiddleware = (allowedAuthTypes: TenantType[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Try browser session auth if allowed
      if (allowedAuthTypes.includes('user')) {
        const accessToken = req.cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
        const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];
        
        const authResult = await authorizeUser(
          accessToken,
          refreshToken,
          req.headers["user-agent"],
          res
        );

        if (authResult) {
          req.tenant = { id: authResult.userId, type: 'user', userAccountId: authResult.userAccountId };
          return next();
        }
      }

      // Try API auth if allowed
      if (allowedAuthTypes.includes('api')) {
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
          // TODO: Implement API key validation
          // const apiClient = await validateApiKey(apiKey);
          // req.tenant = { id: apiClient.id, type: 'api' };
          // return next();
          throw new Error("API key validation not implemented");
        }
      }

      // No valid auth found
      return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
      return res.status(401).json({ error: "Invalid authentication" });
    }
  };
};

// Export convenience middleware for common auth patterns
export const requireUser = createAuthMiddleware(['user']);
export const requireApi = createAuthMiddleware(['api']);
export const requireAny = createAuthMiddleware(['user', 'api']);
export const requireBoth = createAuthMiddleware(['user', 'api']); // For routes that need both user and API auth

// Export the factory function for custom auth requirements
export { createAuthMiddleware }; 


