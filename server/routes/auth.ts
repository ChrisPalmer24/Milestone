import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { userAccounts, loginSchema, registerSchema, revokeFamilySchema } from "../../shared/schema/user-account";
import { eq } from "drizzle-orm";
import { AuthRequest, requireUser } from "../middleware/auth";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshTokenFamily, cookieOptions, clearAuthCookies } from "../services/auth-service";
import { compare } from "bcrypt";
import { AUTH_COOKIE_NAMES } from "../constants/auth";
import { ServiceFactory } from "../services/factory";
import { requireTenant } from "./utils";

const router = Router();

const services = ServiceFactory.getInstance();
const userService = services.getUserService();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.query.userAccounts.findFirst({
      where: eq(userAccounts.email, email),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const completeUser = await userService.getCompleteUserForAccount(user.id);

    if (!completeUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = await generateAccessToken(completeUser.id, user.id);
    const refreshToken = await generateRefreshToken(completeUser.id, user.id, req.headers["user-agent"] || "unknown");

    res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, cookieOptions);
    res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, cookieOptions);

    res.json({
      user: completeUser,
      message: "Login successful"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber } = registerSchema.parse(req.body);

    const existingUser = await db.query.userAccounts.findFirst({
      where: eq(userAccounts.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const completeUser = await userService.createUserComplete({ email, password, fullName, phoneNumber });

    // Generate verification tokens
    //const emailToken = await generateEmailVerification(user.id);
    //const phoneToken = phoneNumber ? await generatePhoneVerification(user.id) : null;

    // TODO: Send verification email with emailToken
    // TODO: Send verification SMS with phoneToken if phoneNumber is provided

    const accessToken = await generateAccessToken(completeUser.id, completeUser.account.id);
    const refreshToken = await generateRefreshToken(completeUser.id, completeUser.account.id, req.headers["user-agent"] || "unknown");

    res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, cookieOptions);
    res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, cookieOptions);

    res.status(201).json({
      user: completeUser,
      message: "Registration successful. Please verify your email and phone number.",
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout route
router.post("/logout", requireUser, async (req: AuthRequest, res) => {
  try {
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];
    if (refreshToken) {
      const { familyId } = await verifyRefreshToken(refreshToken);
      await revokeRefreshTokenFamily(req.tenant!.id, familyId);
    }

    clearAuthCookies(res);
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user route
router.get("/me", requireUser, async (req: AuthRequest, res) => {
  try {
    const completeUser = await requireTenant(req.tenant, async (tenant) => {
      return userService.getCompleteUserForAccount(tenant.id);
    });

    if (!completeUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: completeUser });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Revoke token family route
router.post("/revoke-family", requireUser, async (req: AuthRequest, res) => {
  try {
    const { familyId } = revokeFamilySchema.parse(req.body);
    await revokeRefreshTokenFamily(req.tenant!.id, familyId);
    res.json({ message: "Token family revoked successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 
