import { Milestone, InsertMilestone } from "@shared/schema";

export interface IMilestoneService {
  get(id: number): Promise<Milestone | undefined>;
  getByUserId(userId: number): Promise<Milestone[]>;
  create(data: InsertMilestone): Promise<Milestone>;
  update(id: number, data: Partial<InsertMilestone>): Promise<Milestone>;
  delete(id: number): Promise<boolean>;
  updateCompletion(id: number, isCompleted: boolean): Promise<Milestone>;
} 
