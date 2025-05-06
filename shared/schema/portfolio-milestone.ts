import { z, ZodType } from "zod";
import { InsertMilestone as DBInsertMilestone, SelectMilestone as DBMilestone } from "@server/db/schema/portfolio-milestone";
import { IfConstructorEquals, Orphan } from "./utils";

export const milestoneOrphanInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetValue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target value must be a positive number",
  }),
  accountType: z.string().optional().nullable(),
});

type ZodMilestoneOrphan = z.infer<typeof milestoneOrphanInsertSchema>;
export type MilestoneOrphanInsert = IfConstructorEquals<ZodMilestoneOrphan, Orphan<DBInsertMilestone>, never>;
milestoneOrphanInsertSchema satisfies ZodType<MilestoneOrphanInsert>;

export const milestoneInsertSchema = milestoneOrphanInsertSchema.extend({
  userAccountId: z.string(),
});

type ZodMilestone = z.infer<typeof milestoneInsertSchema>;
export type MilestoneInsert = IfConstructorEquals<ZodMilestone, DBInsertMilestone, never>;
milestoneInsertSchema satisfies ZodType<MilestoneInsert>;

export type Milestone = DBMilestone;

