import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertFireSettingsSchema } from "@shared/schema";

const router = Router();
const services = ServiceFactory.getInstance();
const fireSettingsService = services.getFireSettingsService();

// Get FIRE settings by ID
router.get("/:id", async (req, res) => {
  try {
    const settingsId = req.params.id;
    const settings = await fireSettingsService.get(settingsId);
    
    if (!settings) {
      return res.status(404).json({ message: "FIRE settings not found" });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get FIRE settings" });
  }
});

// Get FIRE settings by user account ID
router.get("/user/:userAccountId", async (req, res) => {
  try {
    const userAccountId = req.params.userAccountId;
    const settings = await fireSettingsService.getByUserAccountId(userAccountId);
    
    if (!settings) {
      return res.status(404).json({ message: "FIRE settings not found" });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get FIRE settings" });
  }
});

// Create FIRE settings
router.post("/", async (req, res) => {
  try {
    const settingsData = insertFireSettingsSchema.parse(req.body);
    const settings = await fireSettingsService.create(settingsData);
    res.status(201).json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid FIRE settings data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create FIRE settings" });
  }
});

// Update FIRE settings
router.patch("/:id", async (req, res) => {
  try {
    const settingsId = req.params.id;
    const settingsData = insertFireSettingsSchema.partial().parse(req.body);
    const settings = await fireSettingsService.update(settingsId, settingsData);
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid FIRE settings data", errors: error.errors });
    }
    if (error instanceof Error && error.message === "FIRE settings not found") {
      return res.status(404).json({ message: "FIRE settings not found" });
    }
    res.status(500).json({ message: "Failed to update FIRE settings" });
  }
});

// Delete FIRE settings
router.delete("/:id", async (req, res) => {
  try {
    const settingsId = req.params.id;
    const success = await fireSettingsService.delete(settingsId);
    
    if (!success) {
      return res.status(404).json({ message: "FIRE settings not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete FIRE settings" });
  }
});

// Update FIRE settings by user account ID
router.patch("/user/:userAccountId", async (req, res) => {
  try {
    const userAccountId = req.params.userAccountId;
    const settingsData = insertFireSettingsSchema.partial().parse(req.body);
    const settings = await fireSettingsService.updateByUserAccountId(userAccountId, settingsData);
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid FIRE settings data", errors: error.errors });
    }
    if (error instanceof Error && error.message === "FIRE settings not found") {
      return res.status(404).json({ message: "FIRE settings not found" });
    }
    res.status(500).json({ message: "Failed to update FIRE settings" });
  }
});

export default router; 
