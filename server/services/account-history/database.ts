import { eq, and, gte, lte } from "drizzle-orm";
import { accountHistory } from "@shared/schema";
import { AccountHistory, InsertAccountHistory } from "@shared/schema";
import { IAccountHistoryService } from "./types";
import { type Database } from "../../db/index";

export class DatabaseAccountHistoryService implements IAccountHistoryService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
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
    const [history] = await this.db.insert(accountHistory).values(data).returning();
    return history;
  }

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(accountHistory)
      .where(eq(accountHistory.id, id))
      .returning();

    return !!deleted;
  }
} 
