import { findSecurities as findSecuritiesOriginal } from "./search";
import { getSecurityHistoryForDateRange as getSecurityHistoryForDateRangeOriginal, getSecurityHistoryForDate as getSecurityHistoryForDateOriginal, getIntradaySecurityHistoryForDate as getIntradaySecurityHistoryForDateOriginal } from "./history";
import { SecurityInfoService, IntradayOptions } from "../types";
import { SecuritySearchResult } from "@shared/schema"


export type EODHDSecurity = {
  Code: string;
  Country: string;
  Currency: string;
  Exchange: string;
  ISIN: string;
  Name: string;
  Type: string;
  previousClose: number;
  previousCloseDate: string;
}

const normalizeSecurityInfo = (security: EODHDSecurity): SecuritySearchResult => ({
  symbol: security.Code,
  name: security.Name,
  exchange: security.Exchange,
  country: security.Country,
  currency: security.Currency,
  type: security.Type,
  isin: security.ISIN,
  cusip: undefined,
  figi: undefined,
  fromCache: false,
});   

export const factory = (): SecurityInfoService => ({
  identifier: "eodhd",
  name: "EODHD",
  canFindSecurities: true,
  findSecurities: async (securityIdentifiers: string[]) => {
    return findSecuritiesOriginal(securityIdentifiers)
      .then(securities => securities.map(normalizeSecurityInfo));
  },

  canGetSecurityHistoryForDateRange: true,
  getSecurityHistoryForDateRange: async (symbol: string, startDate: Date, endDate: Date) => {
    return getSecurityHistoryForDateRangeOriginal(symbol, startDate, endDate);
  },

  canGetSecurityHistoryForDate: true,
  getSecurityHistoryForDate: async (symbol: string, date: Date) => {
    return getSecurityHistoryForDateOriginal(symbol, date);
  },

  canGetIntradaySecurityHistoryForDate: true,
  getIntradaySecurityHistoryForDate: async (symbol: string, date: Date, options?: IntradayOptions) => {
    return getIntradaySecurityHistoryForDateOriginal(symbol, date, options);
  },

  // canGetSecurityInfoBySymbol: true,
  // getSecurityInfoBySymbol: async (symbol: string) => {
  //   return getSecurityInfoBySymbol(symbol);
  // },
})