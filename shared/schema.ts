import { pgTable, text, serial, integer, numeric, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type AccountType = "ISA" | "SIPP" | "LISA" | "GIA" | "ALL";

// Account table to store investment account information
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  accountType: text("account_type").notNull(), // ISA, SIPP, LISA (Lifetime ISA), GIA (General Account)
  currentValue: numeric("current_value").notNull(),
  isApiConnected: boolean("is_api_connected").default(false).notNull(),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApiConnected: true,
  apiKey: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// History table to track account value changes over time
export const accountHistory = pgTable("account_history", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  value: numeric("value").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertAccountHistorySchema = createInsertSchema(accountHistory).omit({
  id: true,
});

export type InsertAccountHistory = z.infer<typeof insertAccountHistorySchema>;
export type AccountHistory = typeof accountHistory.$inferSelect;

export type PortfolioHistoryItem = { date: Date; value: number };
export type PortfolioHistory = PortfolioHistoryItem[];

export interface PortfolioValue {
  totalValue: number;
}

// Milestones table to track investment goals
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  targetValue: numeric("target_value").notNull(),
  accountType: text("account_type"), // Optional, can be specific to an account type (ISA, SIPP, LISA, GIA) or null for total portfolio
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  isCompleted: true,
  createdAt: true,
});

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

// FIRE settings for retirement planning
export const fireSettings = pgTable("fire_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  targetRetirementAge: integer("target_retirement_age").default(60).notNull(),
  annualIncomeGoal: numeric("annual_income_goal").default("48000").notNull(),
  expectedAnnualReturn: numeric("expected_annual_return").default("7").notNull(), // Percentage
  safeWithdrawalRate: numeric("safe_withdrawal_rate").default("4").notNull(), // Percentage
  monthlyInvestment: numeric("monthly_investment").default("300").notNull(),
  currentAge: integer("current_age").default(35).notNull(),
});

export const insertFireSettingsSchema = createInsertSchema(fireSettings).omit({
  id: true,
});

export type InsertFireSettings = z.infer<typeof insertFireSettingsSchema>;
export type FireSettings = typeof fireSettings.$inferSelect;
