import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertAccountSchema } from "@shared/schema";

const router = Router();
const services = ServiceFactory.getInstance();
const accountService = services.getAccountService();

// Get portfolio history
router.get("/history", async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    // For now, hardcode userId to 1 since we don't have authentication yet
    const userId = 1;
    const history = await accountService.getPortfolioHistory(
      userId,
      new Date(start as string),
      new Date(end as string)
    );

    res.json(history);
  } catch (error) {

    if (error instanceof Error && error.message.includes("Invalid Date")) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    res.status(500).json({ message: "Failed to get portfolio history" });
  }
});

export default router; 
