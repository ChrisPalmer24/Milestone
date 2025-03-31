import { pgTable, serial, integer, numeric} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user-account";

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
