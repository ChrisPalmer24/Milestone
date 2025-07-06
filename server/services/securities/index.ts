import { findSecurities as findSecuritiesEODHD } from "./eodhd"
import { SecuritySearchResult } from "@shared/schema"

/**
 * Find an assets by its name, stock ticker, or ISIN
 * @param assetIdentifier - The name, stock ticker, or ISIN of the asset to find
 * @returns The asset if found, otherwise null
 */
export const findSecurities = async (securityIdentifiers: string[]): Promise<SecuritySearchResult[]> => {
  return findSecuritiesEODHD(securityIdentifiers)
  .then(data => data.map(security => ({
        symbol: security.Code,
        name: security.Name,
        exchange: security.Exchange,
        country: security.Country,
        currency: security.Currency,
        type: security.Type,
        isin: security.ISIN,
        cusip: undefined,
        figi: undefined,
    } as SecuritySearchResult))
  )
}
