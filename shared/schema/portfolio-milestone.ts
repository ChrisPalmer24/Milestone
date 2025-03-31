import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./user-account";
import { cuid, idColumn } from "./utils";
// Milestones table to track investment goals
export const milestones = pgTable("milestones", {
  id: idColumn(),
  userId: cuid("user_id").notNull().references(() => users.id),
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

