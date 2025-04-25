import { Express, Router } from "express";
import { registerRoutes as registerUserRoutes} from "./users";
import { registerRoutes as registerAccountsRoutes} from "./accounts";
import { registerRoutes as registerHistoryRoutes} from "./account-history";
import { registerRoutes as registerMilestonesRoutes} from "./milestones";
import { registerRoutes as registerFireRoutes} from "./fire-settings";
import { registerRoutes as registerPortfolioRoutes} from "./portfolio";
import { registerRoutes as registerAuthRoutes } from "./auth";
import { registerRoutes as registerVerificationRoutes } from "./verification"
import { AuthService } from "server/auth";


export async function registerRoutes(router: Router, authService: AuthService): Promise<Router> {
  // Register API routes
  router.use("/users", await registerUserRoutes(Router(), authService));
  router.use("/accounts", await registerAccountsRoutes(Router(), authService));
  router.use("/account-history", await registerHistoryRoutes(Router(), authService));
  router.use("/milestones", await registerMilestonesRoutes(Router(), authService));
  router.use("/fire-settings", await registerFireRoutes(Router(), authService));
  router.use("/portfolio", await registerPortfolioRoutes(Router(), authService));
  router.use("/auth", await registerAuthRoutes(Router(), authService));
  router.use("/verification", await registerVerificationRoutes(Router(), authService));
  return router;
} 
