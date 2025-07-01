import { pgTable, text, timestamp, boolean, real, pgEnum, check, uuid } from "drizzle-orm/pg-core";
import { userAccounts } from "./user-account";
import { InferInsertModelBasic, timestampColumns, slugify } from "./utils";
import { relations, InferSelectModel, sql } from "drizzle-orm";
import { IncludeRelation } from "../types/utils";
import { InferResultType } from "../types/utils";
export const accountType = ['ISA', 'CISA', 'SIPP', 'LISA', 'GIA'] as const;
export const accountTypeEnum = pgEnum('account_type', accountType);
export const contributionInterval = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;
export const contributionIntervalEnum = pgEnum('contribution_interval', contributionInterval);

export type AccountType = (typeof accountType)[number];
export type ContributionInterval = (typeof contributionInterval)[number];

export const assetValues = pgTable("asset_values", {
  id: uuid('id').notNull().default(sql`gen_random_uuid()`),
  value: real("value").notNull(),
  recordedAt: timestamp("recorded_at").notNull(),
  assetId: uuid("asset_id").notNull(),
  ...timestampColumns()
});

export type AssetValueSelect = InferSelectModel<typeof assetValues>;
export type AssetValueInsert = InferInsertModelBasic<typeof assetValues>;


export const assetContributions = pgTable("asset_contributions", {
  id: uuid('id').notNull().default(sql`gen_random_uuid()`),
  value: real("value").notNull(),
  recordedAt: timestamp("recorded_at").notNull(),
  assetId: uuid("asset_id").notNull(),
  ...timestampColumns()
});

export type AssetContributionSelect = InferSelectModel<typeof assetContributions>;
export type AssetContributionInsert = InferInsertModelBasic<typeof assetContributions>;

// export const assetDebits = pgTable("asset_debits", {
//   id: uuid('id').notNull().default(sql`gen_random_uuid()`),
//   value: real("value").notNull(),
//   recordedAt: timestamp("recorded_at").notNull(),
//   assetId: uuid("asset_id").notNull(),
//   ...timestampColumns()
// });

// export type AssetDebitSelect = InferSelectModel<typeof assetDebits>;
// export type AssetDebitInsert = InferInsertModelBasic<typeof assetDebits>;

export const recurringContributions = pgTable("recurring_contributions", {
  id: uuid('id').notNull().default(sql`gen_random_uuid()`),
  assetId: uuid("asset_id").notNull(),
  amount: real("amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  interval: contributionIntervalEnum("interval").notNull(),
  lastProcessedDate: timestamp("last_processed_date"),
  isActive: boolean("is_active").notNull().default(true),
  ...timestampColumns()
});

export type RecurringContributionSelect = InferSelectModel<typeof recurringContributions>;
export type RecurringContributionInsert = InferInsertModelBasic<typeof recurringContributions>;

export const generalAssets = pgTable("general_assets", {
  id: uuid('id').notNull().default(sql`gen_random_uuid()`),
  assetType: text("asset_type").notNull().default("general"),
  name: text("name").notNull().unique(),
  currentValue: real("current_value").notNull().default(0),
  userAccountId: uuid("user_account_id").notNull().references(() => userAccounts.id),
  ...timestampColumns()
}, (t) => [
  //Ensure asset type is general
  check("asset_type_check", sql`${t.assetType} = 'general'`)
]);

export type GeneralAssetSelect = InferSelectModel<typeof generalAssets>;
export type GeneralAssetInsert = InferInsertModelBasic<typeof generalAssets>;

export const brokerProviders = pgTable("broker_providers", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  //slug: text("slug").notNull().unique().default(slugify("name")),
  supportsAPIKey: boolean("supports_api_key").notNull().default(false),
  supportedAccountTypes: accountTypeEnum("supported_account_types").array().notNull(),
  ...timestampColumns()
});

export type BrokerProviderSelect = InferSelectModel<typeof brokerProviders>;
export type BrokerProviderInsert = InferInsertModelBasic<typeof brokerProviders>;

export const brokerProviderAssets = pgTable("broker_provider_assets", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  assetType: text("asset_type").notNull().default("broker"),
  name: text("name").notNull().unique(),
  currentValue: real("current_value").notNull().default(0),
  userAccountId: uuid("user_account_id").notNull().references(() => userAccounts.id),
  providerId: uuid("provider_id").notNull().references(() => brokerProviders.id),
  accountType: text("account_type").notNull(), // ISA, SIPP, LISA (Lifetime ISA), GIA (General Account)
  ...timestampColumns()
}, (t) => [
  //Ensure asset type is broker
  check("asset_type_check", sql`${t.assetType} = 'broker'`)
]);

export const brokerProviderAssetAPIKeyConnections = pgTable("broker_provider_asset_api_key_connections", {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  brokerProviderAssetId: uuid("broker_provider_asset_id").notNull().references(() => brokerProviderAssets.id),
  apiKey: text("api_key").notNull(),
  ...timestampColumns()
});

export const brokerProviderAssetsRelations = relations(brokerProviderAssets, ({ one, many }) => ({
  provider: one(brokerProviders, {
    fields: [brokerProviderAssets.providerId],
    references: [brokerProviders.id],
  }),
  apiKeyConnections: one(brokerProviderAssetAPIKeyConnections),
  recurringContributions: many(recurringContributions),
}));

export const recurringContributionsRelations = relations(recurringContributions, ({ one }) => ({
  asset: one(brokerProviderAssets, {
    fields: [recurringContributions.assetId],
    references: [brokerProviderAssets.id],
  }),
}));

export type BrokerProviderAssetSelect = InferSelectModel<typeof brokerProviderAssets>;
export type BrokerProviderAssetInsert = InferInsertModelBasic<typeof brokerProviderAssets>;

export type BrokerProviderAssetAPIKeyConnectionSelect = InferSelectModel<typeof brokerProviderAssetAPIKeyConnections>;
export type BrokerProviderAssetAPIKeyConnectionInsert = InferInsertModelBasic<typeof brokerProviderAssetAPIKeyConnections>;

export type BrokerProviderAssetWith<W extends IncludeRelation<"brokerProviderAssets"> | undefined = undefined>  = InferResultType<"brokerProviderAssets", W>

export type AssetSelect = GeneralAssetSelect & BrokerProviderAssetSelect
