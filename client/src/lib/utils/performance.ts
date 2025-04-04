import { AccountHistory } from "@shared/schema";

type AccountChnage = {
  currency: number;
  percentage: number;
};

export const calculateAccountChange = (history: AccountHistory[]): AccountChnage => {
  if (history.length < 2) return { currency: 0, percentage: 0 };
  
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
    currency,
    percentage,
  };
};
