import { User, InsertUser } from "@shared/schema";

export interface IUserService {
  get(id: number): Promise<User | undefined>;
  getByUsername(username: string): Promise<User | undefined>;
  create(data: InsertUser): Promise<User>;
  update(id: number, data: Partial<InsertUser>): Promise<User>;
  delete(id: number): Promise<boolean>;
} 
