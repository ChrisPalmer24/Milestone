import React, { createContext, useContext, useState, ReactNode } from "react";
import { DateRangeOption } from "@/components/ui/DateRangeControl";

interface DateRangeContextType {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

interface DateRangeProviderProps {
  children: ReactNode;
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>("6months");

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}