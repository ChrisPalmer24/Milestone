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
  BrokerProviderAssetSecuritySelect as DBBrokerProviderAssetSecuritySelect,
  BrokerProviderAssetSecurityInsert as DBBrokerProviderAssetSecurityInsert,
  // AssetDebitInsert as DBAssetDebitInsert,
  // AssetDebitSelect as DBAssetDebitSelect,
  BrokerProviderAssetAPIKeyConnectionSelect as DBBrokerProviderAssetAPIKeyConnection,
  BrokerProviderSelect as DBBrokerProvider,
  AccountType as DBAccountType,
  RecurringContributionInsert as DBRecurringContributionInsert,
  RecurringContributionSelect as DBRecurringContributionSelect,
  ContributionInterval as DBContributionInterval,
 } from "@server/db/schema/index";
import { ExtractCommonFields, IfConstructorEquals, Orphan } from "./utils";
import { securityInsertSchema, SecuritySearchResult } from "./securities";

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

export const brokerProviderAssetSecurityInsertSchema = z.object({
  tempId: z.string(),
  security: securityInsertSchema,
  shareHolding: z.number().transform((val) => typeof val === "string" ? parseFloat(val) : val),
  gainLoss: z.number().transform((val) => typeof val === "string" ? parseFloat(val) : val),
  recordedAt: z.coerce.date().optional(),
})

export type BrokerProviderInsertSecurityItem = z.infer<typeof brokerProviderAssetSecurityInsertSchema>;

export const brokerProviderAssetOrphanInsertSchema = z.object({
  name: z.string(),
  providerId: z.string(),
  accountType: z.string(),
  currentValue: z.number().optional(),
  securities: z.array(brokerProviderAssetSecurityInsertSchema),
  contributions: z.object({
    process: z.enum(['automatic', 'manual']),
    amount: z.number(),
    date: z.coerce.date(),
    securityDistribution: z.array(z.object({
      securityTempId: z.string(),
      securityName: z.string(),
      commitment: z.number(),
    })),
    notificationPeriod: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    notificationEmail: z.boolean(),
    notificationPush: z.boolean(),
  }),
})

type ZodBrokerProviderAssetOrphan = z.infer<typeof brokerProviderAssetOrphanInsertSchema>;
export type BrokerProviderAssetOrphanInsert = ZodBrokerProviderAssetOrphan
//export type BrokerProviderAssetOrphanInsert = IfConstructorEquals<ZodBrokerProviderAssetOrphan, Orphan<DBBrokerProviderAssetInsert>, never>;
brokerProviderAssetOrphanInsertSchema satisfies ZodType<BrokerProviderAssetOrphanInsert>;

export const brokerProviderAssetInsertSchema = brokerProviderAssetOrphanInsertSchema.extend({
  userAccountId: z.string()
})

type ZodBrokerProviderAssetInsert = z.infer<typeof brokerProviderAssetInsertSchema>;
// export type BrokerProviderAssetInsert = IfConstructorEquals<ZodBrokerProviderAsset, DBBrokerProviderAssetInsert, never>;
// brokerProviderAssetInsertSchema satisfies ZodType<BrokerProviderAssetInsert>;
export type BrokerProviderAssetInsert = ZodBrokerProviderAssetInsert


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

export type BrokerProviderAssetSecuritySelect = DBBrokerProviderAssetSecuritySelect
export type BrokerProviderAssetSecurityInsert = DBBrokerProviderAssetSecurityInsert

export type AssetsChange = {
  startDate: Date;
  endDate: Date;
  startValue: number;
  value: number;
  currencyChange: number;
  percentageChange: number;
};

export type WithAccountChange<T extends { id: string }> = T & { accountChange: AssetsChange };
export type WithAssetHistory<T extends { id: string }> = T & { history: AssetValue[] };

//This is used when a dummy asset value is needed for a date range that is before the first asset value
export type PossibleDummyAssetValue = Omit<AssetValue, "id"> & { id: string | null };

export type DataRangeQuery = {
  start: Date | string | null;
  end: Date | string | null;
}

export type AssetWithHistory = {
  id: string;
  history: AssetValue[];
}
