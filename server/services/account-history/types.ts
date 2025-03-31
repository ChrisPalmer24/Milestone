import { Account, AccountHistory, InsertAccountHistory } from "@shared/schema";

export interface IAccountHistoryService {
  get(id: AccountHistory["id"]): Promise<AccountHistory | undefined>;
  getByAccountId(accountId: Account["id"]): Promise<AccountHistory[]>;
  getByDateRange(accountId: Account["id"], startDate: Date, endDate: Date): Promise<AccountHistory[]>;
  create(data: InsertAccountHistory): Promise<AccountHistory>;
  update(id: AccountHistory["id"], data: Partial<InsertAccountHistory>): Promise<AccountHistory>;
  delete(id: AccountHistory["id"]): Promise<boolean>;
} 
