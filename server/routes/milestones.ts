import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertMilestoneSchema } from "@shared/schema";
import { AuthRequest, AuthService } from "../auth";

const services = ServiceFactory.getInstance();
const milestoneService = services.getMilestoneService();

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser } = authService.getAuthMiddlewares();

  // Get all milestones for a user
  router.get(
    "/user/:userAccountId",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const userAccountId = req.params.userAccountId;
        const milestones = await milestoneService.getByUserAccountId(
          userAccountId
        );
        res.json(milestones);
      } catch (error) {
        res.status(500).json({ message: "Failed to get milestones" });
      }
    }
  );

  // Get milestone by ID
  router.get("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const milestoneId = req.params.id;
      const milestone = await milestoneService.get(milestoneId);

      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to get milestone" });
    }
  });

  // Create milestone
  router.post("/", requireUser, async (req: AuthRequest, res) => {
    try {
      const milestoneData = insertMilestoneSchema.parse(req.body);
      const milestone = await milestoneService.create(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid milestone data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Update milestone
  router.patch("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const milestoneId = req.params.id;
      const milestoneData = insertMilestoneSchema.partial().parse(req.body);
      const milestone = await milestoneService.update(
        milestoneId,
        milestoneData
      );
      res.json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid milestone data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Milestone not found") {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  // Delete milestone
  router.delete("/:id", requireUser, async (req: AuthRequest, res) => {
    try {
      const milestoneId = req.params.id;
      const success = await milestoneService.delete(milestoneId);

      if (!success) {
        return res.status(404).json({ message: "Milestone not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // Update milestone completion
  router.patch(
    "/:id/completion",
    requireUser,
    async (req: AuthRequest, res) => {
      try {
        const milestoneId = req.params.id;
        const { isCompleted } = req.body;

        if (typeof isCompleted !== "boolean") {
          return res
            .status(400)
            .json({ message: "isCompleted must be a boolean" });
        }

        const milestone = await milestoneService.updateCompletion(
          milestoneId,
          isCompleted
        );
        res.json(milestone);
      } catch (error) {
        if (error instanceof Error && error.message === "Milestone not found") {
          return res.status(404).json({ message: "Milestone not found" });
        }
        res
          .status(500)
          .json({ message: "Failed to update milestone completion" });
      }
    }
  );

  return router;
}
