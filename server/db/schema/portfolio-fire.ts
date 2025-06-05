import { pgTable, integer, numeric, uuid, boolean } from "drizzle-orm/pg-core";
import { userAccounts } from "./user-account";
import { InferInsertModelBasic, timestampColumns } from "./utils";
import { InferSelectModel, sql } from "drizzle-orm";

export const fireSettings = pgTable("fire_settings", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userAccountId: uuid("user_account_id").notNull().references(() => userAccounts.id),
  targetRetirementAge: integer("target_retirement_age").notNull(),
  annualIncomeGoal: numeric("annual_income_goal").notNull(),
  expectedAnnualReturn: numeric("expected_annual_return").notNull(), // Percentage
  safeWithdrawalRate: numeric("safe_withdrawal_rate").notNull(), // Percentage
  monthlyInvestment: numeric("monthly_investment").notNull(),
  currentAge: integer("current_age").notNull(),
  adjustInflation: boolean("adjust_inflation").default(true).notNull(),
  ...timestampColumns()
});

export type InsertFireSettings = InferInsertModelBasic<typeof fireSettings>;
export type SelectFireSettings = InferSelectModel<typeof fireSettings>;
