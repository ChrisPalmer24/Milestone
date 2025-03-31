import { Milestone, InsertMilestone, UserAccount } from "@shared/schema";

export interface IMilestoneService {
  get(id: Milestone["id"]): Promise<Milestone | undefined>;
  getByUserAccountId(userAccountId: UserAccount["id"]): Promise<Milestone[]>;
  create(data: InsertMilestone): Promise<Milestone>;
  update(id: Milestone["id"], data: Partial<InsertMilestone>): Promise<Milestone>;
  delete(id: Milestone["id"]): Promise<boolean>;
  updateCompletion(id: Milestone["id"], isCompleted: boolean): Promise<Milestone>;
} 
