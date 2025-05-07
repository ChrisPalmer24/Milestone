import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import {
  insertCoreUserSchema,
  insertUserAccountSchema,
  insertUserProfileSchema,
} from "@shared/schema";
import { AuthRequest, AuthService, requireTenant, Tenant } from "../auth";

const services = ServiceFactory.getInstance();
const userService = services.getUserService();

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {

  const { requireUser } = authService.getAuthMiddlewares()
  // Core User routes
  router.get("/core/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const user = await userService.getCoreUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Core user not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get core user" });
    }
  });

  router.post("/core", requireUser, async (req: AuthRequest, res) => {
    try {
      const userData = insertCoreUserSchema.parse(req.body);
      const user = await userService.createCoreUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create core user" });
    }
  });

  router.patch("/core/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const userData = insertCoreUserSchema.partial().parse(req.body);
      const user = await userService.updateCoreUser(req.params.id, userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid user data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Core user not found") {
        return res.status(404).json({ message: "Core user not found" });
      }
      res.status(500).json({ message: "Failed to update core user" });
    }
  });

  router.delete("/core/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const success = await userService.deleteCoreUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Core user not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete core user" });
    }
  });

  // User Account routes
  router.get("/account/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const account = await userService.getUserAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "User account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user account" });
    }
  });

  router.post("/account", requireUser, async (req: AuthRequest, res) => {
    try {
      const accountData = insertUserAccountSchema.parse(req.body);
      const account = await userService.createUserAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user account" });
    }
  });

  router.patch("/account/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const accountData = insertUserAccountSchema.partial().parse(req.body);
      const account = await userService.updateUserAccount(
        req.params.id,
        accountData
      );
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid account data", errors: error.errors });
      }
      if (
        error instanceof Error &&
        error.message === "User account not found"
      ) {
        return res.status(404).json({ message: "User account not found" });
      }
      res.status(500).json({ message: "Failed to update user account" });
    }
  });

  router.delete("/account/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const success = await userService.deleteUserAccount(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User account not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user account" });
    }
  });

  // User Profile routes
  router.get("/profile/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const profile = await userService.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  router.post("/profile", requireUser, async (req: AuthRequest, res) => {
    try {
      const profileData = insertUserProfileSchema.parse(req.body);
      const profile = await userService.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user profile" });
    }
  });

  router.patch("/profile/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const profileData = insertUserProfileSchema.partial().parse(req.body);
      const profile = await userService.updateUserProfile(
        req.params.id,
        profileData
      );
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid profile data", errors: error.errors });
      }
      if (
        error instanceof Error &&
        error.message === "User profile not found"
      ) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  router.delete("/profile/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const success = await userService.deleteUserProfile(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user profile" });
    }
  });

  // Authentication routes
  router.post("/verify-email", requireUser, async (req: AuthRequest, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res
          .status(400)
          .json({ message: "Verification token is required" });
      }

      const success = await userService.verifyEmail(token);
      if (!success) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
      }

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  router.post(
    "/request-password-reset",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const success = await userService.requestPasswordReset(email);
        if (!success) {
          return res.status(404).json({ message: "User account not found" });
        }

        res.json({ message: "Password reset email sent" });
      } catch (error) {
        res.status(500).json({ message: "Failed to request password reset" });
      }
    }
  );

  router.post("/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ message: "Token and new password are required" });
      }

      const success = await userService.resetPassword(token, newPassword);
      if (!success) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  router.post(
    "/change-password",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const { userAccountId, currentPassword, newPassword } = req.body;
        if (!userAccountId || !currentPassword || !newPassword) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const success = await userService.changePassword(
          userAccountId,
          currentPassword,
          newPassword
        );
        if (!success) {
          return res
            .status(400)
            .json({
              message: "Invalid current password or user account not found",
            });
        }

        res.json({ message: "Password changed successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to change password" });
      }
    }
  );

  return router
}
