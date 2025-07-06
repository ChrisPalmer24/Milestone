import { SecuritySearchResult, SecuritySelect } from "@shared/schema/securities";

// Type helper to replace null with undefined in all properties
type NullToUndefined<T> = {
  [K in keyof T]: Exclude<T[K], null> | Extract<T[K], undefined>;
};

function valuesNullToUndefined<T extends object>(values: T): NullToUndefined<T> {
  const result: any = {};
  for (const key in values) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      const value = values[key];
      result[key] = value === null ? undefined : value;
    }
  }
  return result;
}

// Helper function to combine and deduplicate security results
export function combineSecurityResults(cached: SecuritySelect[], external: SecuritySearchResult[]): SecuritySearchResult[] {
  const symbolMap = new Map<string, SecuritySearchResult>();
  
  // Add external results first (they have priority for freshness)
  external.forEach(security => {
    if (security.symbol) { // EODHD format
      symbolMap.set(security.symbol, security);
    }
  });
  
  // Add cached results only if not already present from external
  cached.forEach(security => {
    if (!symbolMap.has(security.symbol)) {
      if(security.symbol) {
        symbolMap.set(security.symbol, {
          ...valuesNullToUndefined(security),
          fromCache: true
        });
      }
    }
  });
  
  return Array.from(symbolMap.values());
}
