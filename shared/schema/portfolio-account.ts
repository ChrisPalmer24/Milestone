import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user-account";
import { cuid, idColumn } from "./utils";

export type AccountType = "ISA" | "SIPP" | "LISA" | "GIA" | "ALL";

// Account table to store investment account information
export const accounts = pgTable("accounts", {
  id: idColumn(),
  userId: cuid("user_id").notNull().references(() => users.id),
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

export type InsertAccount = Omit<z.infer<typeof insertAccountSchema>, "accountType"> & {
  accountType: AccountType;
};
export type Account = typeof accounts.$inferSelect;

// History table to track account value changes over time
export const accountHistory = pgTable("account_history", {
  id: idColumn(),
  accountId: cuid("account_id").notNull().references(() => accounts.id),
  value: numeric("value").notNull(),
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

export type PortfolioHistoryItem = { date: Date; value: number, changes: { accountId: number; previousValue: number; newValue: number; change: number }[] };
export type PortfolioHistory = PortfolioHistoryItem[];

export interface PortfolioValue {
  totalValue: number;
}
