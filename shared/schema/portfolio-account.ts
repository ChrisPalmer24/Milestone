import { pgTable, text, real, numeric, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { userAccounts } from "./user-account";
import { sql } from "drizzle-orm";

export type AccountType = "ISA" | "CISA" | "SIPP" | "LISA" | "GIA" | "ALL";

// Account table to store investment account information
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userAccountId: uuid("user_account_id").notNull().references(() => userAccounts.id),
  provider: text("provider").notNull(),
  accountType: text("account_type").notNull(), // ISA, SIPP, LISA (Lifetime ISA), GIA (General Account)
  currentValue: real("current_value").notNull(),
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

export const orphanAccountSchema = insertAccountSchema.omit({
  userAccountId: true,
});

export type OrphanAccount = z.infer<typeof orphanAccountSchema>

export type Account = typeof accounts.$inferSelect;

// History table to track account value changes over time
export const accountHistory = pgTable("account_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  value: real("value").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Create base schema
const baseAccountHistorySchema = createInsertSchema(accountHistory).omit({
  id: true,
});

// Extend schema to handle date string
export const insertAccountHistorySchema = baseAccountHistorySchema.extend({
  recordedAt: z.string().transform((val) => new Date(val)),
});

export type InsertAccountHistory = z.infer<typeof insertAccountHistorySchema>;
export type AccountHistory = typeof accountHistory.$inferSelect;

export type AccountHistoryData = { accountId: string; history: AccountHistory[] }[];

export type PortfolioHistoryItem = { date: Date; value: number, changes: { accountId: string; previousValue: number; newValue: number; change: number }[] };
export type PortfolioHistory = PortfolioHistoryItem[];

export interface PortfolioValue {
  totalValue: number;
}
