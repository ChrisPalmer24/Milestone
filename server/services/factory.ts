import { IUserService } from "./users/types";
import { DatabaseUserService } from "./users/database";
import { IMilestoneService } from "./milestones/types";
import { DatabaseMilestoneService } from "./milestones/database";
import { IFireSettingsService } from "./fire-settings/types";
import { DatabaseFireSettingsService } from "./fire-settings/database";
import { db } from "../db";
import { IAssetService } from "./assets/types";
import { DatabaseAssetService } from "./assets/database";

export class ServiceFactory {
  private static instance: ServiceFactory;
  private userService: IUserService;
  private milestoneService: IMilestoneService;
  private fireSettingsService: IFireSettingsService;
  private assetService: IAssetService;

  private constructor() {
    // Initialize services with database implementations
    this.userService = new DatabaseUserService(db);
    this.milestoneService = new DatabaseMilestoneService(db);
    this.fireSettingsService = new DatabaseFireSettingsService(db);
    this.assetService = new DatabaseAssetService(db);
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

  getMilestoneService(): IMilestoneService {
    return this.milestoneService;
  }

  getFireSettingsService(): IFireSettingsService {
    return this.fireSettingsService;
  }

  getAssetService(): IAssetService {
    return this.assetService;
  }
} 
