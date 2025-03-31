import { FireSettings, InsertFireSettings, User } from "@shared/schema";

export interface IFireSettingsService {
  get(id: FireSettings["id"]): Promise<FireSettings | undefined>;
  getByUserId(userId: User["id"]): Promise<FireSettings | undefined>;
  create(data: InsertFireSettings): Promise<FireSettings>;
  update(id: FireSettings["id"], data: Partial<InsertFireSettings>): Promise<FireSettings>;
  delete(id: FireSettings["id"]): Promise<boolean>;
  updateByUserId(userId: User["id"], data: Partial<InsertFireSettings>): Promise<FireSettings>;
} 
