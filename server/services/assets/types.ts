import { AssetContributionInsert, AssetValueInsert, AssetValue, BrokerProviderAsset, BrokerProviderAssetInsert, GeneralAsset, GeneralAssetInsert, UserAccount, AssetContribution, PortfolioHistoryTimePoint, BrokerProviderAssetAPIKeyConnection, BrokerProvider, BrokerProviderAssetWithAccountChange, GeneralAssetWithAccountChange, AssetsChange, AssetValueOrphanInsert, AssetContributionOrphanInsert, RecurringContribution, RecurringContributionOrphanInsert, DataRangeQuery } from "@shared/schema";
import { QueryParams } from "@server/utils/resource-query-builder";

export interface IAssetService {

  getBrokerProviderAssetsForUser(userId: UserAccount["id"], query: QueryParams): Promise<BrokerProviderAsset[]>;
  getBrokerProviderAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParams): Promise<BrokerProviderAssetWithAccountChange[]>;
  getBrokerProviderAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParams): Promise<BrokerProviderAsset[]>;
  getBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<BrokerProviderAsset>;
  createBrokerProviderAsset(data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset>;
  updateBrokerProviderAsset(id: BrokerProviderAsset["id"], data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset>;
  deleteBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<boolean>;
  getBrokerProviderAssetHistory(id: BrokerProviderAsset["id"], query: QueryParams): Promise<AssetValue[]>;
  getBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], query: QueryParams): Promise<AssetContribution[]>;
  createBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], data: AssetValueOrphanInsert): Promise<AssetValue>;
  createBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution>;
  updateBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue>;
  updateBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], assetContributionId: AssetContribution["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution>;
  deleteBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean>;
  deleteBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], assetContributionId: AssetContribution["id"]): Promise<boolean>;
  setBrokerProviderAPIKey(id: BrokerProviderAsset["id"], apiKey: string): Promise<BrokerProviderAssetAPIKeyConnection>;

  getGeneralAssetsForUser(userId: UserAccount["id"], query: QueryParams): Promise<GeneralAsset[]>;
  getGeneralAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParams): Promise<GeneralAssetWithAccountChange[]>;
  getGeneralAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParams): Promise<GeneralAsset[]>;
  getGeneralAsset(id: GeneralAsset["id"]): Promise<GeneralAsset>;
  createGeneralAsset(data: GeneralAssetInsert): Promise<GeneralAsset>;
  updateGeneralAsset(id: GeneralAsset["id"], data: GeneralAssetInsert): Promise<GeneralAsset>;
  deleteGeneralAsset(id: GeneralAsset["id"]): Promise<boolean>;
  getGeneralAssetHistory(assetId: GeneralAsset["id"], query: QueryParams): Promise<GeneralAsset[]>;
  createGeneralAssetValueHistory(assetId: GeneralAsset["id"], data: AssetValueOrphanInsert): Promise<AssetValue>;
  createGeneralAssetContributionHistory(assetId: GeneralAsset["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution>;
  updateGeneralAssetValueHistory(assetId: GeneralAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue>;
  updateGeneralAssetContributionHistory(assetId: GeneralAsset["id"], assetContributionId: AssetContribution["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution>;
  deleteGeneralAssetValueHistory(assetId: GeneralAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean>;
  deleteGeneralAssetContributionHistory(assetId: GeneralAsset["id"], assetContributionId: AssetContribution["id"]): Promise<boolean>;

  getPortfolioOverviewForUserForDateRange(userAccountId: UserAccount["id"], startDate?: Date | null, endDate?: Date | null): Promise<AssetsChange>;

  getPortfolioValueHistoryForUserForDateRange(userAccountId: UserAccount["id"], query?: DataRangeQuery): Promise<PortfolioHistoryTimePoint[]>;

  getBrokerAssetProviders(): Promise<BrokerProvider[]>;

  // Recurring Contributions
  getRecurringContributionsForAsset(assetId: BrokerProviderAsset["id"], query: QueryParams): Promise<RecurringContribution[]>;
  createRecurringContribution(assetId: BrokerProviderAsset["id"], data: RecurringContributionOrphanInsert): Promise<RecurringContribution>;
  updateRecurringContribution(assetId: BrokerProviderAsset["id"], contributionId: RecurringContribution["id"], data: RecurringContributionOrphanInsert): Promise<RecurringContribution>;
  deleteRecurringContribution(assetId: BrokerProviderAsset["id"], contributionId: RecurringContribution["id"]): Promise<boolean>;
  processRecurringContributions(): Promise<number>; // Returns number of processed contributions
}
