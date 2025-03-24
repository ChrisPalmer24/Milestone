import { 
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  accountHistory, type AccountHistory, type InsertAccountHistory,
  milestones, type Milestone, type InsertMilestone,
  fireSettings, type FireSettings, type InsertFireSettings
} from "@shared/schema";

// Extend the interface with all CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Account methods
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, value: number): Promise<Account>;
  deleteAccount(id: number): Promise<boolean>;
  connectAccountApi(id: number, apiKey: string): Promise<Account>;

  // Account History methods
  getAccountHistory(accountId: number): Promise<AccountHistory[]>;
  getAccountHistoryByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<AccountHistory[]>;
  createAccountHistory(history: InsertAccountHistory): Promise<AccountHistory>;

  // Portfolio methods (aggregates)
  getPortfolioValue(userId: number): Promise<number>;
  getPortfolioHistory(userId: number, startDate: Date, endDate: Date): Promise<{date: Date, value: number}[]>;

  // Milestone methods
  getMilestones(userId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, isCompleted: boolean): Promise<Milestone>;
  deleteMilestone(id: number): Promise<boolean>;

  // FIRE settings methods
  getFireSettings(userId: number): Promise<FireSettings | undefined>;
  createFireSettings(settings: InsertFireSettings): Promise<FireSettings>;
  updateFireSettings(userId: number, settings: Partial<InsertFireSettings>): Promise<FireSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private accountHistory: Map<number, AccountHistory[]>;
  private milestones: Map<number, Milestone>;
  private fireSettings: Map<number, FireSettings>;
  
  currentUserId: number;
  currentAccountId: number;
  currentHistoryId: number;
  currentMilestoneId: number;
  currentFireSettingsId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.accountHistory = new Map();
    this.milestones = new Map();
    this.fireSettings = new Map();
    
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentHistoryId = 1;
    this.currentMilestoneId = 1;
    this.currentFireSettingsId = 1;

    // Seed with default user for demo purposes
    this.createUser({ username: "demo", password: "demo" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId
    );
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const now = new Date();
    const account: Account = { 
      ...insertAccount, 
      id, 
      createdAt: now, 
      updatedAt: now,
      isApiConnected: false,
      apiKey: null
    };
    this.accounts.set(id, account);
    
    // Create initial history entry
    this.createAccountHistory({
      accountId: id,
      value: Number(insertAccount.currentValue),
      recordedAt: now
    });
    
    return account;
  }

  async updateAccount(id: number, value: number): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error("Account not found");
    }
    
    const updatedAccount: Account = {
      ...account,
      currentValue: value as any, // Numeric type handling
      updatedAt: new Date()
    };
    
    this.accounts.set(id, updatedAccount);
    
    // Create history entry for this update
    this.createAccountHistory({
      accountId: id,
      value: value,
      recordedAt: new Date()
    });
    
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  async connectAccountApi(id: number, apiKey: string): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error("Account not found");
    }
    
    const updatedAccount: Account = {
      ...account,
      apiKey,
      isApiConnected: true,
      updatedAt: new Date()
    };
    
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  // Account History methods
  async getAccountHistory(accountId: number): Promise<AccountHistory[]> {
    const history = this.accountHistory.get(accountId) || [];
    return [...history].sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  }

  async getAccountHistoryByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<AccountHistory[]> {
    const history = this.accountHistory.get(accountId) || [];
    return history.filter(entry => {
      const date = new Date(entry.recordedAt);
      return date >= startDate && date <= endDate;
    }).sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
  }

  async createAccountHistory(insertHistory: InsertAccountHistory): Promise<AccountHistory> {
    const id = this.currentHistoryId++;
    const historyEntry: AccountHistory = { ...insertHistory, id };
    
    const accountHistoryEntries = this.accountHistory.get(insertHistory.accountId) || [];
    accountHistoryEntries.push(historyEntry);
    this.accountHistory.set(insertHistory.accountId, accountHistoryEntries);
    
    return historyEntry;
  }

  // Portfolio methods (aggregates)
  async getPortfolioValue(userId: number): Promise<number> {
    const userAccounts = await this.getAccounts(userId);
    return userAccounts.reduce(
      (total, account) => total + Number(account.currentValue), 
      0
    );
  }

  async getPortfolioHistory(userId: number, startDate: Date, endDate: Date): Promise<{date: Date, value: number}[]> {
    const userAccounts = await this.getAccounts(userId);
    
    // Collect all history entries for all user accounts
    const allHistoryData: {date: Date, value: number}[] = [];
    
    for (const account of userAccounts) {
      const history = await this.getAccountHistoryByDateRange(account.id, startDate, endDate);
      
      for (const entry of history) {
        const dateStr = new Date(entry.recordedAt).toISOString().split('T')[0]; // YYYY-MM-DD
        const existingEntryIndex = allHistoryData.findIndex(item => 
          new Date(item.date).toISOString().split('T')[0] === dateStr
        );
        
        if (existingEntryIndex >= 0) {
          // Add to existing date value
          allHistoryData[existingEntryIndex].value += Number(entry.value);
        } else {
          // Create new date entry
          allHistoryData.push({
            date: new Date(entry.recordedAt),
            value: Number(entry.value)
          });
        }
      }
    }
    
    // Sort by date
    return allHistoryData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Milestone methods
  async getMilestones(userId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      (milestone) => milestone.userId === userId
    );
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.currentMilestoneId++;
    const milestone: Milestone = { 
      ...insertMilestone, 
      id, 
      isCompleted: false,
      createdAt: new Date()
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: number, isCompleted: boolean): Promise<Milestone> {
    const milestone = this.milestones.get(id);
    if (!milestone) {
      throw new Error("Milestone not found");
    }
    
    const updatedMilestone: Milestone = {
      ...milestone,
      isCompleted
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }

  // FIRE settings methods
  async getFireSettings(userId: number): Promise<FireSettings | undefined> {
    return Array.from(this.fireSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createFireSettings(insertSettings: InsertFireSettings): Promise<FireSettings> {
    const id = this.currentFireSettingsId++;
    const settings: FireSettings = { ...insertSettings, id };
    this.fireSettings.set(id, settings);
    return settings;
  }

  async updateFireSettings(userId: number, partialSettings: Partial<InsertFireSettings>): Promise<FireSettings> {
    const settings = Array.from(this.fireSettings.values()).find(
      (settings) => settings.userId === userId
    );
    
    if (!settings) {
      throw new Error("FIRE settings not found");
    }
    
    const updatedSettings: FireSettings = {
      ...settings,
      ...partialSettings
    };
    
    this.fireSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
