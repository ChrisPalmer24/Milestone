import { Router } from "express";
import { z } from "zod";
import { ServiceFactory } from "../services/factory";
import { insertUserSchema } from "@shared/schema";

const router = Router();
const services = ServiceFactory.getInstance();
const userService = services.getUserService();

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.get(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Get user by username
router.get("/username/:username", async (req, res) => {
  try {
    const user = await userService.getByUsername(req.params.username);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to get user" });
  }
});

// Create user
router.post("/", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await userService.create(userData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Update user
router.patch("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userData = insertUserSchema.partial().parse(req.body);
    const user = await userService.update(userId, userData);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const success = await userService.delete(userId);
    
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router; 
