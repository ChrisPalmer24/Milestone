import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertAccountHistorySchema } from "@server/db/schema/portfolio-account";
import { AuthRequest, AuthService } from "../auth";

const services = ServiceFactory.getInstance();
const accountHistoryService = services.getAccountHistoryService();

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser } = authService.getAuthMiddlewares();

  // Get history by ID
  router.get("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const historyId = req.params.id;
      const history = await accountHistoryService.get(historyId);

      if (!history) {
        return res.status(404).json({ message: "History entry not found" });
      }

      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get history entry" });
    }
  });

  // Get all history for an asset
  router.get(
    "/asset/:assetId",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const accountId = req.params.accountId;
        const history = await accountHistoryService.getByAccountId(accountId);
        res.json(history);
      } catch (error) {
        res.status(500).json({ message: "Failed to get account history" });
      }
    }
  );

  // Get history by date range
  router.get(
    "/asset/:assetId/range",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const accountId = req.params.accountId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
          return res
            .status(400)
            .json({ message: "Start date and end date are required" });
        }

        const history = await accountHistoryService.getByDateRange(
          accountId,
          new Date(startDate as string),
          new Date(endDate as string)
        );
        res.json(history);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Invalid Date")) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        res.status(500).json({ message: "Failed to get account history" });
      }
    }
  );

  // Create history entry
  router.post("/", requireUser, async (req: AuthRequest, res) => {
    try {
      const historyData = insertAccountHistorySchema.parse(req.body);
      const history = await accountHistoryService.create(historyData);
      res.status(201).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid history data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create history entry" });
    }
  });

  // Update history entry
  router.put("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const historyId = req.params.id;
      const historyData = insertAccountHistorySchema.partial().parse(req.body);
      const history = await accountHistoryService.update(
        historyId,
        historyData
      );

      if (!history) {
        return res.status(404).json({ message: "History entry not found" });
      }

      res.json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid history data", errors: error.errors });
      }
      if (
        error instanceof Error &&
        error.message === "History entry not found"
      ) {
        return res.status(404).json({ message: "History entry not found" });
      }
      res.status(500).json({ message: "Failed to update history entry" });
    }
  });

  // Delete history entry
  router.delete("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const historyId = req.params.id;
      const success = await accountHistoryService.delete(historyId);

      if (!success) {
        return res.status(404).json({ message: "History entry not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete history entry" });
    }
  });
  return router;
}
