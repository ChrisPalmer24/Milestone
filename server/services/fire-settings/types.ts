import { FireSettings, InsertFireSettings, UserAccount } from "@shared/schema";

export interface IFireSettingsService {
  get(id: FireSettings["id"]): Promise<FireSettings | undefined>;
  getByUserAccountId(userAccountId: UserAccount["id"]): Promise<FireSettings | undefined>;
  create(data: InsertFireSettings): Promise<FireSettings>;
  update(id: FireSettings["id"], data: Partial<InsertFireSettings>): Promise<FireSettings>;
  delete(id: FireSettings["id"]): Promise<boolean>;
  updateByUserAccountId(userAccountId: UserAccount["id"], data: Partial<InsertFireSettings>): Promise<FireSettings>;
} 
