import { AccountHistory } from "@shared/schema";

export const calculateTotalPercentageChange = (history: AccountHistory[]): number => {
  if (history.length < 2) return 0;
  
  // Create a sorted copy of the history array by date
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  
  const firstValue = Number(sortedHistory[0].value);
  const lastValue = Number(sortedHistory[sortedHistory.length - 1].value);
  
  // Calculate percentage change: ((new - old) / old) * 100
  // This will give positive percentage for increases and negative for decreases
  return ((lastValue - firstValue) / firstValue) * 100;
}; 
