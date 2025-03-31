import { Router } from "express";
import { z } from "zod";
import { requireUser, AuthRequest } from "../middleware/auth";
import {
  generateEmailVerification,
  generatePhoneVerification,
  verifyEmailToken,
  verifyPhoneToken,
  resendEmailVerification,
  resendPhoneVerification,
} from "../services/verification-service";

const router = Router();

const verifyEmailSchema = z.object({
  token: z.string(),
});

const verifyPhoneSchema = z.object({
  token: z.string(),
});

// Verify email route
router.post("/verify-email", requireUser, async (req: AuthRequest, res) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    const isValid = await verifyEmailToken(req.tenant!.id, token);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify phone route
router.post("/verify-phone", requireUser, async (req: AuthRequest, res) => {
  try {
    const { token } = verifyPhoneSchema.parse(req.body);
    const isValid = await verifyPhoneToken(req.tenant!.id, token);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    res.json({ message: "Phone number verified successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resend email verification route
router.post("/resend-email-verification", requireUser, async (req: AuthRequest, res) => {
  try {
    const token = await resendEmailVerification(req.tenant!.id);
    // TODO: Send verification email with token
    res.json({ message: "Email verification token sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resend phone verification route
router.post("/resend-phone-verification", requireUser, async (req: AuthRequest, res) => {
  try {
    const token = await resendPhoneVerification(req.tenant!.id);
    // TODO: Send verification SMS with token
    res.json({ message: "Phone verification token sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router; 
