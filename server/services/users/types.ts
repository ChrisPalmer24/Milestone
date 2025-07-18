import { CoreUser, UserAccount, UserProfile, InsertCoreUser, UserAccountInsert, UserProfileInsert, RegisterInput, SessionUser } from "@shared/schema/user-account";
export interface IUserService {
  // Core User operations
  getCoreUser(id: CoreUser["id"]): Promise<CoreUser | undefined>;
  createCoreUser(data: InsertCoreUser): Promise<CoreUser>;
  updateCoreUser(id: CoreUser["id"], data: Partial<InsertCoreUser>): Promise<CoreUser>;
  deleteCoreUser(id: CoreUser["id"]): Promise<boolean>;

  // User Account operations
  getUserAccount(id: UserAccount["id"]): Promise<UserAccount | undefined>;
  getUserAccountByEmail(email: string): Promise<UserAccount | undefined>;
  createUserAccount(data: UserAccountInsert): Promise<UserAccount>;
  updateUserAccount(id: UserAccount["id"], data: Partial<UserAccountInsert>): Promise<UserAccount>;
  deleteUserAccount(id: UserAccount["id"]): Promise<boolean>;

  // User Profile operations
  getUserProfile(id: UserProfile["id"]): Promise<UserProfile | undefined>;
  createUserProfile(data: UserProfileInsert): Promise<UserProfile>;
  updateUserProfile(id: UserProfile["id"], data: Partial<UserProfileInsert>): Promise<UserProfile>;
  deleteUserProfile(id: UserProfile["id"]): Promise<boolean>;

  createUserComplete(user: RegisterInput): Promise<SessionUser>;
  getCompleteUserForAccount(userAccountId: string): Promise<SessionUser | null>;


  // Authentication operations
  verifyEmail(token: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userAccountId: UserAccount["id"], currentPassword: string, newPassword: string): Promise<boolean>;
} 
