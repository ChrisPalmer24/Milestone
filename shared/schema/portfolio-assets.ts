import { z, ZodObject, ZodType } from "zod";
import {
  GeneralAssetInsert as DBGeneralAssetInsert,
  BrokerProviderAssetInsert as DBBrokerProviderAssetInsert,
  BrokerProviderAssetSelect as DBBrokerProviderAsset,
  GeneralAssetSelect as DBGeneralAsset,
  AssetValueInsert as DBAssetValueInsert,
  AssetValueSelect as DBAssetValueSelect,
  AssetContributionInsert as DBAssetContributionInsert,
  AssetContributionSelect as DBAssetContribution,
  // AssetDebitInsert as DBAssetDebitInsert,
  // AssetDebitSelect as DBAssetDebitSelect,
  BrokerProviderAssetAPIKeyConnectionSelect as DBBrokerProviderAssetAPIKeyConnection,
  BrokerProviderSelect as DBBrokerProvider,
  AccountType as DBAccountType,
  RecurringContributionInsert as DBRecurringContributionInsert,
  RecurringContributionSelect as DBRecurringContributionSelect,
  ContributionInterval as DBContributionInterval,
 } from "@server/db/schema/index";
import { ExtractCommonFields, IfConstructorEquals, Orphan, WithAccountChange, WithCurrentBalance, WithInitialBalance } from "./utils";

export type AssetType = "general" | "broker";

export const generalAssetOrphanInsertSchema = z.object({
  name: z.string(),
  currentValue: z.number().optional(),
})

type ZodGeneralAssetOrphan = z.infer<typeof generalAssetOrphanInsertSchema>;
export type GeneralAssetOrphanInsert = IfConstructorEquals<ZodGeneralAssetOrphan, Orphan<DBGeneralAssetInsert>, never>;
generalAssetOrphanInsertSchema satisfies ZodType<GeneralAssetOrphanInsert>;

export const generalAssetInsertSchema = generalAssetOrphanInsertSchema.extend({
  userAccountId: z.string(),
});

type ZodGeneralAsset = z.infer<typeof generalAssetInsertSchema>;
export type GeneralAssetInsert = IfConstructorEquals<ZodGeneralAsset, DBGeneralAssetInsert, never>;
generalAssetInsertSchema satisfies ZodType<GeneralAssetInsert>;

export type GeneralAsset = DBGeneralAsset
export type GeneralAssetWithAccountChange = WithAccountChange<GeneralAsset>

export const brokerProviderAssetOrphanInsertSchema = z.object({
  name: z.string(),
  providerId: z.string(),
  accountType: z.string(),
  currentValue: z.number().optional(),
})

type ZodBrokerProviderAssetOrphan = z.infer<typeof brokerProviderAssetOrphanInsertSchema>;
export type BrokerProviderAssetOrphanInsert = IfConstructorEquals<ZodBrokerProviderAssetOrphan, Orphan<DBBrokerProviderAssetInsert>, never>;
brokerProviderAssetOrphanInsertSchema satisfies ZodType<BrokerProviderAssetOrphanInsert>;

export const brokerProviderAssetInsertSchema = brokerProviderAssetOrphanInsertSchema.extend({
  userAccountId: z.string()
})

type ZodBrokerProviderAsset = z.infer<typeof brokerProviderAssetInsertSchema>;
export type BrokerProviderAssetInsert = IfConstructorEquals<ZodBrokerProviderAsset, DBBrokerProviderAssetInsert, never>;
brokerProviderAssetInsertSchema satisfies ZodType<BrokerProviderAssetInsert>;

export type BrokerProviderAsset = DBBrokerProviderAsset
export type BrokerProviderAssetWithAccountChange = WithAccountChange<BrokerProviderAsset>


export const assetValueOrphanInsertSchema = z.object({
  value: z.number(),
  recordedAt: z.coerce.date(),
})

type ZodAssetValueOrphanInsert = z.infer<typeof assetValueOrphanInsertSchema>;
export type AssetValueOrphanInsert = IfConstructorEquals<ZodAssetValueOrphanInsert, Omit<DBAssetValueInsert, "assetId">, never>;
assetValueOrphanInsertSchema satisfies ZodType<AssetValueOrphanInsert>;

export const assetValueInsertSchema = assetValueOrphanInsertSchema.extend({
  assetId: z.string()
})

type ZodAssetValueInsert = z.infer<typeof assetValueInsertSchema>;
export type AssetValueInsert = IfConstructorEquals<ZodAssetValueInsert, DBAssetValueInsert, never>;
assetValueInsertSchema satisfies ZodType<AssetValueInsert>;

export type AssetValue = DBAssetValueSelect

// export const assetDebitOrphanInsertSchema = z.object({
//   value: z.number(),
//   recordedAt: z.coerce.date(),
// })

// type ZodAssetDebitOrphanInsert = z.infer<typeof assetDebitOrphanInsertSchema>;
// export type AssetDebitOrphanInsert = IfConstructorEquals<ZodAssetDebitOrphanInsert, Omit<DBAssetDebitInsert, "assetId">, never>;
// assetDebitOrphanInsertSchema satisfies ZodType<AssetDebitOrphanInsert>;

// export const assetDebitInsertSchema = assetDebitOrphanInsertSchema.extend({
//   assetId: z.string()
// })

// type ZodAssetDebitInsert = z.infer<typeof assetDebitInsertSchema>;
// export type AssetDebitInsert = IfConstructorEquals<ZodAssetDebitInsert, DBAssetDebitInsert, never>;
// assetDebitInsertSchema satisfies ZodType<AssetDebitInsert>;

// export type AssetDebit = DBAssetDebitSelect;

export const assetContributionOrphanInsertSchema = z.object({
  value: z.number(),
  recordedAt: z.coerce.date(),
})

type ZodAssetContributionOrphanInsert = z.infer<typeof assetContributionOrphanInsertSchema>;
export type AssetContributionOrphanInsert = IfConstructorEquals<ZodAssetContributionOrphanInsert, Omit<DBAssetContributionInsert, "assetId">, never>;
assetContributionOrphanInsertSchema satisfies ZodType<AssetContributionOrphanInsert>;

export const assetContributionInsertSchema = assetContributionOrphanInsertSchema.extend({
  assetId: z.string()
})

type ZodAssetContributionInsert = z.infer<typeof assetContributionInsertSchema>;
export type AssetContributionInsert = IfConstructorEquals<ZodAssetContributionInsert, DBAssetContributionInsert, never>;
assetContributionInsertSchema satisfies ZodType<AssetContributionInsert>;

export type AssetContribution = DBAssetContribution;

export type ContributionInterval = DBContributionInterval;

export const recurringContributionOrphanInsertSchema = z.object({
  amount: z.number().positive(),
  startDate: z.coerce.date(),
  interval: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
});

type ZodRecurringContributionOrphanInsert = z.infer<typeof recurringContributionOrphanInsertSchema>;
export type RecurringContributionOrphanInsert = IfConstructorEquals<ZodRecurringContributionOrphanInsert, Omit<DBRecurringContributionInsert, "isActive" | "lastProcessedDate" | "assetId">, never>;
recurringContributionOrphanInsertSchema satisfies ZodType<RecurringContributionOrphanInsert>;

export const recurringContributionInsertSchema = recurringContributionOrphanInsertSchema.extend({
  assetId: z.string()
});

type ZodRecurringContributionInsert = z.infer<typeof recurringContributionInsertSchema>;
export type RecurringContributionInsert = IfConstructorEquals<ZodRecurringContributionInsert, Omit<DBRecurringContributionInsert, "isActive" | "lastProcessedDate">, never>;
recurringContributionInsertSchema satisfies ZodType<RecurringContributionInsert>;

export type RecurringContribution = DBRecurringContributionSelect;

export type Asset = ExtractCommonFields<GeneralAsset, BrokerProviderAsset>;

export type PotfolioValue = {
  totalValue: number;
  totalChange: number;
  totalChangePercentage: number;
}

export type PortfolioHistoryTimePoint = {
  date: Date;
  value: number;
  changes: {
    assetId: Asset["id"];
    previousValue: number;
    newValue: number;
    change: number;
  }[];
}

export type BrokerProviderAssetAPIKeyConnection = DBBrokerProviderAssetAPIKeyConnection

export type AccountType = DBAccountType

export type BrokerProvider = DBBrokerProvider





//.export type GeneralAssetOrphanInsert = IfEquals<ZodGeneralAssetOrphan, DBGeneralAssetInsertOrphan, never>;
