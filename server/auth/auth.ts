//import { refreshTokens } from "@db/schema";
import { clearAuthCookies, generateRefreshToken, setAuthCookies } from "./token";
import { generateAccessToken } from "./token";
import { verifyAccessToken, verifyRefreshToken } from "./token";
//import { db } from "@db/connection";
import { AuthorizeAPIKeyAttributesExtended, AuthorizeUserAttributesExtended, AuthorizeUserResult, AuthorizeTenantResult, CookieOptions, ResponseWithCookiesLike, TokenPersistence } from "./types";

export async function authorizeUser(
  attributes: AuthorizeUserAttributesExtended,
  setAuthCookies: (res: ResponseWithCookiesLike, accessToken: string, refreshToken: string) => void,
  clearAuthCookies: (res: ResponseWithCookiesLike) => void,
  tokenPersistence: TokenPersistence,
  res: ResponseWithCookiesLike
): Promise<AuthorizeUserResult | null> {
  const { accessToken, accessTokenSecret, refreshToken, refreshTokenSecret, userAgent, accessTokenExpiry, refreshTokenExpiry } = attributes;
  if (accessToken && refreshToken) {
    try {
      const {
        tenantId,
        tenantAccountId
      } = await verifyAccessToken(accessToken, accessTokenSecret);
      return { tenantId, tenantAccountId, accessToken, refreshToken };
    } catch (error) {
      // Access token invalid or expired, try refresh token
      if (refreshToken) {
        try {
          const {
            tenantId,
            tenantAccountId,
            familyId
          } = await verifyRefreshToken(refreshToken, refreshTokenSecret);

          const persistedToken = await tokenPersistence.getRefreshToken(tenantAccountId, familyId);
          
          // Verify refresh token exists and is not revoked
          // const existingToken = await db.query.refreshTokens.findFirst({
          //   where: and(
          //     eq(refreshTokens.userAccountId, decoded.userAccountId),
          //     eq(refreshTokens.familyId, decoded.familyId),
          //     eq(refreshTokens.isRevoked, false)
          //   ),
          // });

          if (!persistedToken) {
            clearAuthCookies(res);
            return null;
          }

          // Check if token is expired in database
          if (new Date(persistedToken.expiresAt) < new Date()) {

            await tokenPersistence.revokeRefreshTokenFamily(tenantId, familyId);

            // await db
            //   .update(refreshTokens)
            //   .set({ isRevoked: true })
            //   .where(eq(refreshTokens.id, persistedToken.id));
            // clearAuthCookies(res, cookieOptions);
            return null;
          }

          // Generate new tokens
          const newAccessToken = await generateAccessToken({
            tenantId,
            tenantAccountId,
            expiry: accessTokenExpiry
          }, accessTokenSecret);
          const newRefreshToken = await generateRefreshToken({
            tenantId,
            tenantAccountId,
            deviceInfo: userAgent || "unknown",
            expiry: refreshTokenExpiry
          }, tokenPersistence, refreshTokenSecret);

          setAuthCookies(res, newAccessToken, newRefreshToken);

          return {
            tenantId,
            tenantAccountId,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          };
        } catch (error) {
          clearAuthCookies(res);
          return null;
        }
      }
    }
  }
  return null;
}

export async function authorizeAPIKey(
  attributes: AuthorizeAPIKeyAttributesExtended,
  tokenPersistence: TokenPersistence,
): Promise<AuthorizeTenantResult | null> {
  const { apiKey, apiKeySecret } = attributes;
  const apiKeyEnitity = await tokenPersistence.getAPIKey(apiKey);
  if (!apiKeyEnitity) {
    return null;
  }

  const { id: tenantId } = apiKeyEnitity;

  return { tenantId };
}
