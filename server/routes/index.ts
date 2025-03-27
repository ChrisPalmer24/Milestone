import { Express } from "express";
import { Server } from "http";
import userRoutes from "./users";
import accountRoutes from "./accounts";
import accountHistoryRoutes from "./account-history";
import milestoneRoutes from "./milestones";
import fireSettingsRoutes from "./fire-settings";
import portfolioRoutes from "./portfolio";
export async function registerRoutes(app: Express): Promise<Express> {
  // Register API routes
  app.use("/api/users", userRoutes);
  app.use("/api/accounts", accountRoutes);
  app.use("/api/account-history", accountHistoryRoutes);
  app.use("/api/milestones", milestoneRoutes);
  app.use("/api/fire-settings", fireSettingsRoutes);
  app.use("/api/portfolio", portfolioRoutes);

  return app;
} 
