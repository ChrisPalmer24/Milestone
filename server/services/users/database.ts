import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { User, InsertUser } from "@shared/schema";
import { IUserService } from "./types";
import { type Database } from "../../db/index";

export class DatabaseUserService implements IUserService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(id: User["id"]): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getByUsername(username: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async create(data: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async update(id: User["id"], data: Partial<InsertUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async delete(id: User["id"]): Promise<boolean> {
    const [deleted] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return !!deleted;
  }
} 
