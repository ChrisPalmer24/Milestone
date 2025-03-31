import { eq } from "drizzle-orm";
import { milestones, CoreUser, UserAccount } from "@shared/schema";
import { Milestone, InsertMilestone } from "@shared/schema";
import { IMilestoneService } from "./types";
import { type Database } from "../../db/index";

export class DatabaseMilestoneService implements IMilestoneService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async get(id: Milestone["id"]): Promise<Milestone | undefined> {
    return this.db.query.milestones.findFirst({
      where: eq(milestones.id, id),
    });
  }

  async getByUserAccountId(userAccountId: UserAccount["id"]): Promise<Milestone[]> {
    return this.db.query.milestones.findMany({
      where: eq(milestones.userAccountId, userAccountId),
      orderBy: (milestones, { desc }) => [desc(milestones.createdAt)],
    });
  }

  async create(data: InsertMilestone): Promise<Milestone> {
    const [milestone] = await this.db.insert(milestones).values(data).returning();
    return milestone;
  }

  async update(id: Milestone["id"], data: Partial<InsertMilestone>): Promise<Milestone> {
    const [milestone] = await this.db
      .update(milestones)
      .set(data)
      .where(eq(milestones.id, id))
      .returning();

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    return milestone;
  }

  async delete(id: Milestone["id"]): Promise<boolean> {
    const [deleted] = await this.db
      .delete(milestones)
      .where(eq(milestones.id, id))
      .returning();

    return !!deleted;
  }

  async updateCompletion(id: Milestone["id"], isCompleted: boolean): Promise<Milestone> {
    const [milestone] = await this.db
      .update(milestones)
      .set({ isCompleted })
      .where(eq(milestones.id, id))
      .returning();

    if (!milestone) {
      throw new Error("Milestone not found");
    }

    return milestone;
  }
} 
