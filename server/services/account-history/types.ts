import { AccountHistory, InsertAccountHistory } from "@shared/schema";

export interface IAccountHistoryService {
  get(id: number): Promise<AccountHistory | undefined>;
  getByAccountId(accountId: number): Promise<AccountHistory[]>;
  getByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<AccountHistory[]>;
  create(data: InsertAccountHistory): Promise<AccountHistory>;
  update(id: number, data: Partial<InsertAccountHistory>): Promise<AccountHistory>;
  delete(id: number): Promise<boolean>;
} 
