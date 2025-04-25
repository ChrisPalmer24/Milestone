import { IncomingHttpHeaders } from "node:http";
import { Request, RequestHandler } from "express";

export interface ResponseWithCookiesLike {
  cookie: (name: string, token: string, options: CookieOptions) => void,
  clearCookie: (name: string, options: CookieOptions) => void;
}

export interface RequestWithCookiesLike {
  cookies: {
    [key: string]: string;
  };
}

export interface JWTAuthTokenPayload {
  tenantId: string;
  tenantAccountId: string;
}

export interface JWTAuthTokenAttributes extends JWTAuthTokenPayload {
  expiry: string;
}

export interface JWTRefreshTokenPayload {
  tenantId: string;
  tenantAccountId: string;
  familyId: string;
}

export interface RefreshTokenAttributes {
  tenantId: string;
  tenantAccountId: string;
  deviceInfo: string;
  expiry: string;
}

export interface RefreshTokenFamilyAttributes {
  tenantId: string;
  familyId: string;
}

export interface RefreshTokenInsert extends Omit<RefreshTokenAttributes, "expiry"> {
  familyId: string;
  tokenHash: string;
  deviceInfo: string;
  lastUsedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface RefreshTokenPerssisted extends RefreshTokenInsert {
  id: string;
}

export interface AuthorizeUserAttributes {
  accessToken: string | undefined,
  refreshToken: string | undefined,
  userAgent: string | undefined,
}

export interface AuthorizeUserAttributesExtended extends AuthorizeUserAttributes {
  accessTokenSecret: string,
  accessTokenExpiry: string,
  refreshTokenSecret: string,
  refreshTokenExpiry: string,
}

export interface AuthorizeAPIKeyAttributes {
  apiKey: string,
}

export interface AuthorizeAPIKeyAttributesExtended extends AuthorizeAPIKeyAttributes {
  apiKeySecret: string,
}

export interface AuthorizeUserResult {
  tenantId: string;
  tenantAccountId: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthorizeTenantResult {
  tenantId: string;
}

export interface APIKeyAttributes {
  key: string;
  deviceInfo: string | null;
  isRevoked: boolean;
  expiry: string;
}

export interface APIKeyInsert extends Omit<APIKeyAttributes, "expiry"> {
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isRevoked: boolean;
}

export interface APIKeyPerssisted extends APIKeyInsert {
  id: string;
}

export type PersistRefreshToken = (tokenInsert: RefreshTokenInsert) => Promise<RefreshTokenPerssisted>;
export type GetRefreshToken = (tenantAccountId: string, familyId: string) => Promise<RefreshTokenPerssisted | null>;
export type RevokeRefreshTokenFamily = (tenantAccountId: string, familyId: string) => Promise<void>;
export type GetAPIKey = (apiKey: string) => Promise<APIKeyPerssisted | null>;


export type TokenPersistence = {
  persistRefreshToken: PersistRefreshToken;
  getRefreshToken: GetRefreshToken;
  revokeRefreshTokenFamily: RevokeRefreshTokenFamily;
  getAPIKey: GetAPIKey;
}

export type AuthoriseUser = (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) => Promise<AuthorizeUserResult | null>;
export type AuthoriseAPIKey = (attributes: AuthorizeAPIKeyAttributes) => Promise<AuthorizeTenantResult | null>;

export interface CookieOptions {
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  maxAge: number;
}

export type TenantType = 'user' | 'api' | 'service';

export type Tenant = {
  id: string;
} & (
  {
    type: 'user';
    userAccountId: string;
  } | {
    type: 'api';
    userAccountId?: undefined;
  }
)

export interface RequestLike {
  cookies: {
    [key: string]: string;
  };
  headers: IncomingHttpHeaders;
}

export interface AuthRequest extends Request {
  tenant?: Tenant;
}

export type AuthMiddlewareExpress = {
  requireUser: RequestHandler;
  requireApiKey: RequestHandler;
  requireBoth: RequestHandler;
  requireAny: RequestHandler;
}
