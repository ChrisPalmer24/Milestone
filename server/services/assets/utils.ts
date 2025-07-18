import { AssetsChange, AssetValue } from "@shared/schema";

/**
 * It is expected the the asset history items here have already been filtered
 * by the date range at the db level.
 */


// type AssetsChangeValues = {
//   startDate: Date;
//   endDate: Date;
//   startValue: number;
//   history: AssetValue[]
// }

// export const calculateAssetsChange = ({startDate, endDate, startValue, history}: AssetsChangeValues): AssetsChange => {


export const calculateAssetsChange = (history: AssetValue[]): AssetsChange => {
  
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
