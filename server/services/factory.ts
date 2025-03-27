import { IUserService } from "./users/types";
import { DatabaseUserService } from "./users/database";
import { IAccountService } from "./accounts/types";
import { DatabaseAccountService } from "./accounts/database";
import { IAccountHistoryService } from "./account-history/types";
import { DatabaseAccountHistoryService } from "./account-history/database";
import { IMilestoneService } from "./milestones/types";
import { DatabaseMilestoneService } from "./milestones/database";
import { IFireSettingsService } from "./fire-settings/types";
import { DatabaseFireSettingsService } from "./fire-settings/database";
import { db } from "../db";

export class ServiceFactory {
  private static instance: ServiceFactory;
  private userService: IUserService;
  private accountService: IAccountService;
  private accountHistoryService: IAccountHistoryService;
  private milestoneService: IMilestoneService;
  private fireSettingsService: IFireSettingsService;

  private constructor() {
    // Initialize services with database implementations
    this.userService = new DatabaseUserService(db);
    this.accountService = new DatabaseAccountService(db);
    this.accountHistoryService = new DatabaseAccountHistoryService(db);
    this.milestoneService = new DatabaseMilestoneService(db);
    this.fireSettingsService = new DatabaseFireSettingsService(db);
  }

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getUserService(): IUserService {
    return this.userService;
  }

  getAccountService(): IAccountService {
    return this.accountService;
  }

  getAccountHistoryService(): IAccountHistoryService {
    return this.accountHistoryService;
  }

  getMilestoneService(): IMilestoneService {
    return this.milestoneService;
  }

  getFireSettingsService(): IFireSettingsService {
    return this.fireSettingsService;
  }
} 
