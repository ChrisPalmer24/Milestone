

import { assetContributions, assetValues, brokerProviderAssets, brokerProviders, generalAssets, brokerProviderAssetAPIKeyConnections, recurringContributions } from "server/db/schema";
import { Database } from "../../db";
import { and, between, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Asset, AssetContribution, AssetContributionInsert, assetContributionInsertSchema, AssetType, AssetValue, AssetValueInsert, assetValueInsertSchema, BrokerProvider, BrokerProviderAsset, BrokerProviderAssetAPIKeyConnection, BrokerProviderAssetInsert, BrokerProviderAssetWithAccountChange, GeneralAsset, GeneralAssetInsert, GeneralAssetWithAccountChange, PortfolioHistoryTimePoint, UserAccount, WithAccountChange, AssetsChange, AssetValueOrphanInsert, AssetContributionOrphanInsert, RecurringContribution, RecurringContributionOrphanInsert, ContributionInterval } from "@shared/schema";
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
  
  async getBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], query: QueryParts): Promise<AssetContribution[]> {
    const { where, orderBy, limit, offset } = query;

    return this.db.query.assetContributions.findMany({ where: and(eq(assetContributions.assetId, id), where), orderBy, limit, offset });
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

  async createBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution> {
    const [insertedAssetContribution] = await this.db.insert(assetContributions).values({
      ...data,
      assetId: id
    }).returning();
    return insertedAssetContribution;
  }

  async updateBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {
    const [updatedAssetValue] = await this.db.update(assetValues).set(data).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId))).returning();
    return updatedAssetValue;
  }

  async updateBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], assetContributionId: AssetContribution["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution> {
    const [updatedAssetContribution] = await this.db.update(assetContributions).set(data).where(and(eq(assetContributions.assetId, id), eq(assetContributions.id, assetContributionId))).returning();
    return updatedAssetContribution;
  }

  async deleteBrokerProviderAssetValueHistory(id: BrokerProviderAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean> {
    const result = await this.db.delete(assetValues).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId)));
    return (result?.rowCount ?? 0) > 0;
  }

  async deleteBrokerProviderAssetContributionHistory(id: BrokerProviderAsset["id"], assetContributionId: AssetContribution["id"]): Promise<boolean> {
    const result = await this.db.delete(assetContributions).where(and(eq(assetContributions.assetId, id), eq(assetContributions.id, assetContributionId)));
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

  async getGeneralAssetsContributionHistory(id: GeneralAsset["id"], query: QueryParts): Promise<AssetContribution[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.assetContributions.findMany({ where: and(eq(assetContributions.assetId, id), where), orderBy, limit, offset });
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

  async createGeneralAssetContributionHistory(id: GeneralAsset["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution> {
    const [insertedAssetContribution] = await this.db.insert(assetContributions).values({
      ...data,
      assetId: id
    }).returning();
    return insertedAssetContribution;
  }

  async updateGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"], data: AssetValueOrphanInsert): Promise<AssetValue> {
    const parsedData = assetValueInsertSchema.parse(data);
    const [updatedAssetValue] = await this.db.update(assetValues).set(parsedData).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId))).returning();
    return updatedAssetValue;
  }

  async updateGeneralAssetContributionHistory(id: GeneralAsset["id"], assetContributionId: AssetContribution["id"], data: AssetContributionOrphanInsert): Promise<AssetContribution> {
    const parsedData = assetContributionInsertSchema.parse(data);
    const [updatedAssetContribution] = await this.db.update(assetContributions).set(parsedData).where(and(eq(assetContributions.assetId, id), eq(assetContributions.id, assetContributionId))).returning();
    return updatedAssetContribution;
  }

  async deleteGeneralAssetValueHistory(id: GeneralAsset["id"], assetValueId: AssetValue["id"]): Promise<boolean> {
    const result = await this.db.delete(assetValues).where(and(eq(assetValues.assetId, id), eq(assetValues.id, assetValueId)));
    return (result?.rowCount ?? 0) > 0;
  }

  async deleteGeneralAssetContributionHistory(id: GeneralAsset["id"], assetContributionId: AssetContribution["id"]): Promise<boolean> {
    const result = await this.db.delete(assetContributions).where(and(eq(assetContributions.assetId, id), eq(assetContributions.id, assetContributionId)));
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

  private async getPortfolioAssetValuesForAssetsForDateRange(assetIds: Asset["id"][], startDate?: Date | null, endDate?: Date | null): Promise<AssetValue[]> {

    const dateQueries = startDate && endDate ? [between(assetValues.recordedAt, startDate, endDate)]
      : startDate ? [gte(assetValues.recordedAt, startDate)]
      : endDate ? [lte(assetValues.recordedAt, endDate)] 
      : [];

    const assetValuesQuery: QueryParts = {
      where: and(inArray(assetValues.assetId, assetIds), ...dateQueries),
      orderBy: [desc(assetValues.recordedAt)]
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

    const assetsToCalculate = await this.getCombinedAssetsForUser(userAccountId);

    const assetsValueChnages = await Promise.all(assetsToCalculate.map(async (asset) => {
      const assetValuesForRange = await this.getPortfolioAssetValuesForAssetsForDateRange([asset.id], startDate, endDate);
      const withStartValue = startDate ? await this.addStartValueToAssetValues(startDate, assetValuesForRange) : assetValuesForRange;
      return calculateAssetsChange(withStartValue);
    }));

    const assetsValueChanges = assetsValueChnages.reduce((acc: AssetsChange, asset) => {

      const startDate = asset.startDate < acc.startDate ? asset.startDate : acc.startDate;
      const endDate = asset.endDate > acc.endDate ? asset.endDate : acc.endDate;
      const startValue = asset.startDate < acc.startDate
        ? asset.startValue
        : asset.startDate > acc.startDate
        ? acc.startValue
        : asset.startDate === acc.startDate
        ? acc.startValue + asset.startValue
        : acc.startValue;

      const value = acc.value + asset.value;
      const currencyChange = value - startValue;
      const percentageChange = (currencyChange / startValue) * 100;
      
      return {
        startDate,
        endDate,
        startValue,
        value,
        currencyChange,
        percentageChange
      }
    }, {
      startDate: startDate ?? new Date(),
      endDate: endDate ?? new Date(),
      startValue: 0,
      value: 0,
      currencyChange: 0,
      percentageChange: 0
    });

    return assetsValueChanges;
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

    const assetsToCalculate = await this.getCombinedAssetsForUser(userAccountId);

    const assetValuesToCalculate = await this.getPortfolioAssetValuesForAssetsForDateRange(assetsToCalculate.map(asset => asset.id), startDate, endDate);

    const assetValuesForRange = startDate
      ? await this.addStartValueToAssetValues(startDate, assetValuesToCalculate)
      : assetValuesToCalculate;


    [...assetValuesForRange.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())].forEach(entry => {
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

  private async getLastAssetValueBeforeDate(startDate: Date, assetIds?: Asset["id"][]): Promise<AssetValue | null> {
    const lastValueBeforeStart = await this.db.query.assetValues.findFirst({
      where: assetIds 
        ? and(lte(assetValues.recordedAt, startDate), inArray(assetValues.assetId, assetIds))
        : and(lte(assetValues.recordedAt, startDate)),
      orderBy: [desc(assetValues.recordedAt)],
    })
    const startValue: AssetValue | null = lastValueBeforeStart
    ? {
      ...lastValueBeforeStart,
      recordedAt: startDate ?? new Date(),
    }
    : null;
    return startValue;
  }

  private async addStartValueToAssetValues(startDate: Date, assetValues: AssetValue[]): Promise<AssetValue[]> {

    const c = assetValues.map(assetValue => assetValue.assetId);
    const ids = new Set(c);

    const startValue = await this.getLastAssetValueBeforeDate(startDate, Array.from(ids));

    const valuesForRange = startValue ? [startValue, ...assetValues] : assetValues;

    return valuesForRange;
  }

  private async resolveAssetsWithChange<T extends { id: string }>(assets: T[], query: QueryParts): Promise<WithAccountChange<T>[]> {

    const startDate = query?.start
            ? new Date(query.start as string)
            : null;
    const endDate = query?.end
            ? new Date(query.end as string)
            : null;

    return assets.reduce(async (acc: Promise<WithAccountChange<T>[]>, asset): Promise<WithAccountChange<T>[]> => {
      const assets = await acc;

      const assetValuesForRange = await this.getPortfolioAssetValuesForAssetsForDateRange([asset.id], startDate, endDate);
      const assetHistory = startDate ? await this.addStartValueToAssetValues(startDate, assetValuesForRange) : assetValuesForRange;

      return [...assets, { ...asset, accountChange: calculateAssetsChange(assetHistory) }];
    }, Promise.resolve([]));
  }

  /**
   * Recurring Contributions
   */

  async getRecurringContributionsForAsset(assetId: BrokerProviderAsset["id"], query: QueryParts): Promise<RecurringContribution[]> {
    const { where, orderBy, limit, offset } = query;
    return this.db.query.recurringContributions.findMany({
      where: and(eq(recurringContributions.assetId, assetId), where),
      orderBy,
      limit,
      offset
    });
  }

  async createRecurringContribution(assetId: BrokerProviderAsset["id"], data: RecurringContributionOrphanInsert): Promise<RecurringContribution> {
    // Make sure the asset exists
    const asset = await this.getBrokerProviderAsset(assetId);
    if (!asset) {
      throw new Error(`Asset with ID ${assetId} not found`);
    }

    const [insertedContribution] = await this.db.insert(recurringContributions).values({
      ...data,
      assetId,
    }).returning();

    return insertedContribution;
  }

  async updateRecurringContribution(assetId: BrokerProviderAsset["id"], contributionId: RecurringContribution["id"], data: RecurringContributionOrphanInsert): Promise<RecurringContribution> {
    // Make sure the contribution exists and belongs to the asset
    const existingContribution = await this.db.query.recurringContributions.findFirst({
      where: and(
        eq(recurringContributions.id, contributionId),
        eq(recurringContributions.assetId, assetId)
      )
    });

    if (!existingContribution) {
      throw new Error(`Recurring contribution with ID ${contributionId} not found for asset ${assetId}`);
    }

    const [updatedContribution] = await this.db.update(recurringContributions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(recurringContributions.id, contributionId))
      .returning();

    return updatedContribution;
  }

  async deleteRecurringContribution(assetId: BrokerProviderAsset["id"], contributionId: RecurringContribution["id"]): Promise<boolean> {
    // Make sure the contribution exists and belongs to the asset
    const existingContribution = await this.db.query.recurringContributions.findFirst({
      where: and(
        eq(recurringContributions.id, contributionId),
        eq(recurringContributions.assetId, assetId)
      )
    });

    if (!existingContribution) {
      throw new Error(`Recurring contribution with ID ${contributionId} not found for asset ${assetId}`);
    }

    const result = await this.db.delete(recurringContributions)
      .where(eq(recurringContributions.id, contributionId));

    return (result?.rowCount ?? 0) > 0;
  }

  async processRecurringContributions(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    // Find all active recurring contributions that need processing
    const dueContributions = await this.db.query.recurringContributions.findMany({
      where: and(
        eq(recurringContributions.isActive, true),
        lte(recurringContributions.lastProcessedDate, this.getNextProcessingDate(now, 'weekly')) // Most aggressive interval
      )
    });

    // Process each contribution that is due
    for (const contribution of dueContributions) {
      const nextDate = this.getNextProcessingDate(contribution.lastProcessedDate, contribution.interval as ContributionInterval);
      
      // Check if the next processing date is due
      if (nextDate <= now) {
        // Create a contribution (debit) entry
        await this.createBrokerProviderAssetContributionHistory(contribution.assetId, {
          value: contribution.amount,
          recordedAt: new Date(),
        });

        // Update the last processed date
        await this.db.update(recurringContributions)
          .set({
            lastProcessedDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(recurringContributions.id, contribution.id));

        processedCount++;
      }
    }

    return processedCount;
  }

  private getNextProcessingDate(lastDate: Date, interval: ContributionInterval): Date {
    const nextDate = new Date(lastDate);
    
    switch (interval) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        throw new Error(`Invalid interval: ${interval}`);
    }
    
    return nextDate;
  }
}


