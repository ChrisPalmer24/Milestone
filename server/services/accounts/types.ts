import { Account, InsertAccount } from "@shared/schema";

export interface IAccountService {
  get(id: number): Promise<Account | undefined>;
  getByUserId(userId: number): Promise<Account[]>;
  create(data: InsertAccount): Promise<Account>;
  update(id: number, data: Partial<InsertAccount>): Promise<Account>;
  delete(id: number): Promise<boolean>;
  updateValue(id: number, value: number): Promise<Account>;
  connectApi(id: number, apiKey: string): Promise<Account>;
  getPortfolioValue(userId: number): Promise<number>;
  getPortfolioHistory(userId: number, startDate: Date, endDate: Date): Promise<{ date: Date; value: number }[]>;
} 
