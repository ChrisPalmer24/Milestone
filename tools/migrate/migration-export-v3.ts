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
  milestones
} from "../../server/db/schema";
import { writeFileSync } from "fs";
import { join } from "path";

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

async function exportData() {
  console.log("Starting v3 data export...");

  try {
    // Fetch all data in a single transaction
    const data = await db.transaction(async (tx) => {
      const results: any = {};

      // Helper function to safely export a table
      const safeExportTable = async (tableName: string, exportFn: () => Promise<any[]>) => {
        try {
          const data = await exportFn();
          console.log(`✓ Successfully exported ${tableName}: ${data.length} records`);
          return data;
        } catch (error) {
          console.warn(`⚠ Warning: Could not export ${tableName} - table may not exist or migration not applied`);
          console.warn(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return [];
        }
      };

      // User management tables
      results.coreUsers = await safeExportTable('core_users', () => tx.select().from(coreUsers));
      results.userAccounts = await safeExportTable('user_accounts', () => tx.select().from(userAccounts));
      results.userProfiles = await safeExportTable('user_profiles', () => tx.select().from(userProfiles));
      results.emailVerifications = await safeExportTable('email_verifications', () => tx.select().from(emailVerifications));
      results.phoneVerifications = await safeExportTable('phone_verifications', () => tx.select().from(phoneVerifications));
      results.passwordResets = await safeExportTable('password_resets', () => tx.select().from(passwordResets));
      results.passwordChangeHistory = await safeExportTable('password_change_history', () => tx.select().from(passwordChangeHistory));
      results.refreshTokens = await safeExportTable('refresh_tokens', () => tx.select().from(refreshTokens));
      results.userSubscriptions = await safeExportTable('user_subscriptions', () => tx.select().from(userSubscriptions));
      results.userAccountBrokerProviderAssets = await safeExportTable('user_account_broker_provider_assets', () => tx.select().from(userAccountBrokerProviderAssets));

      // Asset management tables
      results.generalAssets = await safeExportTable('general_assets', () => tx.select().from(generalAssets));
      results.brokerProviderAssets = await safeExportTable('broker_provider_assets', () => tx.select().from(brokerProviderAssets));
      results.brokerProviders = await safeExportTable('broker_providers', () => tx.select().from(brokerProviders));
      results.brokerProviderAssetAPIKeyConnections = await safeExportTable('broker_provider_asset_api_key_connections', () => tx.select().from(brokerProviderAssetAPIKeyConnections));
      results.assetValues = await safeExportTable('asset_values', () => tx.select().from(assetValues));
      results.assetContributions = await safeExportTable('asset_contributions', () => tx.select().from(assetContributions));
      results.recurringContributions = await safeExportTable('recurring_contributions', () => tx.select().from(recurringContributions));

      // Portfolio tables
      results.fireSettings = await safeExportTable('fire_settings', () => tx.select().from(fireSettings));
      results.milestones = await safeExportTable('milestones', () => tx.select().from(milestones));

      return results;
    });

    // Transform the data into the migration format
    const migrationData: MigrationData = {
      version: "3.0",
      exportedAt: new Date().toISOString(),
      coreUsers: data.coreUsers.map(user => ({
        id: user.id,
        status: user.status,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      userAccounts: data.userAccounts.map(account => ({
        id: account.id,
        coreUserId: account.coreUserId,
        email: account.email,
        phoneNumber: account.phoneNumber,
        passwordHash: account.passwordHash,
        fullName: account.fullName,
        isEmailVerified: account.isEmailVerified,
        isPhoneVerified: account.isPhoneVerified,
        createdAt: account.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: account.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      userProfiles: data.userProfiles.map(profile => ({
        id: profile.id,
        userAccountId: profile.userAccountId,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: profile.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      emailVerifications: data.emailVerifications.map(verification => ({
        id: verification.id,
        userAccountId: verification.userAccountId,
        token: verification.token,
        isCompleted: verification.isCompleted,
        completedAt: verification.completedAt?.toISOString() || null,
        expiresAt: verification.expiresAt.toISOString(),
        createdAt: verification.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: verification.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      phoneVerifications: data.phoneVerifications.map(verification => ({
        id: verification.id,
        userAccountId: verification.userAccountId,
        token: verification.token,
        isCompleted: verification.isCompleted,
        completedAt: verification.completedAt?.toISOString() || null,
        expiresAt: verification.expiresAt.toISOString(),
        createdAt: verification.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: verification.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      passwordResets: data.passwordResets.map(reset => ({
        id: reset.id,
        userAccountId: reset.userAccountId,
        token: reset.token,
        isCompleted: reset.isCompleted,
        completedAt: reset.completedAt?.toISOString() || null,
        expiresAt: reset.expiresAt.toISOString(),
        createdAt: reset.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: reset.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      passwordChangeHistory: data.passwordChangeHistory.map(history => ({
        id: history.id,
        userAccountId: history.userAccountId,
        passwordHash: history.passwordHash,
        changedAt: history.changedAt.toISOString(),
        createdAt: history.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: history.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      refreshTokens: data.refreshTokens.map(token => ({
        id: token.id,
        tenantId: token.tenantId,
        userAccountId: token.userAccountId,
        tokenHash: token.tokenHash,
        familyId: token.familyId,
        parentTokenHash: token.parentTokenHash,
        deviceInfo: token.deviceInfo,
        lastUsedAt: token.lastUsedAt.toISOString(),
        expiresAt: token.expiresAt.toISOString(),
        isRevoked: token.isRevoked,
        createdAt: token.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: token.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      userSubscriptions: data.userSubscriptions.map(subscription => ({
        id: subscription.id,
        userAccountId: subscription.userAccountId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate?.toISOString() || null,
        createdAt: subscription.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: subscription.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      userAccountBrokerProviderAssets: data.userAccountBrokerProviderAssets.map(link => ({
        id: link.id,
        userAccountId: link.userAccountId,
        brokerProviderAssetId: link.brokerProviderAssetId,
        createdAt: link.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: link.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      generalAssets: data.generalAssets.map(asset => ({
        id: asset.id,
        assetType: asset.assetType,
        name: asset.name,
        currentValue: asset.currentValue,
        userAccountId: asset.userAccountId,
        createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: asset.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      brokerProviderAssets: data.brokerProviderAssets.map(asset => ({
        id: asset.id,
        assetType: asset.assetType,
        name: asset.name,
        currentValue: asset.currentValue,
        userAccountId: asset.userAccountId,
        providerId: asset.providerId,
        accountType: asset.accountType,
        createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: asset.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      brokerProviders: data.brokerProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        supportsAPIKey: provider.supportsAPIKey,
        supportedAccountTypes: provider.supportedAccountTypes,
        createdAt: provider.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: provider.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      brokerProviderAssetAPIKeyConnections: data.brokerProviderAssetAPIKeyConnections.map(connection => ({
        id: connection.id,
        brokerProviderAssetId: connection.brokerProviderAssetId,
        apiKey: connection.apiKey,
        createdAt: connection.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: connection.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      assetValues: data.assetValues.map(value => ({
        id: value.id,
        value: value.value,
        recordedAt: value.recordedAt.toISOString(),
        assetId: value.assetId,
        createdAt: value.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: value.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      assetContributions: data.assetContributions.map(contribution => ({
        id: contribution.id,
        value: contribution.value,
        recordedAt: contribution.recordedAt.toISOString(),
        assetId: contribution.assetId,
        createdAt: contribution.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: contribution.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      recurringContributions: data.recurringContributions.map(contribution => ({
        id: contribution.id,
        assetId: contribution.assetId,
        amount: contribution.amount,
        startDate: contribution.startDate.toISOString(),
        interval: contribution.interval,
        lastProcessedDate: contribution.lastProcessedDate?.toISOString() || null,
        isActive: contribution.isActive,
        createdAt: contribution.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: contribution.updatedAt?.toISOString() || new Date().toISOString(),
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
        adjustInflation: setting.adjustInflation,
        statePensionAge: setting.statePensionAge,
        createdAt: setting.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: setting.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      milestones: data.milestones.map(milestone => ({
        id: milestone.id,
        userAccountId: milestone.userAccountId,
        name: milestone.name,
        targetValue: milestone.targetValue,
        accountType: milestone.accountType,
        isCompleted: milestone.isCompleted,
        createdAt: milestone.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: milestone.updatedAt?.toISOString() || new Date().toISOString(),
      })),
    };

    // Write the data to a file
    const exportPath = join(process.cwd(), "tools", "migrate", "data", `migration-export-v3-${new Date().toISOString().split('T')[0]}.json`);
    writeFileSync(exportPath, JSON.stringify(migrationData, null, 2));

    console.log("\nExport completed successfully!");
    console.log("\nExport Summary:");
    console.log(`- Core Users: ${migrationData.coreUsers.length}`);
    console.log(`- User Accounts: ${migrationData.userAccounts.length}`);
    console.log(`- User Profiles: ${migrationData.userProfiles.length}`);
    console.log(`- Email Verifications: ${migrationData.emailVerifications.length}`);
    console.log(`- Phone Verifications: ${migrationData.phoneVerifications.length}`);
    console.log(`- Password Resets: ${migrationData.passwordResets.length}`);
    console.log(`- Password Change History: ${migrationData.passwordChangeHistory.length}`);
    console.log(`- Refresh Tokens: ${migrationData.refreshTokens.length}`);
    console.log(`- User Subscriptions: ${migrationData.userSubscriptions.length}`);
    console.log(`- User Account Broker Provider Assets: ${migrationData.userAccountBrokerProviderAssets.length}`);
    console.log(`- General Assets: ${migrationData.generalAssets.length}`);
    console.log(`- Broker Provider Assets: ${migrationData.brokerProviderAssets.length}`);
    console.log(`- Broker Providers: ${migrationData.brokerProviders.length}`);
    console.log(`- Broker Provider Asset API Key Connections: ${migrationData.brokerProviderAssetAPIKeyConnections.length}`);
    console.log(`- Asset Values: ${migrationData.assetValues.length}`);
    console.log(`- Asset Contributions: ${migrationData.assetContributions.length}`);
    console.log(`- Recurring Contributions: ${migrationData.recurringContributions.length}`);
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
