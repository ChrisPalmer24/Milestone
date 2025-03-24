import { storage } from './storage';
import type { Account } from '@shared/schema';

/**
 * Class to simulate Trading212 API interactions
 * In a real implementation, this would connect to Trading212's API
 */
export class Trading212Service {
  // Cache to store accounts that need updating
  private static apiConnectedAccounts: Map<number, number> = new Map();
  private static isRunning: boolean = false;
  
  /**
   * Start the background update process for API-connected accounts
   */
  static startAutoUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🔄 Starting Trading212 API auto-update service");
    
    // Run updates every 30 seconds
    setInterval(async () => {
      try {
        await this.updateAllConnectedAccounts();
      } catch (error) {
        console.error("Error updating connected accounts:", error);
      }
    }, 30000);
    
    // Initial update
    this.updateAllConnectedAccounts().catch(error => {
      console.error("Error during initial account update:", error);
    });
  }
  
  /**
   * Find all Trading212-connected accounts and update their values
   */
  static async updateAllConnectedAccounts() {
    // Get all accounts
    const allAccounts = await this.getAllApiConnectedAccounts();
    
    if (allAccounts.length === 0) {
      return;
    }
    
    console.log(`🔄 Updating ${allAccounts.length} Trading212-connected accounts`);
    
    // Process each account
    for (const account of allAccounts) {
      await this.updateAccountValue(account);
    }
  }
  
  /**
   * Fetch all accounts that have Trading212 API connections
   */
  private static async getAllApiConnectedAccounts(): Promise<Account[]> {
    // Get all users (in a real app with multiple users, we'd need more logic here)
    const userId = 1; // Demo user
    const accounts = await storage.getAccounts(userId);
    
    // Filter for accounts with Trading212 API connections
    return accounts.filter(account => {
      return (account.isApiConnected && 
              account.apiKey && 
              isTrading212Account(account.provider));
    });
  }
  
  /**
   * Update a single account with simulated data from Trading212
   */
  private static async updateAccountValue(account: Account) {
    // Get current value
    const currentValue = Number(account.currentValue);
    
    // For demo, simulate market fluctuations by randomly changing the value
    // by -2% to +2% from the current value
    const percentageChange = (Math.random() * 4) - 2; // -2% to +2%
    const changeAmount = currentValue * (percentageChange / 100);
    const newValue = Math.max(0, currentValue + changeAmount); // Ensure it doesn't go negative
    
    // Only update if the value changed meaningfully (more than £0.10)
    if (Math.abs(newValue - currentValue) > 0.1) {
      console.log(`📊 Account ${account.id} (${account.provider}): £${currentValue.toFixed(2)} → £${newValue.toFixed(2)} (${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(2)}%)`);
      
      // Update the account value
      await storage.updateAccount(account.id, newValue);
    }
  }
}

/**
 * Helper to check if account is from Trading212
 */
function isTrading212Account(provider: string): boolean {
  return provider.toLowerCase() === "trading212" || 
         provider.toLowerCase() === "trading 212";
}