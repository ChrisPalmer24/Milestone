import { db } from "../../server/db";
import { users, accounts, accountHistory, fireSettings, milestones } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { writeFileSync, promises as fs } from "fs";
import { join } from "path";

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
    createdAt: Date;
    updatedAt: Date;
  }>;
  accountHistory: Array<{
    id: number;
    accountId: number;
    value: string;
    recordedAt: Date;
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
    createdAt: Date;
  }>;
}

async function exportData() {
  console.log("Starting data export...");

  // Fetch all data from each table
  const [usersData, accountsData, accountHistoryData, fireSettingsData, milestonesData] = await Promise.all([
    db.select().from(users),
    db.select().from(accounts),
    db.select().from(accountHistory),
    db.select().from(fireSettings),
    db.select().from(milestones),
  ]);

  const migrationData: MigrationData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    users: usersData,
    accounts: accountsData,
    accountHistory: accountHistoryData,
    fireSettings: fireSettingsData,
    milestones: milestonesData,
  };

  // Create the output directory if it doesn't exist
  const outputDir = join(process.cwd(), "tools", "migrate", "data");
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error("Error creating output directory:", error);
    process.exit(1);
  }

  // Write the data to a JSON file
  const outputPath = join(outputDir, "cuid-migration-data.json");
  writeFileSync(outputPath, JSON.stringify(migrationData, null, 2));

  console.log(`Data exported successfully to ${outputPath}`);
  console.log("\nExport Summary:");
  console.log(`- Users: ${usersData.length}`);
  console.log(`- Accounts: ${accountsData.length}`);
  console.log(`- Account History: ${accountHistoryData.length}`);
  console.log(`- FIRE Settings: ${fireSettingsData.length}`);
  console.log(`- Milestones: ${milestonesData.length}`);
}

// Run the export
exportData().catch((error) => {
  console.error("Error during export:", error);
  process.exit(1);
}); 
