import jwt from "jsonwebtoken";
import { db } from "../db";
import { refreshTokens } from "@shared/schema/user-account";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { parseTimeValue, timeToCookieMaxAge, timeToExpiryDate } from "../utils/time";
import { AUTH_COOKIE_NAMES } from "../constants/auth";
import { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";

export async function generateAccessToken(userId: string, userAccountId: string): Promise<string> {
  return jwt.sign({ userId, userAccountId }, JWT_SECRET, {
    expiresIn: parseTimeValue(process.env.ACCESS_TOKEN_EXPIRY || "15m"),
  });
}

export async function verifyAccessToken(token: string): Promise<{ userId: string, userAccountId: string }> {
  return jwt.verify(token, JWT_SECRET) as { userId: string, userAccountId: string };
}

export async function generateRefreshToken(userId: string, userAccountId: string, deviceInfo: string): Promise<string> {
  const tokenHash = randomBytes(64).toString("hex");
  const familyId = randomBytes(32).toString("hex");
  const expiresAt = timeToExpiryDate(process.env.REFRESH_TOKEN_EXPIRY || "30d");

  await db.insert(refreshTokens).values({
    userAccountId,
    tokenHash,
    familyId,
    deviceInfo,
    lastUsedAt: new Date(),
    expiresAt,
    isRevoked: false,
  });

  return jwt.sign({ userId, userAccountId, familyId }, REFRESH_TOKEN_SECRET, {
    expiresIn: parseTimeValue(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
  });
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string, userAccountId: string, familyId: string }> {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string, userAccountId: string, familyId: string };
}

export async function revokeRefreshTokenFamily(userAccountId: string, familyId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(
      and(
        eq(refreshTokens.userAccountId, userAccountId),
        eq(refreshTokens.familyId, familyId),
        eq(refreshTokens.isRevoked, false)
      )
    );
}

export interface AuthorizeUserResult {
  userId: string;
  userAccountId: string;
  newAccessToken?: string;
  newRefreshToken?: string;
}


export async function authorizeUser(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  userAgent: string | undefined,
  res: Response
): Promise<AuthorizeUserResult | null> {
  if (accessToken) {
    try {
      const decoded = await verifyAccessToken(accessToken);
      return { userId: decoded.userId, userAccountId: decoded.userAccountId };
    } catch (error) {
      // Access token invalid or expired, try refresh token
      if (refreshToken) {
        try {
          const decoded = await verifyRefreshToken(refreshToken);
          
          // Verify refresh token exists and is not revoked
          const existingToken = await db.query.refreshTokens.findFirst({
            where: and(
              eq(refreshTokens.userAccountId, decoded.userAccountId),
              eq(refreshTokens.familyId, decoded.familyId),
              eq(refreshTokens.isRevoked, false)
            ),
          });

          if (!existingToken) {
            clearAuthCookies(res);
            return null;
          }

          // Check if token is expired in database
          if (new Date(existingToken.expiresAt) < new Date()) {
            await db
              .update(refreshTokens)
              .set({ isRevoked: true })
              .where(eq(refreshTokens.id, existingToken.id));
            clearAuthCookies(res);
            return null;
          }

          // Generate new tokens
          const newAccessToken = await generateAccessToken(decoded.userId, decoded.userAccountId);
          const newRefreshToken = await generateRefreshToken(decoded.userId, decoded.userAccountId, userAgent || "unknown");

          // Set new cookies
          res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, newAccessToken, cookieOptions);
          res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, cookieOptions);

          return {
            userId: decoded.userId,
            userAccountId: decoded.userAccountId,
            newAccessToken,
            newRefreshToken
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

/**
 * Cookie options for all cookie operations
 */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  maxAge: timeToCookieMaxAge(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
};

/**
 * Clears all auth-related cookies
 * @param res Express response object
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, cookieOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
}
