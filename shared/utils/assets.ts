import { Asset, AssetsChange, AssetValue, AssetWithHistory, DataRangeQuery, PortfolioHistoryTimePoint, PossibleDummyAssetValue, WithAccountChange } from "@shared/schema";


export const calculateAssetsChange = (history: PossibleDummyAssetValue[]): AssetsChange => {
  
  if (history.length < 2) return { startDate: new Date(), endDate: new Date(), startValue: 0, value: 0, currencyChange: 0, percentageChange: 0 };
  
  // Create a sorted copy of the history array by date
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  
  const firstValue = Number(sortedHistory[0].value);
  const lastValue = Number(sortedHistory[sortedHistory.length - 1].value);

  const currency = lastValue - firstValue;

  // Check if first value is zero to avoid division by zero (infinity)
  const percentage = firstValue === 0
    // If the first value was zero and now there's value, return a fixed percentage
    // instead of infinity
    ? lastValue > 0
      ? 100
      : 0
    : ((lastValue - firstValue) / firstValue) * 100;


  return {
    startDate: sortedHistory[0].recordedAt,
    endDate: sortedHistory[sortedHistory.length - 1].recordedAt,
    startValue: firstValue,
    value: lastValue,
    currencyChange: currency,
    percentageChange: percentage,
  };
};

export const resolveDate = (date: string | Date | null | undefined): Date | null => {
  return date ? typeof date === "string" ? new Date(date) : date : null;
}


const defineAssetValuesForRange = (assetValues: AssetValue[], query?: DataRangeQuery): PossibleDummyAssetValue[] => {

  const assetValuesSorted = assetValues.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const firstValue = assetValuesSorted[0];
  
  const startDate = resolveDate(query?.start) ?? firstValue.recordedAt;

  if(!startDate) {
    return [];
  }

  const endDate = resolveDate(query?.end) ?? new Date();

  //First we see if the is a value that exists for the startDate
  //We filter and take the first from the sorted array because there might be multiple values for the same date with different times
  const valueForStartDateIndex = assetValuesSorted.findIndex(assetValue => 
    assetValue.recordedAt.getFullYear() === startDate.getFullYear() &&
    assetValue.recordedAt.getMonth() === startDate.getMonth() &&
    assetValue.recordedAt.getDate() === startDate.getDate()
  );

  const valueBeforeStartDate = assetValuesSorted.filter(assetValue => assetValue.recordedAt < startDate).at(-1);

  const valueForEndDateIndex = assetValuesSorted.findLastIndex(assetValue => 
    assetValue.recordedAt.getFullYear() === endDate.getFullYear() &&
    assetValue.recordedAt.getMonth() === endDate.getMonth() &&
    assetValue.recordedAt.getDate() === endDate.getDate()
  );

  const valueBeforeEndDate = assetValuesSorted.filter(assetValue => assetValue.recordedAt < endDate).at(-1);

  let valuesForRange: PossibleDummyAssetValue[] =
    valueForStartDateIndex > -1
    ? [...assetValuesSorted.slice(valueForStartDateIndex)]
    : valueBeforeStartDate
      ?[{
      ...valueBeforeStartDate,
      id: null,
      recordedAt: startDate,
    }, ...assetValuesSorted.slice(0, valueForStartDateIndex + 1)]
    : [{
      id: null,
      assetId: firstValue.assetId,
      value: 0,
      createdAt: startDate,
      updatedAt: startDate,
      recordedAt: startDate,
    }, ...assetValuesSorted.slice(0, valueForStartDateIndex + 1)]

  valuesForRange = valueForEndDateIndex > -1
    ? [...valuesForRange.slice(0, valueForEndDateIndex + 1)]
    : valueBeforeEndDate
      ? [...valuesForRange, {
        ...valueBeforeEndDate,
        id: null,
        recordedAt: endDate,
      }, ...assetValuesSorted.slice(valueForEndDateIndex + 1)]
      : [...valuesForRange, {
        id: null,
        assetId: firstValue.assetId,
        value: 0,
        createdAt: endDate,
        updatedAt: endDate,
        recordedAt: endDate,
      }, ...assetValuesSorted.slice(valueForEndDateIndex + 1)]

  return valuesForRange;
}


export const resolveAssetWithChangeForDateRange = <T extends AssetWithHistory>(asset: T, query?: DataRangeQuery): WithAccountChange<T> => {
  const startDate = resolveDate(query?.start);
  if(!startDate) {
    throw new Error("Start date is required");
  }
  const endDate = resolveDate(query?.end) ?? new Date();
  const assetValuesForRange = defineAssetValuesForRange(asset.history, {
    start: startDate,
    end: endDate,
  });
  return { ...asset, accountChange: calculateAssetsChange(assetValuesForRange) };
}


export const resolveAssetsWithChange = async <T extends AssetWithHistory>(assets: T[], query?: DataRangeQuery): Promise<WithAccountChange<T>[]> => {

  const startDate = resolveDate(query?.start)
  if(!startDate) {
    throw new Error("Start date is required");
  }
  const endDate = resolveDate(query?.end) ?? new Date();

  return assets.map((asset) => resolveAssetWithChangeForDateRange(asset, {
    start: startDate,
    end: endDate,
  }));
}

export const getPortfolioValueHistoryForAssets = async <T extends AssetWithHistory>(assets: T[], query?: DataRangeQuery): Promise<PortfolioHistoryTimePoint[]> => {
  
  // Create a map to track the latest known value for each account
  const accountLatestValues = new Map<string, number>();
    
  // Create a map to store portfolio values and changes at each timestamp
  const portfolioValues = new Map<string, {
    value: number;
    changes: {
      assetId: Asset["id"];
      previousValue: number;
      newValue: number;
      change: number;
    }[];
  }>();

  const assetValuesForRange = defineAssetValuesForRange(assets.flatMap(asset => asset.history), query);

  [...assetValuesForRange.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())].forEach(entry => {
    const previousValue = accountLatestValues.get(entry.assetId) || 0;
    const newValue = Number(entry.value);
    const change = newValue - previousValue;
    
    // Update the latest known value for this account
    accountLatestValues.set(entry.assetId, newValue);
    
    // Calculate total portfolio value at this point in time
    const totalValue = Array.from(accountLatestValues.values()).reduce((sum, value) => sum + value, 0);
    
    // Format the date to YYYY-MM-DD for consistent daily grouping
    const dateKey = entry.recordedAt.toISOString().split('T')[0];
    
    // If we already have an entry for this date, update it with the new changes
    if (portfolioValues.has(dateKey)) {
      const existingEntry = portfolioValues.get(dateKey)!;
      existingEntry.value = totalValue;
      existingEntry.changes.push({
        assetId: entry.assetId,
        previousValue,
        newValue,
        change
      });
    } else {
      // Otherwise create a new entry for this date
      portfolioValues.set(dateKey, {
        value: totalValue,
        changes: [{
          assetId: entry.assetId,
          previousValue,
          newValue,
          change
        }]
      });
    }
  });

  return Array.from(portfolioValues.entries())
    .map(([timestamp, data]) => ({
      date: new Date(timestamp),
      value: data.value,
      changes: data.changes
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const getPortfolioOverviewForAssets = async <T extends AssetWithHistory>(assets: T[], query?: DataRangeQuery): Promise<AssetsChange> => {

  const assetsWithValueChanges = await Promise.all(assets.map(async (asset) => {
    return resolveAssetWithChangeForDateRange(asset, /*Need to add query */);
  }));

  const assetsValueChanges = assetsWithValueChanges.map(asset => asset.accountChange)
    .reduce((acc: AssetsChange, asset) => {

    const startDate = asset.startDate < acc.startDate ? asset.startDate : acc.startDate;
    const endDate = asset.endDate > acc.endDate ? asset.endDate : acc.endDate;
    const startValue = asset.startDate < acc.startDate
      ? asset.startValue
      : asset.startDate > acc.startDate
      ? acc.startValue
      : asset.startDate === acc.startDate
      ? acc.startValue + asset.startValue
      : acc.startValue;

    const value = acc.value + asset.value;
    const currencyChange = value - startValue;
    const percentageChange = (currencyChange / startValue) * 100;
    
    return {
      startDate,
      endDate,
      startValue,
      value,
      currencyChange,
      percentageChange
    }
  }, {
    startDate: resolveDate(query?.start) ?? new Date(),
    endDate: resolveDate(query?.end) ?? new Date(),
    startValue: 0,
    value: 0,
    currencyChange: 0,
    percentageChange: 0
  });

  return assetsValueChanges;
}
