import { Router } from "express";
import { ServiceFactory } from "../services/factory";
import { AuthRequest, AuthService, requireTenant } from "server/auth";

const router = Router();
const services = ServiceFactory.getInstance();
const accountService = services.getAccountService();

export async function registerRoutes(
  router: Router,
  authService: AuthService
): Promise<Router> {
  const { requireUser } = authService.getAuthMiddlewares();

  // Get portfolio history
  router.get("/history", requireUser, async (req: AuthRequest, res) => {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res
          .status(400)
          .json({ message: "Start date and end date are required" });
      }

      const response = await requireTenant(req.tenant, async (tenant) => {
        const history = await accountService.getPortfolioHistory(
          tenant.userAccountId ?? "",
          new Date(start as string),
          new Date(end as string)
        );

        return history;
      });

      res.json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid Date")) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      res.status(500).json({ message: "Failed to get portfolio history" });
    }
  });

  // Get total portfolio value
  router.get("/value", requireUser, async (req: AuthRequest, res) => {
    try {
      const response = await requireTenant(req.tenant, async (tenant) => {
        const totalValue = await accountService.getPortfolioValue(
          tenant.userAccountId ?? ""
        );
        return totalValue;
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio value" });
    }
  });

  return router;
}
