import { z, ZodType } from "zod";
import { InsertFireSettings as DBInsertFireSettings, SelectFireSettings as DBSelectFireSettings } from "@server/db/schema/portfolio-fire";
import { IfConstructorEquals, Orphan } from "./utils";

const DEFAULT_TARGET_RETIREMENT_AGE = 60;
const DEFAULT_ANNUAL_INCOME_GOAL = 48000;
const DEFAULT_EXPECTED_ANNUAL_RETURN = 7;
const DEFAULT_SAFE_WITHDRAWAL_RATE = 4;
const DEFAULT_MONTHLY_INVESTMENT = 300;
const DEFAULT_CURRENT_AGE = 35;
const DEFAULT_ADJUST_INFLATION = true;

export const defaultValues = {
  targetRetirementAge: DEFAULT_TARGET_RETIREMENT_AGE,
  annualIncomeGoal: DEFAULT_ANNUAL_INCOME_GOAL,
  expectedAnnualReturn: DEFAULT_EXPECTED_ANNUAL_RETURN,
  safeWithdrawalRate: DEFAULT_SAFE_WITHDRAWAL_RATE,
  monthlyInvestment: DEFAULT_MONTHLY_INVESTMENT,
  currentAge: DEFAULT_CURRENT_AGE,
  adjustInflation: DEFAULT_ADJUST_INFLATION,
};

export const fireSettingsOrphanSchema = z.object({
  targetRetirementAge: z.number().int(),
  annualIncomeGoal: z.string(),
  expectedAnnualReturn: z.string(),
  safeWithdrawalRate: z.string(),
  monthlyInvestment: z.string(),
  currentAge: z.number().int(),
  adjustInflation: z.boolean().default(DEFAULT_ADJUST_INFLATION),
});

type ZodFireSettingsOrphan = z.infer<typeof fireSettingsOrphanSchema>;
export type FireSettingsOrphan = IfConstructorEquals<ZodFireSettingsOrphan, Orphan<DBInsertFireSettings>, never>;
fireSettingsOrphanSchema satisfies ZodType<FireSettingsOrphan>;

export const fireSettingsInsertSchema = fireSettingsOrphanSchema.extend({
  userAccountId: z.string(),
});

type ZodFireSettingsInsert = z.infer<typeof fireSettingsInsertSchema>;
export type FireSettingsInsert = IfConstructorEquals<ZodFireSettingsInsert, DBInsertFireSettings, never>;
fireSettingsInsertSchema satisfies ZodType<FireSettingsInsert>;

export type FireSettings = DBSelectFireSettings;



