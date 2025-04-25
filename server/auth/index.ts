
import {
  AuthorizeAPIKeyAttributes,
  AuthorizeAPIKeyAttributesExtended,
  AuthorizeUserAttributes,
  AuthorizeUserAttributesExtended,
  type CookieOptions,
  type JWTAuthTokenAttributes,
  type RefreshTokenAttributes,
  type RefreshTokenFamilyAttributes,
  type TenantType,
  ResponseWithCookiesLike,
  TokenPersistence
} from "./types";
import { timeToCookieMaxAge } from "./util-time";

import { AUTH_COOKIE_NAMES } from "./const";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshTokenFamily,
  clearAuthCookies,
  setAuthCookies,
} from "./token";
import { authorizeAPIKey, authorizeUser } from "./auth";
import { createAuthMiddleware, requireUser, requireApiKey, requireAny, requireBoth } from "./middleware";

interface AuthServiceOptions {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  apiKeySecret?: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  accessTokenCookieName?: string;
  refreshTokenCookieName?: string;
  cookieDomain: string;
  tokenPersistence: TokenPersistence;
}

export class AuthService {

  private readonly accessTokenCookieName: string;
  private readonly refreshTokenCookieName: string;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly apiKeySecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly tokenPersistence: TokenPersistence;
  private readonly cookieOptions: CookieOptions;


  constructor(options: AuthServiceOptions) {
    this.accessTokenCookieName = options.accessTokenCookieName ?? AUTH_COOKIE_NAMES.ACCESS_TOKEN;
    this.refreshTokenCookieName = options.refreshTokenCookieName ?? AUTH_COOKIE_NAMES.REFRESH_TOKEN;
    this.accessTokenSecret = options.accessTokenSecret;
    this.refreshTokenSecret = options.refreshTokenSecret;
    this.apiKeySecret = options.apiKeySecret ?? this.accessTokenSecret;
    this.accessTokenExpiry = options.accessTokenExpiry;
    this.refreshTokenExpiry = options.refreshTokenExpiry;
    this.tokenPersistence = options.tokenPersistence;
    this.cookieOptions = {
      domain: options.cookieDomain,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: timeToCookieMaxAge(this.refreshTokenExpiry),
    };
  }

  public generateAccessToken(attributes: Omit<JWTAuthTokenAttributes, "expiry">) {
    return generateAccessToken({
      ...attributes,
      expiry: this.accessTokenExpiry
    }, this.accessTokenSecret);
  }

  public verifyAccessToken(token: string) {
    return verifyAccessToken(token, this.accessTokenSecret);
  }

  public generateRefreshToken(attributes: Omit<RefreshTokenAttributes, "expiry">) {
    return generateRefreshToken({
      ...attributes,
      expiry: this.refreshTokenExpiry
    }, this.tokenPersistence, this.refreshTokenSecret);
  }

  public verifyRefreshToken(token: string) {
    return verifyRefreshToken(token, this.refreshTokenSecret);
  }

  public revokeRefreshTokenFamily(attributes: RefreshTokenFamilyAttributes) {
    return revokeRefreshTokenFamily(attributes, this.tokenPersistence);
  }

  public setAuthCookies(res: ResponseWithCookiesLike, accessToken: string, refreshToken: string) {
    setAuthCookies(res, this.accessTokenCookieName, this.refreshTokenCookieName, this.cookieOptions, accessToken, refreshToken);
  }

  public clearAuthCookies(res: ResponseWithCookiesLike) {
    clearAuthCookies(res, this.accessTokenCookieName, this.refreshTokenCookieName, this.cookieOptions);
  }

  public authorizeUser(attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
    return authorizeUser({
      ...attributes,
      accessTokenSecret: this.accessTokenSecret,
      refreshTokenSecret: this.refreshTokenSecret,
      accessTokenExpiry: this.accessTokenExpiry,
      refreshTokenExpiry: this.refreshTokenExpiry
    }, this.cookieOptions, this.tokenPersistence, res);
  }

  public authorizeAPIKey(attributes: AuthorizeAPIKeyAttributes) {
    return authorizeAPIKey({
      ...attributes,
      apiKeySecret: this.apiKeySecret
    }, this.tokenPersistence);
  }
  
  public createAuthMiddleware(allowedAuthTypes: TenantType[]) {
    const that = this;
    return createAuthMiddleware(allowedAuthTypes,
      function (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
        return that.authorizeUser(attributes, res);
      },
      function (attributes: AuthorizeAPIKeyAttributes) {
        return that.authorizeAPIKey(attributes);
      });  
  }

  public getAuthMiddlewares() {

    const that = this;
    return {
      requireUser: requireUser(function (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
        return that.authorizeUser(attributes, res);
      }, function (attributes: AuthorizeAPIKeyAttributes) {
        return that.authorizeAPIKey(attributes);
      }),
      requireApiKey: requireApiKey(function (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
        return that.authorizeUser(attributes, res);
      }, function (attributes: AuthorizeAPIKeyAttributes) {
        return that.authorizeAPIKey(attributes);
      }),
      requireAny: requireAny(function (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
        return that.authorizeUser(attributes, res);
      }, function (attributes: AuthorizeAPIKeyAttributes) {
        return that.authorizeAPIKey(attributes);
      }),
      requireBoth: requireBoth(function (attributes: AuthorizeUserAttributes, res: ResponseWithCookiesLike) {
        return that.authorizeUser(attributes, res);
      }, function (attributes: AuthorizeAPIKeyAttributes) {
        return that.authorizeAPIKey(attributes);
      }),
    }
  }

  public getAccessTokenCookieName() {
    return this.accessTokenCookieName;
  }

  public getRefreshTokenCookieName() {
    return this.refreshTokenCookieName;
  }
}

export * from "./types";

export * from "./utils";
