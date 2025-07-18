import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertAccountSchema } from "@server/db/schema/portfolio-account";
import { AuthRequest, AuthService } from "server/auth";

const router = Router();
const services = ServiceFactory.getInstance();
const accountService = services.getAccountService();




export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser } = authService.getAuthMiddlewares();

// Get all accounts for a user
router.get("/user/:userAccountId", requireUser, async (req: AuthRequest, res) => {
  try {


    const userAccountId = req.params.userAccountId;
    const accounts = await accountService.getByUserAccountId(userAccountId);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Failed to get accounts" });
  }
});

// Get account by ID
router.get("/:id", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.id;
    const account = await accountService.get(accountId);
    
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: "Failed to get account" });
  }
});

// Create account
router.post("/", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountData = insertAccountSchema.parse(req.body);
    const account = await accountService.create(accountData);
    res.status(201).json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid account data", errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

// Update account
router.patch("/:id", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.id;
    const accountData = insertAccountSchema.partial().parse(req.body);
    const account = await accountService.update(accountId, accountData);
    res.json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid account data", errors: error.errors });
    }
    if (error instanceof Error && error.message === "Account not found") {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(500).json({ message: "Failed to update account" });
  }
});

// Delete account
router.delete("/:id", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.id;
    const success = await accountService.delete(accountId);
    
    if (!success) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account" });
  }
});

// Update account value
router.patch("/:id/value", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.id;
    const { value } = req.body;
    
    if (typeof value !== 'number' || isNaN(value)) {
      return res.status(400).json({ message: "Invalid value. Must be a number." });
    }
    
    const account = await accountService.updateValue(accountId, value);
    res.json(account);
  } catch (error) {
    if (error instanceof Error && error.message === "Account not found") {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(500).json({ message: "Failed to update account value" });
  }
});

// Connect account API
router.post("/:id/connect", requireUser, async (req: AuthRequest, res) => {
  try {
    const accountId = req.params.id;
    const { apiKey } = req.body;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ message: "Invalid API key" });
    }
    
    const account = await accountService.connectApi(accountId, apiKey);
    res.json(account);
  } catch (error) {
    if (error instanceof Error && error.message === "Account not found") {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(500).json({ message: "Failed to connect account API" });
  }
});

return router;

}
