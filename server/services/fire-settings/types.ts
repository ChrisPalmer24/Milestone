import { FireSettings, InsertFireSettings } from "@shared/schema";

export interface IFireSettingsService {
  get(id: number): Promise<FireSettings | undefined>;
  getByUserId(userId: number): Promise<FireSettings | undefined>;
  create(data: InsertFireSettings): Promise<FireSettings>;
  update(id: number, data: Partial<InsertFireSettings>): Promise<FireSettings>;
  delete(id: number): Promise<boolean>;
  updateByUserId(userId: number, data: Partial<InsertFireSettings>): Promise<FireSettings>;
} 
