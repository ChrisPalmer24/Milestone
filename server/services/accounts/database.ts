import { eq, and, inArray, gte, lte } from "drizzle-orm";
import { accounts, accountHistory } from "@shared/schema";
import type { Account, InsertAccount } from "@shared/schema";
import type { IAccountService } from "./types";
import { type Database } from "../../db/index";
import { IAccountHistoryService } from "../account-history/types";
import { DatabaseAccountHistoryService } from "../account-history/database";
export class DatabaseAccountService implements IAccountService {

  accountHistoryService: IAccountHistoryService;

  constructor(private db: Database) {
    this.accountHistoryService = new DatabaseAccountHistoryService(db);
  }

  async get(id: number): Promise<Account | undefined> {
    return this.db.query.accounts.findFirst({
      where: eq(accounts.id, id)
    });
  }

  async getByUserId(userId: number): Promise<Account[]> {
    return this.db.query.accounts.findMany({
      where: eq(accounts.userId, userId)
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

  async update(id: number, data: Partial<InsertAccount>): Promise<Account> {
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

  async updateValue(id: number, value: number): Promise<Account> {

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

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();
    
    return !!deleted;
  }

  async connectApi(id: number, apiKey: string): Promise<Account> {
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

  async getPortfolioValue(userId: number): Promise<number> {
    const userAccounts = await this.getByUserId(userId);
    return userAccounts.reduce((sum, account) => sum + Number(account.currentValue), 0);
  }

  async getPortfolioHistory(userId: number, startDate: Date, endDate: Date): Promise<{ date: Date; value: number }[]> {
    const userAccounts = await this.getByUserId(userId);
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

    // Group history entries by date and sum values
    const portfolioHistory = new Map<string, number>();
    historyEntries.forEach(entry => {
      const dateKey = entry.recordedAt.toISOString().split('T')[0];
      portfolioHistory.set(dateKey, (portfolioHistory.get(dateKey) || 0) + Number(entry.value));
    });

    // Convert to array format
    return Array.from(portfolioHistory.entries()).map(([date, value]) => ({
      date: new Date(date),
      value
    }));
  }
} 
