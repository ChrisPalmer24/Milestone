

import { assetDebits, assetValues, brokerProviderAssets, brokerProviders, generalAssets, brokerProviderAssetAPIKeyConnections } from "server/db/schema";
import { Database } from "../../db";
import { and, between, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Asset, AssetDebit, AssetDebitInsert, assetDebitInsertSchema, AssetType, AssetValue, AssetValueInsert, assetValueInsertSchema, BrokerProvider, BrokerProviderAsset, BrokerProviderAssetAPIKeyConnection, BrokerProviderAssetInsert, BrokerProviderAssetWithAccountChange, GeneralAsset, GeneralAssetInsert, GeneralAssetWithAccountChange, PortfolioHistoryTimePoint, UserAccount, WithAccountChange, AssetsChange, AssetValueOrphanInsert, AssetDebitOrphanInsert } from "@shared/schema";
import { IAssetService } from "./types";
import { QueryParts } from "@server/utils/resource-query-builder";
import { NodePgTransaction } from "drizzle-orm/node-postgres";
import { Schema, TSchema } from "server/db/types/utils";
import { calculateAssetsChange } from "./utils";

type Transaction = NodePgTransaction<Schema, TSchema>;


export class DatabaseAssetService implements IAssetService {
  constructor(private db: Database) {}


  private async recalculateAssetValue(tx: Transaction, assetType: AssetType, assetId: Asset["id"]): Promise<void> {
    // Get the most recent history entry for the account
    const latestHistory = await tx.query.assetValues.findFirst({
      where: eq(assetValues.assetId, assetId),
      orderBy: (assetValues, { desc }) => [desc(assetValues.recordedAt)],
    });

    const assetTable = assetType === "general"
      ? generalAssets
      : assetType === "broker"
      ? brokerProviderAssets
      : null;

    if(!assetTable) {
      throw new Error("Invalid asset type");
    }

    if (latestHistory) {
      // Update the account's current value with the latest history value
      await tx
        .update(assetTable)
        .set({ currentValue: latestHistory.value })
        .where(eq(assetTable.id, assetId));
    }
  }

  private async withValueTransaction<T>(
    operation: (tx: Transaction) => Promise<T>,
    assetType: AssetType,
    assetId: Asset["id"]
  ): Promise<T> {

    return this.db.transaction(async (tx) => {
      const result = await operation(tx);
      await this.recalculateAssetValue(tx, assetType, assetId);
      return result;
    });
  }

  /**
   * Broker Provider Assets
   */

  private async getLatestAssetValuesForAssets(assetIds: string[]): Promise<AssetValue[]> {
    const result = await this.db.execute(sql`
      SELECT DISTINCT ON (${assetValues.assetId}) 
        id,
        value,
        recordedAt,
        assetId,
        createdAt,
        updatedAt
      FROM ${assetValues}
      WHERE ${inArray(assetValues.assetId, assetIds)}
      ORDER BY ${assetValues.assetId}, ${assetValues.recordedAt} DESC
    `);

    return result.rows.map(row => ({
      id: row.id as string,
      value: Number(row.value),
      recordedAt: new Date(row.recorded_at as string),
      assetId: row.asset_id as string,
      createdAt: row.created_at ? new Date(row.created_at as string) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : null,
    }));
  }


  async getBrokerProviderAssetsForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAsset[]> {

    const { where, orderBy, limit, offset } = query;
    const brokerAssets = await this.db.query.brokerProviderAssets.findMany({ with: { provider: true }, where: and(eq(brokerProviderAssets.userAccountId, userId), where), orderBy, limit, offset });
    return brokerAssets;
  }

  async getBrokerProviderAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAssetWithAccountChange[]> {
    const brokerAssets = await this.getBrokerProviderAssetsForUser(userId, query);
    const resolvedAssets = await this.resolveAssetsWithChange(brokerAssets, { ...query });
    return resolvedAssets;
  }

  async getBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<BrokerProviderAsset> {

    const g = this.db.transaction(async (tx) => {
      const brokerProviderAsset = await tx.query.brokerProviderAssets.findFirst({ where: eq(brokerProviderAssets.id, id) });
      if (!brokerProviderAsset) {
        throw new Error("Broker provider asset not found");
      }
      return brokerProviderAsset;
    })

    const brokerProviderAsset = await this.db.query.brokerProviderAssets.findFirst({ where: eq(brokerProviderAssets.id, id) });
    if (!brokerProviderAsset) {
      throw new Error("Broker provider asset not found");
    }
    return brokerProviderAsset;
  }

  async getBrokerProviderAssetHistory(id: BrokerProviderAsset["id"], query: QueryParts): Promise<AssetValue[]> {
    const { where, orderBy, limit, offset } = query;

    return this.db.query.assetValues.findMany({ where: and(eq(assetValues.assetId, id), where), orderBy, limit, offset });
  }

  async createBrokerProviderAsset(data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset> {
    const insertedBrokerProviderAsset = await this.db.transaction(async (tx) => {
      const [insertedBrokerProviderAsset] = await tx.insert(brokerProviderAssets).values({
        ...data,
        currentValue: data.currentValue ?? 0
      }).returning();
      await tx.insert(assetValues).values({
        assetId: insertedBrokerProviderAsset.id,
        value: data.currentValue ?? 0,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return insertedBrokerProviderAsset;
    });
    return insertedBrokerProviderAsset ;
  }

  async updateBrokerProviderAsset(id: BrokerProviderAsset["id"], data: BrokerProviderAssetInsert): Promise<BrokerProviderAsset> {
    const [updatedBrokerProviderAsset] = await this.db.update(brokerProviderAssets).set(data).where(eq(brokerProviderAssets.id, id)).returning();
    return { ...updatedBrokerProviderAsset };
  }

  async deleteBrokerProviderAsset(id: BrokerProviderAsset["id"]): Promise<boolean> {
    const result = await this.db.delete(brokerProviderAssets).where(eq(brokerProviderAssets.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getBrokerProviderAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParts): Promise<BrokerProviderAsset[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.brokerProviderAssets.findMany({ with: { provider: true }, where: and(eq(brokerProviderAssets.userAccountId, userId), where), orderBy, limit, offset });
  }

  async createBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {
    return this.withValueTransaction(async (tx: Transaction) => {
      const [insertedAssetValue] = await tx.insert(assetValues).values({
        ...data,
        assetId: id
      }).returning();
      return insertedAssetValue;
    }, "broker", id);
  }

  async createBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], data: AssetDebitOrphanInsert): Promise<AssetDebit> {
    const [insertedAssetDebit] = await this.db.insert(assetDebits).values({
      ...data,
      assetId: id
    }).returning();
    return insertedAssetDebit;
  }

  async updateBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {
    const [updatedAssetValue] = await this.db.update(assetValues).set(data).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId))).returning();
    return updatedAssetValue;
  }

  async updateBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], assetDebitId: AssetDebit["id"], data: AssetValueOrphanInsert): Promise<AssetDebit> {
    const [updatedAssetDebit] = await this.db.update(assetDebits).set(data).where(and(eq(assetDebits.assetId, id), eq(assetDebits.id, assetDebitId))).returning();
    return updatedAssetDebit;
  }

  async deleteBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean> {
    const result = await this.db.delete(assetValues).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId)));
    return (result?.rowCount ?? 0) > 0;
  }

  async deleteBrokerProviderAssetDebitHistory(id: BrokerProviderAsset["id"], assetDebitId: AssetDebit["id"]): Promise<boolean> {
    const result = await this.db.delete(assetDebits).where(and(eq(assetDebits.assetId, id), eq(assetDebits.id, assetDebitId)));
    return (result?.rowCount ?? 0) > 0;
  }

  async setBrokerProviderAPIKey(id: BrokerProviderAsset["id"], apiKey: string): Promise<BrokerProviderAssetAPIKeyConnection> {

    const existingBrokerProviderAsset = await this.getBrokerProviderAsset(id);
    if(!existingBrokerProviderAsset) {
      throw new Error("Broker provider asset not found");
    }

    const provider = await this.db.query.brokerProviders.findFirst({ where: eq(brokerProviders.id, existingBrokerProviderAsset.providerId) });

    if(!provider) {
      throw new Error("Broker provider not found");
    }

    if(!provider.supportsAPIKey) {
      throw new Error("Broker provider does not support API keys");
    }

    const existingAPIKeyConnection = await this.db.query.brokerProviderAssetAPIKeyConnections.findFirst({ where: eq(brokerProviderAssetAPIKeyConnections.brokerProviderAssetId, id) });

    if(existingAPIKeyConnection) {
      const [updatedAPIKeyConnection] = await this.db.update(brokerProviderAssetAPIKeyConnections).set({ apiKey }).where(eq(brokerProviderAssetAPIKeyConnections.id, existingAPIKeyConnection.id)).returning();
      return updatedAPIKeyConnection;
    } else {
      const [insertedAPIKeyConnection] = await this.db.insert(brokerProviderAssetAPIKeyConnections).values({ brokerProviderAssetId: id, apiKey }).returning();
      return insertedAPIKeyConnection;
    }
  }

  /**
   * General Assets
   */

  async getGeneralAssetsForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAsset[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.generalAssets.findMany({ where: and(eq(generalAssets.userAccountId, userId), where), orderBy, limit, offset });
  }

  async getGeneralAssetsWithAccountChangeForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAssetWithAccountChange[]> {
    const brokerAssets = await this.getGeneralAssetsForUser(userId, query);
    const resolvedAssets = await this.resolveAssetsWithChange(brokerAssets, { ...query });
    return resolvedAssets;
  }

  async getGeneralAsset(id: GeneralAsset["id"]): Promise<GeneralAsset> {
    const generalAsset = await this.db.query.generalAssets.findFirst({ where: eq(generalAssets.id, id) });
    if (!generalAsset) {
      throw new Error("General asset not found");
    }
    return generalAsset;
  }

  async getGeneralAssetHistory(id: GeneralAsset["id"], query: QueryParts): Promise<GeneralAsset[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.generalAssets.findMany({ where: and(eq(generalAssets.id, id), where), orderBy, limit, offset });
  }

  async createGeneralAsset(data: GeneralAssetInsert): Promise<GeneralAsset> {
    const insertedGeneralAsset = await this.db.transaction(async (tx) => {
      const [insertedGeneralAsset] = await tx.insert(generalAssets).values({
        ...data,
        currentValue: data.currentValue ?? 0
      }).returning();
      await tx.insert(assetValues).values({
        assetId: insertedGeneralAsset.id,
        value: data.currentValue ?? 0,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return insertedGeneralAsset;
    });
    return insertedGeneralAsset ;
  }

  async updateGeneralAsset(id: GeneralAsset["id"], data: GeneralAssetInsert): Promise<GeneralAsset> {
    const [updatedGeneralAsset] = await this.db.update(generalAssets).set(data).where(eq(generalAssets.id, id)).returning();
    return updatedGeneralAsset;
  }

  async deleteGeneralAsset(id: GeneralAsset["id"]): Promise<boolean> {
    const result = await this.db.delete(generalAssets).where(eq(generalAssets.id, id));
    return (result?.rowCount ?? 0) > 0;
  }

  async getGeneralAssetsHistoryForUser(userId: UserAccount["id"], query: QueryParts): Promise<GeneralAsset[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.generalAssets.findMany({ where: and(eq(generalAssets.userAccountId, userId), where), orderBy, limit, offset });
  }

  async getGeneralAssetsValueHistory(id: GeneralAsset["id"], query: QueryParts): Promise<AssetValue[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.assetValues.findMany({ where: and(eq(assetValues.assetId, id), where), orderBy, limit, offset });
  }

  async getGeneralAssetsDebitHistory(id: GeneralAsset["id"], query: QueryParts): Promise<AssetDebit[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.assetDebits.findMany({ where: and(eq(assetDebits.assetId, id), where), orderBy, limit, offset });
  }

  async createGeneralAssetValueHistory(id: GeneralAsset["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {

    return this.withValueTransaction(async (tx: Transaction) => {
      const [insertedAssetValue] = await tx.insert(assetValues).values({
        ...data,
        assetId: id
      }).returning();
      return insertedAssetValue;
    }, "general", id);

  }

  async createGeneralAssetDebitHistory(id: GeneralAsset["id"], data: AssetDebitOrphanInsert): Promise<AssetDebit> {
    const [insertedAssetDebit] = await this.db.insert(assetDebits).values({
      ...data,
      assetId: id
    }).returning();
    return insertedAssetDebit;
  }

  async updateGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {
    const parsedData = assetValueInsertSchema.parse(data);
    const [updatedAssetValue] = await this.db.update(assetValues).set(parsedData).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId))).returning();
    return updatedAssetValue;
  }

  async updateGeneralAssetDebitHistory(id: GeneralAsset["id"], assetDebitId: AssetDebit["id"], data: AssetDebitOrphanInsert): Promise<AssetDebit> {
    const parsedData = assetDebitInsertSchema.parse(data);
    const [updatedAssetDebit] = await this.db.update(assetDebits).set(parsedData).where(and(eq(assetDebits.assetId, id), eq(assetDebits.id, assetDebitId))).returning();
    return updatedAssetDebit;
  }

  async deleteGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean> {
    const result = await this.db.delete(assetValues).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId)));
    return (result?.rowCount ?? 0) > 0;
  }

  async deleteGeneralAssetDebitHistory(id: GeneralAsset["id"], assetDebitId: AssetDebit["id"]): Promise<boolean> {
    const result = await this.db.delete(assetDebits).where(and(eq(assetDebits.assetId, id), eq(assetDebits.id, assetDebitId)));
    return (result?.rowCount ?? 0) > 0;
  }

  

  private async getCombinedAssetsForUser(userAccountId: UserAccount["id"]): Promise<Asset[]> {
    const brokerProviderQuery: QueryParts = {
      where: and(eq(brokerProviderAssets.userAccountId, userAccountId)),
      orderBy: [desc(brokerProviderAssets.createdAt)]
    }

    const brokerProviderAssetsSelected = await this.getBrokerProviderAssetsForUser(userAccountId, brokerProviderQuery);

    const generalQuery: QueryParts = {
      where: eq(generalAssets.userAccountId, userAccountId),
      orderBy: [desc(generalAssets.createdAt)],
    }

    const generalAssetsSelected = await this.getGeneralAssetsForUser(userAccountId, generalQuery);

    const assets: Asset[] = [...brokerProviderAssetsSelected, ...generalAssetsSelected];

    return assets;
  }

  private async getPortfolioAssetValuesForUserForDateRange(userAccountId: UserAccount["id"], startDate?: Date | null, endDate?: Date | null): Promise<AssetValue[]> {

    const assetsToCalculate = await this.getCombinedAssetsForUser(userAccountId)

    const dateQueries = startDate && endDate ? [between(assetValues.createdAt, startDate, endDate)]
      : startDate ? [gte(assetValues.createdAt, startDate)]
      : endDate ? [lte(assetValues.createdAt, endDate)] 
      : [];

    const assetValuesQuery: QueryParts = {
      where: and(inArray(assetValues.assetId, assetsToCalculate.map(asset => asset.id)), ...dateQueries),
      orderBy: [desc(assetValues.createdAt)]
    }

    const { where, orderBy, limit, offset } = assetValuesQuery;

    const assetValuesToCalculate = await this.db.query.assetValues.findMany({ 
      where,
      orderBy,
      limit,
      offset
    });

    return assetValuesToCalculate;
  }

  async getPortfolioOverviewForUserForDateRange(userAccountId: UserAccount["id"], startDate?: Date | null, endDate?: Date | null): Promise<AssetsChange> {

    const assetValuesToCalculate = await this.getPortfolioAssetValuesForUserForDateRange(userAccountId, startDate, endDate);

    return calculateAssetsChange(assetValuesToCalculate);
  }

  async getPortfolioValueHistoryForUserForDateRange(userAccountId: UserAccount["id"], startDate?: Date | null, endDate?: Date | null): Promise<PortfolioHistoryTimePoint[]> {

     // Create a map to track the latest known value for each account
     const accountLatestValues = new Map<string, number>();
    
     // Create a map to store portfolio values and changes at each timestamp
     const portfolioValues = new Map<string, {
       value: number;
       changes: {
         assetId: Asset["id"];
         previousValue: number;
         newValue: number;
         change: number;
       }[];
     }>();

    const assetValuesToCalculate = await this.getPortfolioAssetValuesForUserForDateRange(userAccountId, startDate, endDate);

    [...assetValuesToCalculate.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())].forEach(entry => {
      const previousValue = accountLatestValues.get(entry.assetId) || 0;
      const newValue = Number(entry.value);
      const change = newValue - previousValue;
      
      // Update the latest known value for this account
      accountLatestValues.set(entry.assetId, newValue);
      
      // Calculate total portfolio value at this point in time
      const totalValue = Array.from(accountLatestValues.values()).reduce((sum, value) => sum + value, 0);
      
      // Format the date to YYYY-MM-DD for consistent daily grouping
      const dateKey = entry.recordedAt.toISOString().split('T')[0];
      
      // If we already have an entry for this date, update it with the new changes
      if (portfolioValues.has(dateKey)) {
        const existingEntry = portfolioValues.get(dateKey)!;
        existingEntry.value = totalValue;
        existingEntry.changes.push({
          assetId: entry.assetId,
          previousValue,
          newValue,
          change
        });
      } else {
        // Otherwise create a new entry for this date
        portfolioValues.set(dateKey, {
          value: totalValue,
          changes: [{
            assetId: entry.assetId,
            previousValue,
            newValue,
            change
          }]
        });
      }
    });

    return Array.from(portfolioValues.entries())
      .map(([timestamp, data]) => ({
        date: new Date(timestamp),
        value: data.value,
        changes: data.changes
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getBrokerAssetProviders(): Promise<BrokerProvider[]> {
    return this.db.query.brokerProviders.findMany();
  }


  /**
   * Utility methods
   */

  private async resolveAssetsWithChange<T extends { id: string }>(assets: T[], query: QueryParts): Promise<WithAccountChange<T>[]> {
    return assets.reduce(async (acc: Promise<WithAccountChange<T>[]>, asset): Promise<WithAccountChange<T>[]> => {
      const assets = await acc;
      const { where, orderBy, limit, offset } = query;

      const start = query.start ? new Date(query.start as string) : null;
      const end = query.end ? new Date(query.end as string) : null;

      const whereDates = start && end ? [between(assetValues.recordedAt, start, end)] : start ? [gte(assetValues.recordedAt, start)] : end ? [lte(assetValues.recordedAt, end)] : [];

      const queryWithDates = { ...query, where: and(where, ...whereDates) };
      const assetHistory = await this.getBrokerProviderAssetHistory(asset.id, queryWithDates);
      return [...assets, { ...asset, accountChange: calculateAssetsChange(assetHistory) }];
    }, Promise.resolve([]));
  }

}



