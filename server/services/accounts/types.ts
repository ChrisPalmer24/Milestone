import { Account, InsertAccount, User } from "@shared/schema";

export interface IAccountService {
  get(id: Account["id"]): Promise<Account | undefined>;
  getByUserId(userId: User["id"]): Promise<Account[]>;
  create(data: InsertAccount): Promise<Account>;
  update(id: Account["id"], data: Partial<InsertAccount>): Promise<Account>;
  delete(id: Account["id"]): Promise<boolean>;
  updateValue(id: Account["id"], value: number): Promise<Account>;
  connectApi(id: Account["id"], apiKey: string): Promise<Account>;
  getPortfolioValue(userId: User["id"]): Promise<number>;
  getPortfolioHistory(userId: User["id"], startDate: Date, endDate: Date): Promise<{ date: Date; value: number }[]>;
} 
