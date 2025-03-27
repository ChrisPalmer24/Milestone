import { eq } from "drizzle-orm";
import { fireSettings } from "@shared/schema";
import { FireSettings, InsertFireSettings } from "@shared/schema";
import { IFireSettingsService } from "./types";
import { type Database } from "../../db/index";

export class DatabaseFireSettingsService implements IFireSettingsService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(id: number): Promise<FireSettings | undefined> {
    return this.db.query.fireSettings.findFirst({
      where: eq(fireSettings.id, id),
    });
  }

  async getByUserId(userId: number): Promise<FireSettings | undefined> {
    return this.db.query.fireSettings.findFirst({
      where: eq(fireSettings.userId, userId),
    });
  }

  async create(data: InsertFireSettings): Promise<FireSettings> {
    const [settings] = await this.db.insert(fireSettings).values(data).returning();
    return settings;
  }

  async update(id: number, data: Partial<InsertFireSettings>): Promise<FireSettings> {
    const [settings] = await this.db
      .update(fireSettings)
      .set(data)
      .where(eq(fireSettings.id, id))
      .returning();

    if (!settings) {
      throw new Error("FIRE settings not found");
    }

    return settings;
  }

  async delete(id: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(fireSettings)
      .where(eq(fireSettings.id, id))
      .returning();

    return !!deleted;
  }

  async updateByUserId(userId: number, data: Partial<InsertFireSettings>): Promise<FireSettings> {
    const [settings] = await this.db
      .update(fireSettings)
      .set(data)
      .where(eq(fireSettings.userId, userId))
      .returning();

    if (!settings) {
      throw new Error("FIRE settings not found");
    }

    return settings;
  }
} 
