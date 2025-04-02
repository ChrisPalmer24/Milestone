import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { cuid, idColumn, timestampColumns } from "./utils";

// Core User table
export const coreUsers = pgTable("core_users", {
  id: idColumn(),
  status: text("status", { enum: ["active", "inactive", "suspended"] }).notNull().default("active"),
  ...timestampColumns(),
});

export const coreUsersRelations = relations(coreUsers, ({ one, many }) => ({
  userAccounts: many(userAccounts),
}));

// User Account table
export const userAccounts = pgTable("user_accounts", {
  id: idColumn(),
  coreUserId: cuid("core_user_id").notNull().references(() => coreUsers.id),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  ...timestampColumns(),
});

// Email Verification table
export const emailVerifications = pgTable("email_verifications", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  token: text("token").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestampColumns(),
});

// Phone Verification table
export const phoneVerifications = pgTable("phone_verifications", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  token: text("token").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestampColumns(),
});

export const userAccountsRelations = relations(userAccounts, ({ one, many }) => ({
  coreUser: one(coreUsers, {
    fields: [userAccounts.coreUserId],
    references: [coreUsers.id],
  }),
  userProfile: one(userProfiles, {
    fields: [userAccounts.id],
    references: [userProfiles.userAccountId],
  }),
  passwordResets: many(passwordResets),
  passwordChangeHistory: many(passwordChangeHistory),
  refreshTokens: many(refreshTokens),
  emailVerifications: many(emailVerifications),
  phoneVerifications: many(phoneVerifications),
  userSubscriptions: many(userSubscriptions),
}));

// User Profile table
export const userProfiles = pgTable("user_profiles", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  avatarUrl: text("avatar_url"),
  // Add profile fields as needed
  ...timestampColumns(),
});

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [userProfiles.userAccountId],
    references: [userAccounts.id],
  }),
}));

// Password Reset table
export const passwordResets = pgTable("password_resets", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  token: text("token").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestampColumns(),
});

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [passwordResets.userAccountId],
    references: [userAccounts.id],
  }),
}));

// Password Change History table
export const passwordChangeHistory = pgTable("password_change_history", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  passwordHash: text("password_hash").notNull(),
  changedAt: timestamp("changed_at").notNull(),
  ...timestampColumns(),
});

export const passwordChangeHistoryRelations = relations(passwordChangeHistory, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [passwordChangeHistory.userAccountId],
    references: [userAccounts.id],
  }),
}));

// User Subscription table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  plan: text("plan").notNull(),
  status: text("status", { enum: ["active", "cancelled", "expired"] }).notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  ...timestampColumns(),
});

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [userSubscriptions.userAccountId],
    references: [userAccounts.id],
  }),
}));

// Refresh Token table
export const refreshTokens = pgTable("refresh_tokens", {
  id: idColumn(),
  userAccountId: cuid("user_account_id").notNull().references(() => userAccounts.id),
  tokenHash: text("token_hash").notNull(),
  familyId: text("family_id").notNull(),
  parentTokenHash: text("parent_token_hash"),
  deviceInfo: text("device_info"),
  lastUsedAt: timestamp("last_used_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  ...timestampColumns(),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  userAccount: one(userAccounts, {
    fields: [refreshTokens.userAccountId],
    references: [userAccounts.id],
  }),
}));

// Insert schemas
export const insertCoreUserSchema = createInsertSchema(coreUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAccountSchema = createInsertSchema(userAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEmailVerified: true,
  isPhoneVerified: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isCompleted: true,
  completedAt: true,
});

export const insertPasswordChangeHistorySchema = createInsertSchema(passwordChangeHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRevoked: true,
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isCompleted: true,
  completedAt: true,
});

export const insertPhoneVerificationSchema = createInsertSchema(phoneVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isCompleted: true,
  completedAt: true,
});

// Auth schemas
export const loginSchema = createInsertSchema(userAccounts).pick({
  email: true,
  passwordHash: true,
}).extend({
  password: z.string(),
}).omit({
  passwordHash: true,
});

export const registerSchema = createInsertSchema(userAccounts).pick({
  email: true,
  fullName: true,
  phoneNumber: true,
}).extend({
  password: z.string().min(8),
}).transform(data => ({
  ...data,
  phoneNumber: data.phoneNumber === "" ? null : data.phoneNumber
}));

export const revokeFamilySchema = z.object({
  familyId: z.string(),
});

// Types
export type CoreUser = typeof coreUsers.$inferSelect;
export type UserAccount = typeof userAccounts.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type PasswordChangeHistory = typeof passwordChangeHistory.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;

export type InsertCoreUser = z.infer<typeof insertCoreUserSchema>;
export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type InsertPasswordChangeHistory = z.infer<typeof insertPasswordChangeHistorySchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;
export type InsertPhoneVerification = z.infer<typeof insertPhoneVerificationSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RevokeFamilyInput = z.infer<typeof revokeFamilySchema>; 

export type SessionUser = {
  id: string;
  account: UserAccount;
  profile: UserProfile;
}
