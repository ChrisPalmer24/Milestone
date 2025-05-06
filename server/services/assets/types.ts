import { AssetDebitInsert, AssetValueInsert, AssetValue, BrokerProviderAsset, BrokerProviderAssetInsert, GeneralAsset, GeneralAssetInsert, UserAccount, AssetDebit, PortfolioHistoryTimePoint, BrokerProviderAssetAPIKeyConnection, BrokerProvider, BrokerProviderAssetWithAccountChange, GeneralAssetWithAccountChange, AssetsChange } from "@shared/schema";
import { QueryParts } from "@server/utils/resource-query-builder";

export interface IAssetService {

  getBrokerProviderAssetsForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAsset[]>;
  getBrokerProviderAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAssetWithAccountChange[]>;
  getBrokerProviderAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAsset[]>;
  getBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<BrokerProviderAsset>;
  createBrokerProviderAsset(data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset>;
  updateBrokerProviderAsset(id: BrokerProviderAsset["id"], data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset>;
  deleteBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<boolean>;
  getBrokerProviderAssetHistory(id: BrokerProviderAsset["id"], query: QueryParts): Promise<AssetValue[]>;
  createBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], data: AssetValueInsert): Promise<AssetValue>;
  createBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], data: AssetDebitInsert): Promise<AssetDebit>;
  updateBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"], data: AssetValueInsert): Promise<AssetValue>;
  updateBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], assetDebitId: AssetDebit["id"], data: AssetDebitInsert): Promise<AssetDebit>;
  deleteBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean>;
  deleteBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], assetDebitId: AssetDebit["id"]): Promise<boolean>;
  setBrokerProviderAPIKey(id: BrokerProviderAsset["id"], apiKey: string): Promise<BrokerProviderAssetAPIKeyConnection>;

  getGeneralAssetsForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAsset[]>;
  getGeneralAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAssetWithAccountChange[]>;
  getGeneralAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAsset[]>;
  getGeneralAsset(id: GeneralAsset["id"]): Promise<GeneralAsset>;
  createGeneralAsset(data: GeneralAssetInsert): Promise<GeneralAsset>;
  updateGeneralAsset(id: GeneralAsset["id"], data: GeneralAssetInsert): Promise<GeneralAsset>;
  deleteGeneralAsset(id: GeneralAsset["id"]): Promise<boolean>;
  getGeneralAssetHistory(assetId: GeneralAsset["id"], query: QueryParts): Promise<GeneralAsset[]>;
  createGeneralAssetValueHistory(assetId: GeneralAsset["id"], data: AssetValueInsert): Promise<AssetValue>;
  createGeneralAssetDebitHistory(id: GeneralAsset["id"], data: AssetDebitInsert): Promise<AssetDebit>;
  updateGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"], data: AssetValueInsert): Promise<AssetValue>;
  updateGeneralAssetDebitHistory(id: GeneralAsset["id"], assetDebitId: AssetDebit["id"], data: AssetDebitInsert): Promise<AssetDebit>;
  deleteGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean>;
  deleteGeneralAssetDebitHistory(id: GeneralAsset["id"], assetDebitId: AssetDebit["id"]): Promise<boolean>;

  getPortfolioOverviewForUserForDateRange(userAccountId: UserAccount["id"]): Promise<AssetsChange>;

  getPortfolioValueHistoryForUserForDateRange(userAccountId: UserAccount["id"], startDate?: Date | null, endDate?: Date | null): Promise<PortfolioHistoryTimePoint[]>;

  getBrokerAssetProviders(): Promise<BrokerProvider[]>;
  
}
