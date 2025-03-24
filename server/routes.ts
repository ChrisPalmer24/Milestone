import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAccountSchema, 
  insertAccountHistorySchema, 
  insertMilestoneSchema,
  insertFireSettingsSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a demo user for testing if it doesn't exist
  let demoUser = await storage.getUserByUsername("demo");
  if (!demoUser) {
    demoUser = await storage.createUser({ username: "demo", password: "demo" });
  }

  // ================== Account Routes ==================
  
  // Get all accounts for a user
  app.get("/api/accounts", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get a specific account
  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // Create a new account
  app.post("/api/accounts", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId
      });
      
      const newAccount = await storage.createAccount(accountData);
      res.status(201).json(newAccount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Update an account value
  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const { value } = req.body;
      
      if (typeof value !== 'number' || isNaN(value)) {
        return res.status(400).json({ message: "Invalid value. Must be a number." });
      }
      
      const updatedAccount = await storage.updateAccount(accountId, value);
      res.json(updatedAccount);
    } catch (error) {
      if (error instanceof Error && error.message === "Account not found") {
        return res.status(404).json({ message: "Account not found" });
      }
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  // Delete an account
  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const success = await storage.deleteAccount(accountId);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // ================== Account History Routes ==================
  
  // Get history for an account
  app.get("/api/accounts/:id/history", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const history = await storage.getAccountHistory(accountId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account history" });
    }
  });

  // Get history for an account by date range
  app.get("/api/accounts/:id/history/range", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const startDate = new Date(req.query.start as string);
      const endDate = new Date(req.query.end as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      
      const history = await storage.getAccountHistoryByDateRange(accountId, startDate, endDate);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account history" });
    }
  });

  // Add a history entry
  app.post("/api/accounts/:id/history", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const historyData = insertAccountHistorySchema.parse({
        ...req.body,
        accountId
      });
      
      const newHistoryEntry = await storage.createAccountHistory(historyData);
      
      // Also update the current account value
      await storage.updateAccount(accountId, Number(historyData.value));
      
      res.status(201).json(newHistoryEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid history data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create history entry" });
    }
  });

  // ================== Portfolio Routes ==================
  
  // Get total portfolio value
  app.get("/api/portfolio/value", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const totalValue = await storage.getPortfolioValue(userId);
      res.json({ totalValue });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio value" });
    }
  });

  // Get portfolio history
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const startDate = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
      const endDate = req.query.end ? new Date(req.query.end as string) : new Date();
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      
      const history = await storage.getPortfolioHistory(userId, startDate, endDate);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio history" });
    }
  });

  // ================== Milestone Routes ==================
  
  // Get all milestones for a user
  app.get("/api/milestones", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const milestones = await storage.getMilestones(userId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Get a specific milestone
  app.get("/api/milestones/:id", async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const milestone = await storage.getMilestone(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestone" });
    }
  });

  // Create a new milestone
  app.post("/api/milestones", async (req, res) => {
    try {
      const userId = 1; // Demo user
      const milestoneData = insertMilestoneSchema.parse({
        ...req.body,
        userId
      });
      
      const newMilestone = await storage.createMilestone(milestoneData);
      res.status(201).json(newMilestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid milestone data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Update a milestone
  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const { isCompleted } = req.body;
      
      if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ message: "Invalid value. 'isCompleted' must be a boolean." });
      }
      
      const updatedMilestone = await storage.updateMilestone(milestoneId, isCompleted);
      res.json(updatedMilestone);
    } catch (error) {
      if (error instanceof Error && error.message === "Milestone not found") {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  // Delete a milestone
  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const success = await storage.deleteMilestone(milestoneId);
      
      if (!success) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // ================== FIRE Settings Routes ==================
  
  // Get FIRE settings for a user
  app.get("/api/fire-settings", async (req, res) => {
    try {
      const userId = 1; // Demo user
      let settings = await storage.getFireSettings(userId);
      
      // If no settings exist yet, create default ones
      if (!settings) {
        settings = await storage.createFireSettings({
          userId,
          targetRetirementAge: 60,
          annualIncomeGoal: 48000,
          expectedAnnualReturn: 7,
          safeWithdrawalRate: 4,
          monthlyInvestment: 1500,
          currentAge: 35
        });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FIRE settings" });
    }
  });

  // Update FIRE settings
  app.patch("/api/fire-settings", async (req, res) => {
    try {
      const userId = 1; // Demo user
      
      // Validate the partial update data
      const updateSchema = insertFireSettingsSchema.partial().omit({ userId: true });
      const validatedData = updateSchema.parse(req.body);
      
      // Get existing settings or create if not exist
      let settings = await storage.getFireSettings(userId);
      
      if (!settings) {
        settings = await storage.createFireSettings({
          userId,
          ...validatedData,
          targetRetirementAge: validatedData.targetRetirementAge || 60,
          annualIncomeGoal: validatedData.annualIncomeGoal || 48000,
          expectedAnnualReturn: validatedData.expectedAnnualReturn || 7,
          safeWithdrawalRate: validatedData.safeWithdrawalRate || 4,
          monthlyInvestment: validatedData.monthlyInvestment || 1500,
          currentAge: validatedData.currentAge || 35
        });
      } else {
        settings = await storage.updateFireSettings(userId, validatedData);
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid FIRE settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update FIRE settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
