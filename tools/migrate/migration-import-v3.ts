import { db } from "../../server/db";
import { 
  coreUsers, 
  userAccounts, 
  userProfiles, 
  emailVerifications, 
  phoneVerifications, 
  passwordResets, 
  passwordChangeHistory, 
  refreshTokens, 
  userSubscriptions,
  userAccountBrokerProviderAssets,
  generalAssets,
  brokerProviderAssets,
  brokerProviders,
  brokerProviderAssetAPIKeyConnections,
  assetValues,
  assetContributions,
  recurringContributions,
  fireSettings,
  milestones,
  AccountType,
  ContributionInterval
} from "../../server/db/schema";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import readline from "readline";

interface MigrationData {
  version: string;
  exportedAt: string;
  coreUsers: Array<{
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  userAccounts: Array<{
    id: string;
    coreUserId: string;
    email: string;
    phoneNumber: string | null;
    passwordHash: string;
    fullName: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  userProfiles: Array<{
    id: string;
    userAccountId: string;
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  emailVerifications: Array<{
    id: string;
    userAccountId: string;
    token: string;
    isCompleted: boolean;
    completedAt: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  phoneVerifications: Array<{
    id: string;
    userAccountId: string;
    token: string;
    isCompleted: boolean;
    completedAt: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  passwordResets: Array<{
    id: string;
    userAccountId: string;
    token: string;
    isCompleted: boolean;
    completedAt: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  passwordChangeHistory: Array<{
    id: string;
    userAccountId: string;
    passwordHash: string;
    changedAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  refreshTokens: Array<{
    id: string;
    tenantId: string;
    userAccountId: string;
    tokenHash: string;
    familyId: string;
    parentTokenHash: string | null;
    deviceInfo: string | null;
    lastUsedAt: string;
    expiresAt: string;
    isRevoked: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  userSubscriptions: Array<{
    id: string;
    userAccountId: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  userAccountBrokerProviderAssets: Array<{
    id: string;
    userAccountId: string;
    brokerProviderAssetId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  generalAssets: Array<{
    id: string;
    assetType: string;
    name: string;
    currentValue: number;
    userAccountId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  brokerProviderAssets: Array<{
    id: string;
    assetType: string;
    name: string;
    currentValue: number;
    userAccountId: string;
    providerId: string;
    accountType: string;
    createdAt: string;
    updatedAt: string;
  }>;
  brokerProviders: Array<{
    id: string;
    name: string;
    supportsAPIKey: boolean;
    supportedAccountTypes: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  brokerProviderAssetAPIKeyConnections: Array<{
    id: string;
    brokerProviderAssetId: string;
    apiKey: string;
    createdAt: string;
    updatedAt: string;
  }>;
  assetValues: Array<{
    id: string;
    value: number;
    recordedAt: string;
    assetId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  assetContributions: Array<{
    id: string;
    value: number;
    recordedAt: string;
    assetId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  recurringContributions: Array<{
    id: string;
    assetId: string;
    amount: number;
    startDate: string;
    interval: string;
    lastProcessedDate: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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
    adjustInflation: boolean;
    statePensionAge: number;
    createdAt: string;
    updatedAt: string;
  }>;
  milestones: Array<{
    id: string;
    userAccountId: string;
    name: string;
    targetValue: string;
    accountType: string | null;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Maps to store old ID -> new ID relationships
const coreUserIdMap = new Map<string, string>();
const userAccountIdMap = new Map<string, string>();
const brokerProviderIdMap = new Map<string, string>();
const generalAssetIdMap = new Map<string, string>();
const brokerProviderAssetIdMap = new Map<string, string>();

async function selectMigrationFile(): Promise<string> {
  const dataDir = path.join(process.cwd(), "tools", "migrate", "data");
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file.includes('v3'));
  
  if (files.length === 0) {
    console.error("No v3 migration files found in the data directory");
    process.exit(1);
  }

  console.log("\nAvailable v3 migration files:");
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

async function importMigrationData(migrationData: MigrationData) {
  // Initialize counters for actual imported records
  let importedCoreUsers = 0;
  let importedUserAccounts = 0;
  let importedUserProfiles = 0;
  let importedBrokerProviders = 0;
  let importedGeneralAssets = 0;
  let importedBrokerProviderAssets = 0;
  let importedUserAccountBrokerProviderAssets = 0;
  let importedAPIKeyConnections = 0;
  let importedAssetValues = 0;
  let importedAssetContributions = 0;
  let importedRecurringContributions = 0;
  let importedFireSettings = 0;
  let importedMilestones = 0;
  let importedEmailVerifications = 0;
  let importedPhoneVerifications = 0;
  let importedPasswordResets = 0;
  let importedPasswordChangeHistory = 0;
  let importedRefreshTokens = 0;
  let importedUserSubscriptions = 0;

  // Initialize error logging arrays
  const importErrors: Array<{table: string, record: any, error: string}> = [];

  const idMappings: Record<string, string> = {};

  try {
    // Helper function to check if table exists
    const checkTableExists = async (tableName: string) => {
      try {
        await db.execute(sql`SELECT 1 FROM ${sql.identifier(tableName)} LIMIT 1`);
        return true;
      } catch (error) {
        console.warn(`⚠ Warning: Could not access ${tableName} - table may not exist or migration not applied`);
        console.warn(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        importErrors.push({table: tableName, record: null, error: error instanceof Error ? error.message : 'Unknown error'});
        return false;
      }
    };

    // 1. Import core users first (no dependencies)
    console.log("\n1. Importing core users...");
    if (await checkTableExists('core_users')) {
      for (const user of migrationData.coreUsers) {
        try {
          const newUser = await db.insert(coreUsers).values({
            status: user.status as "active" | "inactive" | "suspended"
          }).returning();

          idMappings[user.id] = newUser[0].id;
          importedCoreUsers++;
          console.log(`  ✓ Imported core user: ${user.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import core user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'coreUsers', record: user, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 2. Import user accounts (depends on core users)
    console.log("\n2. Importing user accounts...");
    if (await checkTableExists('user_accounts')) {
      for (const account of migrationData.userAccounts) {
        try {
          // Check if core user exists
          const coreUserId = idMappings[account.coreUserId];
          if (!coreUserId) {
            console.warn(`⚠ Warning: Core user ${account.coreUserId} not found for user account ${account.id}`);
            importErrors.push({table: 'userAccounts', record: account, error: `Core user ${account.coreUserId} not found`});
            continue;
          }

          const newAccount = await db.insert(userAccounts).values({
            coreUserId: coreUserId,
            email: account.email,
            phoneNumber: account.phoneNumber,
            passwordHash: account.passwordHash,
            fullName: account.fullName,
            isEmailVerified: account.isEmailVerified,
            isPhoneVerified: account.isPhoneVerified
          }).returning();

          idMappings[account.id] = newAccount[0].id;
          importedUserAccounts++;
          console.log(`  ✓ Imported user account: ${account.fullName}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import user account ${account.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'userAccounts', record: account, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 3. Import user profiles (depends on user accounts)
    console.log("\n3. Importing user profiles...");
    if (await checkTableExists('user_profiles')) {
      for (const profile of migrationData.userProfiles) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[profile.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${profile.userAccountId} not found for user profile ${profile.id}`);
            importErrors.push({table: 'userProfiles', record: profile, error: `User account ${profile.userAccountId} not found`});
            continue;
          }

          const newProfile = await db.insert(userProfiles).values({
            userAccountId: userAccountId,
            avatarUrl: profile.avatarUrl
          }).returning();

          idMappings[profile.id] = newProfile[0].id;
          importedUserProfiles++;
          console.log(`  ✓ Imported user profile: ${profile.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import user profile ${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'userProfiles', record: profile, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 4. Import broker providers (no dependencies)
    console.log("\n4. Importing broker providers...");
    if (await checkTableExists('broker_providers')) {
      for (const provider of migrationData.brokerProviders) {
        try {
          // Check if provider already exists by name
          const existingProvider = await db.query.brokerProviders.findFirst({
            where: eq(brokerProviders.name, provider.name)
          });

          if (existingProvider) {
            // Use existing provider's ID
            idMappings[provider.id] = existingProvider.id;
            console.log(`  ✓ Broker provider "${provider.name}" already exists, using existing ID: ${existingProvider.id}`);
          } else {
            // Import new provider
            const newProvider = await db.insert(brokerProviders).values({
              name: provider.name,
              supportsAPIKey: provider.supportsAPIKey,
              supportedAccountTypes: provider.supportedAccountTypes as AccountType[]
            }).returning();

            idMappings[provider.id] = newProvider[0].id;
            importedBrokerProviders++;
            console.log(`  ✓ Imported broker provider: ${provider.name}`);
          }
        } catch (error) {
          console.warn(`⚠ Warning: Could not import broker provider ${provider.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'brokerProviders', record: provider, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 5. Import general assets (depends on user accounts)
    console.log("\n5. Importing general assets...");
    if (await checkTableExists('general_assets')) {
      for (const asset of migrationData.generalAssets) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[asset.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${asset.userAccountId} not found for general asset ${asset.id}`);
            importErrors.push({table: 'generalAssets', record: asset, error: `User account ${asset.userAccountId} not found`});
            continue;
          }

          const newAsset = await db.insert(generalAssets).values({
            assetType: asset.assetType,
            name: asset.name,
            currentValue: asset.currentValue,
            userAccountId: userAccountId
          }).returning();

          idMappings[asset.id] = newAsset[0].id;
          importedGeneralAssets++;
          console.log(`  ✓ Imported general asset: ${asset.name}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import general asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'generalAssets', record: asset, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 6. Import broker provider assets (depends on user accounts and broker providers)
    console.log("\n6. Importing broker provider assets...");
    if (await checkTableExists('broker_provider_assets')) {
      for (const asset of migrationData.brokerProviderAssets) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[asset.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${asset.userAccountId} not found for broker provider asset ${asset.id}`);
            importErrors.push({table: 'brokerProviderAssets', record: asset, error: `User account ${asset.userAccountId} not found`});
            continue;
          }

          // Check if broker provider exists
          const providerId = idMappings[asset.providerId];
          if (!providerId) {
            console.warn(`⚠ Warning: Broker provider ${asset.providerId} not found for broker provider asset ${asset.id}`);
            importErrors.push({table: 'brokerProviderAssets', record: asset, error: `Broker provider ${asset.providerId} not found`});
            continue;
          }

          const newAsset = await db.insert(brokerProviderAssets).values({
            assetType: asset.assetType,
            name: asset.name,
            currentValue: asset.currentValue,
            userAccountId: userAccountId,
            providerId: providerId,
            accountType: asset.accountType
          }).returning();

          idMappings[asset.id] = newAsset[0].id;
          importedBrokerProviderAssets++;
          console.log(`  ✓ Imported broker provider asset: ${asset.name}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import broker provider asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'brokerProviderAssets', record: asset, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 7. Import user account broker provider assets (depends on user accounts and broker provider assets)
    console.log("\n7. Importing user account broker provider assets...");
    if (await checkTableExists('user_account_broker_provider_assets')) {
      for (const link of migrationData.userAccountBrokerProviderAssets) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[link.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${link.userAccountId} not found for user account broker provider asset link ${link.id}`);
            importErrors.push({table: 'userAccountBrokerProviderAssets', record: link, error: `User account ${link.userAccountId} not found`});
            continue;
          }

          // Check if broker provider asset exists
          const brokerProviderAssetId = idMappings[link.brokerProviderAssetId];
          if (!brokerProviderAssetId) {
            console.warn(`⚠ Warning: Broker provider asset ${link.brokerProviderAssetId} not found for user account broker provider asset link ${link.id}`);
            importErrors.push({table: 'userAccountBrokerProviderAssets', record: link, error: `Broker provider asset ${link.brokerProviderAssetId} not found`});
            continue;
          }

          const newLink = await db.insert(userAccountBrokerProviderAssets).values({
            userAccountId: userAccountId,
            brokerProviderAssetId: brokerProviderAssetId
          }).returning();

          idMappings[link.id] = newLink[0].id;
          importedUserAccountBrokerProviderAssets++;
          console.log(`  ✓ Imported user account broker provider asset link: ${link.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import user account broker provider asset link ${link.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'userAccountBrokerProviderAssets', record: link, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 8. Import broker provider asset API key connections (depends on broker provider assets)
    console.log("\n8. Importing broker provider asset API key connections...");
    if (await checkTableExists('broker_provider_asset_api_key_connections')) {
      for (const connection of migrationData.brokerProviderAssetAPIKeyConnections) {
        try {
          // Check if broker provider asset exists
          const brokerProviderAssetId = idMappings[connection.brokerProviderAssetId];
          if (!brokerProviderAssetId) {
            console.warn(`⚠ Warning: Broker provider asset ${connection.brokerProviderAssetId} not found for API key connection ${connection.id}`);
            importErrors.push({table: 'brokerProviderAssetAPIKeyConnections', record: connection, error: `Broker provider asset ${connection.brokerProviderAssetId} not found`});
            continue;
          }

          const newConnection = await db.insert(brokerProviderAssetAPIKeyConnections).values({
            brokerProviderAssetId: brokerProviderAssetId,
            apiKey: connection.apiKey
          }).returning();

          idMappings[connection.id] = newConnection[0].id;
          importedAPIKeyConnections++;
          console.log(`  ✓ Imported API key connection: ${connection.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import API key connection ${connection.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'brokerProviderAssetAPIKeyConnections', record: connection, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 9. Import asset values (depends on assets)
    console.log("\n9. Importing asset values...");
    if (await checkTableExists('asset_values')) {
      for (const value of migrationData.assetValues) {
        try {
          // Check if asset exists (could be general asset or broker provider asset)
          const assetId = idMappings[value.assetId];
          if (!assetId) {
            console.warn(`⚠ Warning: Asset ${value.assetId} not found for asset value ${value.id}`);
            importErrors.push({table: 'assetValues', record: value, error: `Asset ${value.assetId} not found`});
            continue;
          }

          const newValue = await db.insert(assetValues).values({
            value: value.value,
            recordedAt: new Date(value.recordedAt),
            assetId: assetId
          }).returning();

          idMappings[value.id] = newValue[0].id;
          importedAssetValues++;
          console.log(`  ✓ Imported asset value: ${value.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import asset value ${value.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'assetValues', record: value, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 10. Import asset contributions (depends on assets)
    console.log("\n10. Importing asset contributions...");
    if (await checkTableExists('asset_contributions')) {
      for (const contribution of migrationData.assetContributions) {
        try {
          // Check if asset exists (could be general asset or broker provider asset)
          const assetId = idMappings[contribution.assetId];
          if (!assetId) {
            console.warn(`⚠ Warning: Asset ${contribution.assetId} not found for asset contribution ${contribution.id}`);
            importErrors.push({table: 'assetContributions', record: contribution, error: `Asset ${contribution.assetId} not found`});
            continue;
          }

          const newContribution = await db.insert(assetContributions).values({
            value: contribution.value,
            recordedAt: new Date(contribution.recordedAt),
            assetId: assetId
          }).returning();

          idMappings[contribution.id] = newContribution[0].id;
          importedAssetContributions++;
          console.log(`  ✓ Imported asset contribution: ${contribution.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import asset contribution ${contribution.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'assetContributions', record: contribution, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 11. Import recurring contributions (depends on broker provider assets)
    console.log("\n11. Importing recurring contributions...");
    if (await checkTableExists('recurring_contributions')) {
      for (const contribution of migrationData.recurringContributions) {
        try {
          // Check if broker provider asset exists
          const assetId = idMappings[contribution.assetId];
          if (!assetId) {
            console.warn(`⚠ Warning: Broker provider asset ${contribution.assetId} not found for recurring contribution ${contribution.id}`);
            importErrors.push({table: 'recurringContributions', record: contribution, error: `Broker provider asset ${contribution.assetId} not found`});
            continue;
          }

          const newContribution = await db.insert(recurringContributions).values({
            assetId: assetId,
            amount: contribution.amount,
            startDate: new Date(contribution.startDate),
            interval: contribution.interval as ContributionInterval,
            lastProcessedDate: contribution.lastProcessedDate ? new Date(contribution.lastProcessedDate) : null,
            isActive: contribution.isActive
          }).returning();

          idMappings[contribution.id] = newContribution[0].id;
          importedRecurringContributions++;
          console.log(`  ✓ Imported recurring contribution: ${contribution.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import recurring contribution ${contribution.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'recurringContributions', record: contribution, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 12. Import FIRE settings (depends on user accounts)
    console.log("\n12. Importing FIRE settings...");
    if (await checkTableExists('fire_settings')) {
      for (const setting of migrationData.fireSettings) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[setting.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${setting.userAccountId} not found for FIRE setting ${setting.id}`);
            importErrors.push({table: 'fireSettings', record: setting, error: `User account ${setting.userAccountId} not found`});
            continue;
          }

          const newSetting = await db.insert(fireSettings).values({
            userAccountId: userAccountId,
            targetRetirementAge: setting.targetRetirementAge,
            annualIncomeGoal: setting.annualIncomeGoal,
            expectedAnnualReturn: setting.expectedAnnualReturn,
            safeWithdrawalRate: setting.safeWithdrawalRate,
            monthlyInvestment: setting.monthlyInvestment,
            currentAge: setting.currentAge,
            adjustInflation: setting.adjustInflation,
            statePensionAge: setting.statePensionAge
          }).returning();

          idMappings[setting.id] = newSetting[0].id;
          importedFireSettings++;
          console.log(`  ✓ Imported FIRE setting: ${setting.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import FIRE setting ${setting.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'fireSettings', record: setting, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 13. Import milestones (depends on user accounts)
    console.log("\n13. Importing milestones...");
    if (await checkTableExists('milestones')) {
      for (const milestone of migrationData.milestones) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[milestone.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${milestone.userAccountId} not found for milestone ${milestone.id}`);
            importErrors.push({table: 'milestones', record: milestone, error: `User account ${milestone.userAccountId} not found`});
            continue;
          }

          const newMilestone = await db.insert(milestones).values({
            id: milestone.id,
            userAccountId: userAccountId,
            name: milestone.name,
            targetValue: milestone.targetValue,
            accountType: milestone.accountType,
            isCompleted: milestone.isCompleted
          }).returning();

          idMappings[milestone.id] = newMilestone[0].id;
          importedMilestones++;
          console.log(`  ✓ Imported milestone: ${milestone.name}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import milestone ${milestone.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'milestones', record: milestone, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // 14. Import auth-related tables (depends on core users)
    console.log("\n14. Importing auth-related tables...");
    
    // Email verifications
    if (await checkTableExists('email_verifications')) {
      for (const verification of migrationData.emailVerifications) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[verification.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${verification.userAccountId} not found for email verification ${verification.id}`);
            importErrors.push({table: 'emailVerifications', record: verification, error: `User account ${verification.userAccountId} not found`});
            continue;
          }

          const newVerification = await db.insert(emailVerifications).values({
            userAccountId: userAccountId,
            token: verification.token,
            isCompleted: verification.isCompleted,
            completedAt: verification.completedAt ? new Date(verification.completedAt) : null,
            expiresAt: new Date(verification.expiresAt)
          }).returning();

          idMappings[verification.id] = newVerification[0].id;
          importedEmailVerifications++;
          console.log(`  ✓ Imported email verification: ${verification.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import email verification ${verification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'emailVerifications', record: verification, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // Phone verifications
    if (await checkTableExists('phone_verifications')) {
      for (const verification of migrationData.phoneVerifications) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[verification.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${verification.userAccountId} not found for phone verification ${verification.id}`);
            importErrors.push({table: 'phoneVerifications', record: verification, error: `User account ${verification.userAccountId} not found`});
            continue;
          }

          const newVerification = await db.insert(phoneVerifications).values({
            userAccountId: userAccountId,
            token: verification.token,
            isCompleted: verification.isCompleted,
            completedAt: verification.completedAt ? new Date(verification.completedAt) : null,
            expiresAt: new Date(verification.expiresAt)
          }).returning();

          idMappings[verification.id] = newVerification[0].id;
          importedPhoneVerifications++;
          console.log(`  ✓ Imported phone verification: ${verification.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import phone verification ${verification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'phoneVerifications', record: verification, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // Password resets
    if (await checkTableExists('password_resets')) {
      for (const reset of migrationData.passwordResets) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[reset.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${reset.userAccountId} not found for password reset ${reset.id}`);
            importErrors.push({table: 'passwordResets', record: reset, error: `User account ${reset.userAccountId} not found`});
            continue;
          }

          const newReset = await db.insert(passwordResets).values({
            userAccountId: userAccountId,
            token: reset.token,
            isCompleted: reset.isCompleted,
            completedAt: reset.completedAt ? new Date(reset.completedAt) : null,
            expiresAt: new Date(reset.expiresAt)
          }).returning();

          idMappings[reset.id] = newReset[0].id;
          importedPasswordResets++;
          console.log(`  ✓ Imported password reset: ${reset.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import password reset ${reset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'passwordResets', record: reset, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // Password change history
    if (await checkTableExists('password_change_history')) {
      for (const history of migrationData.passwordChangeHistory) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[history.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${history.userAccountId} not found for password change history ${history.id}`);
            importErrors.push({table: 'passwordChangeHistory', record: history, error: `User account ${history.userAccountId} not found`});
            continue;
          }

          const newHistory = await db.insert(passwordChangeHistory).values({
            userAccountId: userAccountId,
            passwordHash: history.passwordHash,
            changedAt: new Date(history.changedAt)
          }).returning();

          idMappings[history.id] = newHistory[0].id;
          importedPasswordChangeHistory++;
          console.log(`  ✓ Imported password change history: ${history.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import password change history ${history.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'passwordChangeHistory', record: history, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // Refresh tokens
    if (await checkTableExists('refresh_tokens')) {
      for (const token of migrationData.refreshTokens) {
        try {
          // Check if core user exists (tenantId)
          const tenantId = idMappings[token.tenantId];
          if (!tenantId) {
            console.warn(`⚠ Warning: Core user ${token.tenantId} not found for refresh token ${token.id}`);
            importErrors.push({table: 'refreshTokens', record: token, error: `Core user ${token.tenantId} not found`});
            continue;
          }

          // Check if user account exists
          const userAccountId = idMappings[token.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${token.userAccountId} not found for refresh token ${token.id}`);
            importErrors.push({table: 'refreshTokens', record: token, error: `User account ${token.userAccountId} not found`});
            continue;
          }

          const newToken = await db.insert(refreshTokens).values({
            tenantId: tenantId,
            userAccountId: userAccountId,
            tokenHash: token.tokenHash,
            familyId: token.familyId,
            parentTokenHash: token.parentTokenHash,
            deviceInfo: token.deviceInfo,
            lastUsedAt: new Date(token.lastUsedAt),
            expiresAt: new Date(token.expiresAt),
            isRevoked: token.isRevoked
          }).returning();

          idMappings[token.id] = newToken[0].id;
          importedRefreshTokens++;
          console.log(`  ✓ Imported refresh token: ${token.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import refresh token ${token.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'refreshTokens', record: token, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // User subscriptions
    if (await checkTableExists('user_subscriptions')) {
      for (const subscription of migrationData.userSubscriptions) {
        try {
          // Check if user account exists
          const userAccountId = idMappings[subscription.userAccountId];
          if (!userAccountId) {
            console.warn(`⚠ Warning: User account ${subscription.userAccountId} not found for user subscription ${subscription.id}`);
            importErrors.push({table: 'userSubscriptions', record: subscription, error: `User account ${subscription.userAccountId} not found`});
            continue;
          }

          const newSubscription = await db.insert(userSubscriptions).values({
            userAccountId: userAccountId,
            plan: subscription.plan,
            status: subscription.status as "active" | "cancelled" | "expired",
            startDate: new Date(subscription.startDate),
            endDate: subscription.endDate ? new Date(subscription.endDate) : null
          }).returning();

          idMappings[subscription.id] = newSubscription[0].id;
          importedUserSubscriptions++;
          console.log(`  ✓ Imported user subscription: ${subscription.id}`);
        } catch (error) {
          console.warn(`⚠ Warning: Could not import user subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          importErrors.push({table: 'userSubscriptions', record: subscription, error: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    console.log("\nImport completed successfully!");
    console.log("\nImport Summary:");
    console.log(`- Core Users: ${importedCoreUsers}/${migrationData.coreUsers.length}`);
    console.log(`- User Accounts: ${importedUserAccounts}/${migrationData.userAccounts.length}`);
    console.log(`- User Profiles: ${importedUserProfiles}/${migrationData.userProfiles.length}`);
    console.log(`- Broker Providers: ${importedBrokerProviders}/${migrationData.brokerProviders.length}`);
    console.log(`- General Assets: ${importedGeneralAssets}/${migrationData.generalAssets.length}`);
    console.log(`- Broker Provider Assets: ${importedBrokerProviderAssets}/${migrationData.brokerProviderAssets.length}`);
    console.log(`- User Account Broker Provider Assets: ${importedUserAccountBrokerProviderAssets}/${migrationData.userAccountBrokerProviderAssets.length}`);
    console.log(`- Broker Provider Asset API Key Connections: ${importedAPIKeyConnections}/${migrationData.brokerProviderAssetAPIKeyConnections.length}`);
    console.log(`- Asset Values: ${importedAssetValues}/${migrationData.assetValues.length}`);
    console.log(`- Asset Contributions: ${importedAssetContributions}/${migrationData.assetContributions.length}`);
    console.log(`- Recurring Contributions: ${importedRecurringContributions}/${migrationData.recurringContributions.length}`);
    console.log(`- FIRE Settings: ${importedFireSettings}/${migrationData.fireSettings.length}`);
    console.log(`- Milestones: ${importedMilestones}/${migrationData.milestones.length}`);
    console.log(`- Email Verifications: ${importedEmailVerifications}/${migrationData.emailVerifications.length}`);
    console.log(`- Phone Verifications: ${importedPhoneVerifications}/${migrationData.phoneVerifications.length}`);
    console.log(`- Password Resets: ${importedPasswordResets}/${migrationData.passwordResets.length}`);
    console.log(`- Password Change History: ${importedPasswordChangeHistory}/${migrationData.passwordChangeHistory.length}`);
    console.log(`- Refresh Tokens: ${importedRefreshTokens}/${migrationData.refreshTokens.length}`);
    console.log(`- User Subscriptions: ${importedUserSubscriptions}/${migrationData.userSubscriptions.length}`);

    // Display error summary
    if (importErrors.length > 0) {
      console.log(`\n❌ Import Errors Summary: ${importErrors.length} total errors`);
      
      // Group errors by table
      const errorsByTable = importErrors.reduce((acc, error) => {
        if (!acc[error.table]) {
          acc[error.table] = [];
        }
        acc[error.table].push(error);
        return acc;
      }, {} as Record<string, typeof importErrors>);

      Object.entries(errorsByTable).forEach(([table, errors]) => {
        console.log(`\n📋 ${table}: ${errors.length} errors`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.error}`);
          if (error.record && error.record.id) {
            console.log(`     Record ID: ${error.record.id}`);
          }
        });
      });
    } else {
      console.log("\n✅ No import errors occurred!");
    }

  } catch (error) {
    console.error("Error during import:", error);
    throw error;
  }
}

// Run the import
async function main() {
  try {
    const migrationFileName = await selectMigrationFile();
    const migrationFilePath = path.join(process.cwd(), "tools", "migrate", "data", migrationFileName);
    console.log(`\nLoading migration data from: ${migrationFilePath}`);
    
    const migrationData: MigrationData = JSON.parse(fs.readFileSync(migrationFilePath, 'utf-8'));
    console.log(`\nMigration data loaded successfully!`);
    console.log(`- Version: ${migrationData.version}`);
    console.log(`- Exported at: ${migrationData.exportedAt}`);
    console.log(`- Core Users: ${migrationData.coreUsers.length}`);
    console.log(`- User Accounts: ${migrationData.userAccounts.length}`);
    console.log(`- User Profiles: ${migrationData.userProfiles.length}`);
    console.log(`- Broker Providers: ${migrationData.brokerProviders.length}`);
    console.log(`- General Assets: ${migrationData.generalAssets.length}`);
    console.log(`- Broker Provider Assets: ${migrationData.brokerProviderAssets.length}`);
    console.log(`- User Account Broker Provider Assets: ${migrationData.userAccountBrokerProviderAssets.length}`);
    console.log(`- Broker Provider Asset API Key Connections: ${migrationData.brokerProviderAssetAPIKeyConnections.length}`);
    console.log(`- Asset Values: ${migrationData.assetValues.length}`);
    console.log(`- Asset Contributions: ${migrationData.assetContributions.length}`);
    console.log(`- Recurring Contributions: ${migrationData.recurringContributions.length}`);
    console.log(`- FIRE Settings: ${migrationData.fireSettings.length}`);
    console.log(`- Milestones: ${migrationData.milestones.length}`);
    console.log(`- Email Verifications: ${migrationData.emailVerifications.length}`);
    console.log(`- Phone Verifications: ${migrationData.phoneVerifications.length}`);
    console.log(`- Password Resets: ${migrationData.passwordResets.length}`);
    console.log(`- Password Change History: ${migrationData.passwordChangeHistory.length}`);
    console.log(`- Refresh Tokens: ${migrationData.refreshTokens.length}`);
    console.log(`- User Subscriptions: ${migrationData.userSubscriptions.length}`);
    
    await importMigrationData(migrationData);
  } catch (error) {
    console.error("Error during import:", error);
    process.exit(1);
  }
}

main();
