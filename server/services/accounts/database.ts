import { eq, and, inArray, gte, lte } from "drizzle-orm";
import { accounts, accountHistory } from "@server/db/schema/portfolio-account";
import type { Account, AccountInsert, UserAccount } from "@shared/schema";
import type { IAccountService } from "./types";
import { type Database } from "../../db/index";
import { IAccountHistoryService } from "../asset-history/types";
import { DatabaseAccountHistoryService } from "../asset-history/database";

/**
 * @deprecated Use IAssetService instead  
 */
export class DatabaseAccountService implements IAccountService {

  accountHistoryService: IAccountHistoryService;

  constructor(private db: Database) {
    this.accountHistoryService = new DatabaseAccountHistoryService(db);
  }

  async get(id: Account["id"]): Promise<Account | undefined> {
    return this.db.query.accounts.findFirst({
      where: eq(accounts.id, id)
    });
  }

  async getByUserAccountId(userAccountId: UserAccount["id"]): Promise<Account[]> {
    return this.db.query.accounts.findMany({
      where: eq(accounts.userAccountId, userAccountId)
    });
  }

  async create(data: InsertAccount): Promise<Account> {
    const [account] = await this.db.insert(accounts).values(data).returning();
    await this.accountHistoryService.create({
      accountId: account.id,
      value: data.currentValue,
      recordedAt: account.createdAt,
    });
    return account;
  }

  async update(id: Account["id"], data: Partial<InsertAccount>): Promise<Account> {
    const [account] = await this.db
      .update(accounts)
      .set(data)
      .where(eq(accounts.id, id))
      .returning();
    
    if (!account) {
      throw new Error("Account not found");
    }
    
    return account;
  }

  async updateValue(id: Account["id"], value: number): Promise<Account> {

    await this.accountHistoryService.create({
      accountId: id,
      value: value.toString(),
      recordedAt: new Date(),
    });

    const [account] = await this.db
      .update(accounts)
      .set({ currentValue: value.toString() })
      .where(eq(accounts.id, id))
      .returning();
    
    if (!account) {
      throw new Error("Account not found");
    }
    
    return account;
  }

  async delete(id: Account["id"]): Promise<boolean> {
    // First delete all history entries for this account
    try {
      return await this.db.transaction(async (tx) => {
        // Delete all history entries for this account first
        await tx
          .delete(accountHistory)
          .where(eq(accountHistory.accountId, id));
          
        // Then delete the account
        const [deleted] = await tx
          .delete(accounts)
          .where(eq(accounts.id, id))
          .returning();
        
        return !!deleted;
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }

  async connectApi(id: Account["id"], apiKey: string): Promise<Account> {
    const [account] = await this.db
      .update(accounts)
      .set({ 
        isApiConnected: true,
        apiKey
      })
      .where(eq(accounts.id, id))
      .returning();
    
    if (!account) {
      throw new Error("Account not found");
    }
    
    return account;
  }

  async getPortfolioValue(userAccountId: UserAccount["id"]): Promise<number> {
    const userAccounts = await this.getByUserAccountId(userAccountId);
    return userAccounts.reduce((sum, account) => sum + Number(account.currentValue), 0);
  }

  async getPortfolioHistory(userAccountId: UserAccount["id"], startDate: Date, endDate: Date): Promise<{ 
    date: Date; 
    value: number;
    changes: {
      accountId: Account["id"];
      previousValue: number;
      newValue: number;
      change: number;
    }[];
  }[]> {
    const userAccounts = await this.getByUserAccountId(userAccountId);
    const accountIds = userAccounts.map(account => account.id);
    
    // Get all history entries for the user's accounts within the date range
    const historyEntries = await this.db.query.accountHistory.findMany({
      where: and(
        inArray(accountHistory.accountId, accountIds),
        gte(accountHistory.recordedAt, startDate),
        lte(accountHistory.recordedAt, endDate)
      ),
      orderBy: (table, { asc }) => [asc(table.recordedAt)]
    });

    // Create a map to track the latest known value for each account
    const accountLatestValues = new Map<string, number>();
    
    // Initialize with current values from accounts
    // userAccounts.forEach(account => {
    //   accountLatestValues.set(account.id, Number(account.currentValue));
    // });

    // Create a map to store portfolio values and changes at each timestamp
    const portfolioValues = new Map<string, {
      value: number;
      changes: {
        accountId: Account["id"];
        previousValue: number;
        newValue: number;
        change: number;
      }[];
    }>();

    // Process each history entry in chronological order
    [...historyEntries.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())].forEach(entry => {
      const previousValue = accountLatestValues.get(entry.accountId) || 0;
      const newValue = Number(entry.value);
      const change = newValue - previousValue;
      
      // Update the latest known value for this account
      accountLatestValues.set(entry.accountId, newValue);
      
      // Calculate total portfolio value at this point in time
      const totalValue = Array.from(accountLatestValues.values()).reduce((sum, value) => sum + value, 0);
      
      // Format the date to YYYY-MM-DD for consistent daily grouping
      const dateKey = entry.recordedAt.toISOString().split('T')[0];
      
      // If we already have an entry for this date, update it with the new changes
      if (portfolioValues.has(dateKey)) {
        const existingEntry = portfolioValues.get(dateKey)!;
        existingEntry.value = totalValue;
        existingEntry.changes.push({
          accountId: entry.accountId,
          previousValue,
          newValue,
          change
        });
      } else {
        // Otherwise create a new entry for this date
        portfolioValues.set(dateKey, {
          value: totalValue,
          changes: [{
            accountId: entry.accountId,
            previousValue,
            newValue,
            change
          }]
        });
      }
    });

    // Convert to array format and sort by timestamp
    return Array.from(portfolioValues.entries())
      .map(([timestamp, data]) => ({
        date: new Date(timestamp),
        value: data.value,
        changes: data.changes
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
} 
