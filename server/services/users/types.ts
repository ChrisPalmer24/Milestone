import { User, InsertUser } from "@shared/schema";

export interface IUserService {
  get(id: User["id"]): Promise<User | undefined>;
  getByUsername(username: string): Promise<User | undefined>;
  create(data: InsertUser): Promise<User>;
  update(id: User["id"], data: Partial<InsertUser>): Promise<User>;
  delete(id: User["id"]): Promise<boolean>;
} 
