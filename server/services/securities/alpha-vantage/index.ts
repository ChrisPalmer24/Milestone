import { SecurityInfoService, IntradayOptions } from "../types"
import { findSecurities } from "./search"
import { getSecurityHistoryForDateRange, getSecurityHistoryForDate, getIntradaySecurityHistoryForDate } from "./history"

export const factory = (): SecurityInfoService => ({
  identifier: "alpha-vantage",
  name: "Alpha Vantage",
  canFindSecurities: true,
  findSecurities: async (securityIdentifiers: string[]) => {
    return findSecurities(securityIdentifiers)
  },

  canGetSecurityHistoryForDateRange: true,
  getSecurityHistoryForDateRange: async (symbol: string, startDate: Date, endDate: Date) => {
    return getSecurityHistoryForDateRange(symbol, startDate, endDate);
  },

  canGetSecurityHistoryForDate: true,
  getSecurityHistoryForDate: async (symbol: string, date: Date) => {
    return getSecurityHistoryForDate(symbol, date);
  },

  canGetIntradaySecurityHistoryForDate: true,
  getIntradaySecurityHistoryForDate: async (symbol: string, date: Date, options?: IntradayOptions) => {
    return getIntradaySecurityHistoryForDate(symbol, date, options);
  },
})