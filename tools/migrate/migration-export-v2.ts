import { db } from "../../server/db";
import { coreUsers, userAccounts, userProfiles, accounts, accountHistory, fireSettings, milestones } from "../../shared/schema";
import { writeFileSync } from "fs";
import { join } from "path";

interface MigrationData {
  version: string;
  exportedAt: string;
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  }>;
  accounts: Array<{
    id: string;
    userAccountId: string;
    provider: string;
    accountType: string;
    currentValue: string;
    isApiConnected: boolean;
    apiKey: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  accountHistory: Array<{
    id: string;
    accountId: string;
    value: string;
    recordedAt: string;
  }>;
  fireSettings: Array<{
    id: string;
    userAccountId: string;
    targetRetirementAge: number;
    annualIncomeGoal: string;
    expectedAnnualReturn: string;
    safeWithdrawalRate: string;
    monthlyInvestment: string;
    currentAge: number;
  }>;
  milestones: Array<{
    id: string;
    userAccountId: string;
    name: string;
    targetValue: string;
    accountType: string | null;
    isCompleted: boolean;
    createdAt: string;
  }>;
}

async function exportData() {
  console.log("Starting data export...");

  try {
    // Fetch all data in a single transaction
    const data = await db.transaction(async (tx) => {
      // 1. Fetch users (core users and user accounts)
      const coreUsersData = await tx.select().from(coreUsers);
      const userAccountsData = await tx.select().from(userAccounts);
      const userProfilesData = await tx.select().from(userProfiles);

      // 2. Fetch accounts
      const accountsData = await tx.select().from(accounts);

      // 3. Fetch account history
      const accountHistoryData = await tx.select().from(accountHistory);

      // 4. Fetch FIRE settings
      const fireSettingsData = await tx.select().from(fireSettings);

      // 5. Fetch milestones
      const milestonesData = await tx.select().from(milestones);

      return {
        coreUsers: coreUsersData,
        userAccounts: userAccountsData,
        userProfiles: userProfilesData,
        accounts: accountsData,
        accountHistory: accountHistoryData,
        fireSettings: fireSettingsData,
        milestones: milestonesData,
      };
    });

    // Transform the data into the migration format
    const migrationData: MigrationData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      users: data.userAccounts.map(account => ({
        id: account.id,
        email: account.email,
        passwordHash: account.passwordHash,
        fullName: account.fullName,
        isEmailVerified: account.isEmailVerified,
        isPhoneVerified: account.isPhoneVerified,
      })),
      accounts: data.accounts.map(account => ({
        id: account.id,
        userAccountId: account.userAccountId,
        provider: account.provider,
        accountType: account.accountType,
        currentValue: account.currentValue,
        isApiConnected: account.isApiConnected,
        apiKey: account.apiKey,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      })),
      accountHistory: data.accountHistory.map(history => ({
        id: history.id,
        accountId: history.accountId,
        value: history.value,
        recordedAt: history.recordedAt.toISOString(),
      })),
      fireSettings: data.fireSettings.map(setting => ({
        id: setting.id,
        userAccountId: setting.userAccountId,
        targetRetirementAge: setting.targetRetirementAge,
        annualIncomeGoal: setting.annualIncomeGoal,
        expectedAnnualReturn: setting.expectedAnnualReturn,
        safeWithdrawalRate: setting.safeWithdrawalRate,
        monthlyInvestment: setting.monthlyInvestment,
        currentAge: setting.currentAge,
      })),
      milestones: data.milestones.map(milestone => ({
        id: milestone.id,
        userAccountId: milestone.userAccountId,
        name: milestone.name,
        targetValue: milestone.targetValue,
        accountType: milestone.accountType,
        isCompleted: milestone.isCompleted,
        createdAt: milestone.createdAt.toISOString(),
      })),
    };

    // Write the data to a file
    const exportPath = join(process.cwd(), "tools", "migrate", "data", `migration-export-v2-${new Date().toISOString().split('T')[0]}.json`);
    writeFileSync(exportPath, JSON.stringify(migrationData, null, 2));

    console.log("\nExport completed successfully!");
    console.log("\nExport Summary:");
    console.log(`- Users: ${migrationData.users.length}`);
    console.log(`- Accounts: ${migrationData.accounts.length}`);
    console.log(`- Account History: ${migrationData.accountHistory.length}`);
    console.log(`- FIRE Settings: ${migrationData.fireSettings.length}`);
    console.log(`- Milestones: ${migrationData.milestones.length}`);
    console.log(`\nData exported to: ${exportPath}`);

  } catch (error) {
    console.error("Error during export:", error);
    process.exit(1);
  }
}

// Run the export
exportData().catch((error) => {
  console.error("Error during export:", error);
  process.exit(1);
}); 
