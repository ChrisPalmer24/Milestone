import { SecuritySearchResult } from "@shared/schema";

export type SecurityHistory = {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type IntradayInterval = '15min' | '30min' | '60min'

export interface IntradayOptions {
  interval?: IntradayInterval;
}

export type SecurityInfoService = {
  name: string;
  identifier: string;
  canFindSecurities: boolean;
  findSecurities: (securityIdentifiers: string[]) => Promise<SecuritySearchResult[]>;

  canGetSecurityHistoryForDateRange: boolean;
  /** Gets the price history for a given symbol and date range  */
  getSecurityHistoryForDateRange: (symbol: string, startDate: Date, endDate: Date) => Promise<SecurityHistory[]>;

  
  canGetSecurityHistoryForDate: boolean;
  /** Gets the price history for a given symbol and date */
  getSecurityHistoryForDate: (symbol: string, date: Date) => Promise<SecurityHistory>;

  canGetIntradaySecurityHistoryForDate: boolean;
  /** Gets the intraday price history for a given symbol and date */
  getIntradaySecurityHistoryForDate: (symbol: string, date: Date, options?: IntradayOptions) => Promise<SecurityHistory[]>;

  // canGetSecurityInfoBySymbol: boolean;
  // getSecurityInfoBySymbol: (symbol: string) => Promise<SecurityInfo>;

  
};