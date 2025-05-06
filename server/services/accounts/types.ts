import { Account, AccountInsert, UserAccount } from "@shared/schema";

/**
 * @deprecated Use IAssetService instead  
 */
export interface IAccountService {
  get(id: Account["id"]): Promise<Account | undefined>;
  getByUserAccountId(userAccountId: UserAccount["id"]): Promise<Account[]>;
  create(data: AccountInsert): Promise<Account>;
  update(id: Account["id"], data: Partial<AccountInsert>): Promise<Account>;
  delete(id: Account["id"]): Promise<boolean>;
  updateValue(id: Account["id"], value: number): Promise<Account>;
  connectApi(id: Account["id"], apiKey: string): Promise<Account>;
  getPortfolioValue(userAccountId: UserAccount["id"]): Promise<number>;
  getPortfolioHistory(userAccountId: UserAccount["id"], startDate: Date, endDate: Date): Promise<{ date: Date; value: number }[]>;
} 
