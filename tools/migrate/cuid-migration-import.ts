import { db } from "../../server/db";
import { coreUsers, userAccounts, userProfiles, accounts, accountHistory, fireSettings, milestones } from "../../shared/schema";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import readline from "readline";

interface MigrationData {
  version: string;
  exportedAt: string;
  users: Array<{
    id: number;
    username: string;
    password: string;
  }>;
  accounts: Array<{
    id: number;
    userId: number;
    provider: string;
    accountType: string;
    currentValue: string;
    isApiConnected: boolean;
    apiKey: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  accountHistory: Array<{
    id: number;
    accountId: number;
    value: string;
    recordedAt: string;
  }>;
  fireSettings: Array<{
    id: number;
    userId: number;
    targetRetirementAge: number;
    annualIncomeGoal: string;
    expectedAnnualReturn: string;
    safeWithdrawalRate: string;
    monthlyInvestment: string;
    currentAge: number;
  }>;
  milestones: Array<{
    id: number;
    userId: number;
    name: string;
    targetValue: string;
    accountType: string | null;
    isCompleted: boolean;
    createdAt: string;
  }>;
}

// Maps to store old ID -> new CUID relationships
const userIdMap = new Map<number, { coreUserId: string; userAccountId: string }>();
const accountIdMap = new Map<number, string>();

async function selectMigrationFile(): Promise<string> {
  const dataDir = join(process.cwd(), "tools", "migrate", "data");
  const files = readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.error("No migration files found in the data directory");
    process.exit(1);
  }

  console.log("\nAvailable migration files:");
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("\nEnter the number of the file to import: ", (answer) => {
      const index = parseInt(answer) - 1;
      if (isNaN(index) || index < 0 || index >= files.length) {
        console.error("Invalid selection");
        process.exit(1);
      }
      rl.close();
      resolve(files[index]);
    });
  });
}

async function importData() {
  console.log("Starting data import...");

  // Select and read the migration data
  const selectedFile = await selectMigrationFile();
  const migrationDataPath = join(process.cwd(), "tools", "migrate", "data", selectedFile);
  const migrationData: MigrationData = JSON.parse(readFileSync(migrationDataPath, "utf-8"));

  try {
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // 1. Import users first
      console.log("Importing users...");
      for (const user of migrationData.users) {
        // Create core user
        const [newCoreUser] = await tx
          .insert(coreUsers)
          .values({
            status: "active",
          })
          .returning();

        // Create user account
        const [newUserAccount] = await tx
          .insert(userAccounts)
          .values({
            coreUserId: newCoreUser.id,
            email: user.username, // Using username as email since that's what we have
            passwordHash: user.password,
            fullName: "Migrated User", // Default value since we don't have this data
            isEmailVerified: true, // Mark as verified since these are existing users
            isPhoneVerified: false,
          })
          .returning();

        // Create user profile
        await tx
          .insert(userProfiles)
          .values({
            userAccountId: newUserAccount.id,
          });

        userIdMap.set(user.id, {
          coreUserId: newCoreUser.id,
          userAccountId: newUserAccount.id
        });
      }
      console.log(`Imported ${migrationData.users.length} users`);

      // 2. Import accounts
      console.log("Importing accounts...");
      for (const account of migrationData.accounts) {
        const userMapping = userIdMap.get(account.userId)!;
        const [newAccount] = await tx
          .insert(accounts)
          .values({
            userAccountId: userMapping.userAccountId,
            provider: account.provider,
            accountType: account.accountType,
            currentValue: account.currentValue,
            isApiConnected: account.isApiConnected,
            apiKey: account.apiKey,
            createdAt: new Date(account.createdAt),
            updatedAt: new Date(account.updatedAt),
          })
          .returning();
        
        accountIdMap.set(account.id, newAccount.id);
      }
      console.log(`Imported ${migrationData.accounts.length} accounts`);

      // 3. Import account history
      console.log("Importing account history...");
      for (const history of migrationData.accountHistory) {
        await tx.insert(accountHistory).values({
          accountId: accountIdMap.get(history.accountId)!,
          value: history.value,
          recordedAt: new Date(history.recordedAt),
        });
      }
      console.log(`Imported ${migrationData.accountHistory.length} account history records`);

      // 4. Import FIRE settings
      console.log("Importing FIRE settings...");
      for (const setting of migrationData.fireSettings) {
        const userMapping = userIdMap.get(setting.userId)!;
        await tx.insert(fireSettings).values({
          userAccountId: userMapping.userAccountId,
          targetRetirementAge: setting.targetRetirementAge,
          annualIncomeGoal: setting.annualIncomeGoal,
          expectedAnnualReturn: setting.expectedAnnualReturn,
          safeWithdrawalRate: setting.safeWithdrawalRate,
          monthlyInvestment: setting.monthlyInvestment,
          currentAge: setting.currentAge,
        });
      }
      console.log(`Imported ${migrationData.fireSettings.length} FIRE settings`);

      // 5. Import milestones
      console.log("Importing milestones...");
      for (const milestone of migrationData.milestones) {
        const userMapping = userIdMap.get(milestone.userId)!;
        await tx.insert(milestones).values({
          userAccountId: userMapping.userAccountId,
          name: milestone.name,
          targetValue: milestone.targetValue,
          accountType: milestone.accountType,
          isCompleted: milestone.isCompleted,
          createdAt: new Date(milestone.createdAt),
        });
      }
      console.log(`Imported ${migrationData.milestones.length} milestones`);
    });

    console.log("\nImport completed successfully!");
    console.log("\nImport Summary:");
    console.log(`- Users: ${migrationData.users.length}`);
    console.log(`- Accounts: ${migrationData.accounts.length}`);
    console.log(`- Account History: ${migrationData.accountHistory.length}`);
    console.log(`- FIRE Settings: ${migrationData.fireSettings.length}`);
    console.log(`- Milestones: ${migrationData.milestones.length}`);

  } catch (error) {
    console.error("Error during import:", error);
    process.exit(1);
  }
}

// Run the import
importData().catch((error) => {
  console.error("Error during import:", error);
  process.exit(1);
}); 
