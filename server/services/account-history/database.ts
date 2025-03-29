import { eq, and, gte, lte } from "drizzle-orm";
import { accountHistory, accounts } from "@shared/schema";
import { AccountHistory, InsertAccountHistory } from "@shared/schema";
import { IAccountHistoryService } from "./types";
import { type Database } from "../../db/index";

export class DatabaseAccountHistoryService implements IAccountHistoryService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private async recalculateAccountValue(accountId: number): Promise<void> {
    // Get the most recent history entry for the account
    const latestHistory = await this.db.query.accountHistory.findFirst({
      where: eq(accountHistory.accountId, accountId),
      orderBy: (accountHistory, { desc }) => [desc(accountHistory.recordedAt)],
    });

    if (latestHistory) {
      // Update the account's current value with the latest history value
      await this.db
        .update(accounts)
        .set({ currentValue: latestHistory.value })
        .where(eq(accounts.id, accountId));
    }
  }

  private async withTransaction<T>(
    operation: () => Promise<T>,
    accountId: number
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      const result = await operation();
      await this.recalculateAccountValue(accountId);
      return result;
    });
  }

  async get(id: number): Promise<AccountHistory | undefined> {
    return this.db.query.accountHistory.findFirst({
      where: eq(accountHistory.id, id),
    });
  }

  async getByAccountId(accountId: number): Promise<AccountHistory[]> {
    return this.db.query.accountHistory.findMany({
      where: eq(accountHistory.accountId, accountId),
      orderBy: (accountHistory, { desc }) => [desc(accountHistory.recordedAt)],
    });
  }

  async getByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<AccountHistory[]> {
    return this.db.query.accountHistory.findMany({
      where: and(
        eq(accountHistory.accountId, accountId),
        gte(accountHistory.recordedAt, startDate),
        lte(accountHistory.recordedAt, endDate)
      ),
      orderBy: (accountHistory, { asc }) => [asc(accountHistory.recordedAt)],
    });
  }

  async create(data: InsertAccountHistory): Promise<AccountHistory> {
    return this.withTransaction(async () => {
      const [history] = await this.db.insert(accountHistory).values(data).returning();
      return history;
    }, data.accountId);
  }

  async update(id: number, data: Partial<InsertAccountHistory>): Promise<AccountHistory> {
    // First get the account ID from the history entry
    const existingHistory = await this.get(id);
    if (!existingHistory) {
      throw new Error("History entry not found");
    }

    return this.withTransaction(async () => {
      const [history] = await this.db
        .update(accountHistory)
        .set(data)
        .where(eq(accountHistory.id, id))
        .returning();

      if (!history) {
        throw new Error("History entry not found");
      }

      return history;
    }, existingHistory.accountId);
  }

  async delete(id: number): Promise<boolean> {
    // First get the account ID from the history entry
    const existingHistory = await this.get(id);
    if (!existingHistory) {
      return false;
    }

    return this.withTransaction(async () => {
      const [deleted] = await this.db
        .delete(accountHistory)
        .where(eq(accountHistory.id, id))
        .returning();

      return !!deleted;
    }, existingHistory.accountId);
  }
} 
