import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { PortfolioHistoryTimePoint } from "shared/schema";
import { usePortfolio } from "@/context/PortfolioContext";
import { useDateRange } from "@/context/DateRangeContext";
import {
  DateRangeOption,
  getDateRange,
} from "@/components/ui/DateRangeControl";
import { Check } from "lucide-react";
import { getDateUrlParams } from "@/lib/date";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";

type ChartData = Omit<PortfolioHistoryTimePoint, "date"> & {
  date: string;
  milestone?: number;
  achievedMilestone?: {
    name: string;
    targetValue: number;
  };
};

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(var(--chart-1))",
  },
  milestones: {
    label: "Milestones",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Helper to format currency values
const formatCurrency = (value: number) => {
  return `£${value.toLocaleString()}`;
};

// Helper to combine data points for the same date
const combineDataPoints = (data: ChartData[]): ChartData[] => {
  const combinedData = new Map<string, ChartData>();

  data.forEach((item) => {
    const date = item.date;
    if (combinedData.has(date)) {
      // If we already have data for this date, update the value
      const existing = combinedData.get(date)!;
      existing.value = item.value;
      if (item.milestone) {
        existing.milestone = item.milestone;
      }
    } else {
      // If this is the first data point for this date, add it
      combinedData.set(date, { ...item });
    }
  });

  // Convert map back to array and sort by date using proper date parsing
  return Array.from(combinedData.values()).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

type PortfolioChartProps = {
  showMilestones?: boolean;
  nextMilestone?: number;
  className?: string;
};

export default function PortfolioChart({
  showMilestones = true,
  nextMilestone,
  className,
}: PortfolioChartProps) {
  const { dateRange, setDateRange } = useDateRange();
  const [chartVisible, setChartVisible] = useState(true);
  const [showMilestonesLocal, setShowMilestonesLocal] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<ChartData | null>(null);
  const { brokerAssets, milestones } = usePortfolio();

  // Update local state when prop changes
  useEffect(() => {
    setShowMilestonesLocal(showMilestones);
  }, [showMilestones]);

  // Update milestones visibility when chart visibility changes
  useEffect(() => {
    if (!chartVisible) {
      setShowMilestonesLocal(false);
    }
  }, [chartVisible]);

  // Calculate the maximum Y-axis value
  const getMaxYValue = () => {
    const maxPortfolioValue = Math.max(...chartData.map((d) => d.value));
    if (!showMilestonesLocal || !milestones) return maxPortfolioValue;

    const maxMilestoneValue = Math.max(
      ...milestones.map((m) => Number(m.targetValue))
    );
    return Math.max(maxPortfolioValue, maxMilestoneValue) * 1.1; // Add 10% padding
  };

  // Calculate date range for API request
  const { start: startDate, end: endDate } = useMemo(() => {
    return getDateRange(dateRange as DateRangeOption);
  }, [dateRange]);

  // Fetch portfolio history data
  const { data: historyData, isLoading } = useQuery<
    PortfolioHistoryTimePoint[]
  >({
    queryKey: ["/api/assets/portfolio-value/history", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/assets/portfolio-value/history?${getDateUrlParams(
          startDate,
          endDate
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio history");
      }
      return response.json();
    },
  });

  //Mopve to utility
  const data: ChartData[] =
    Array.isArray(historyData) && historyData.length > 0
      ? combineDataPoints(
          historyData.map((item) => {
            const itemDate = new Date(item.date);
            // Find the highest milestone achieved at this point
            const achievedMilestone = milestones
              ?.filter((m) => {
                const portfolioValue = Number(item.value);
                const milestoneValue = Number(m.targetValue);
                return portfolioValue >= milestoneValue;
              })
              .sort((a, b) => Number(b.targetValue) - Number(a.targetValue))[0];
            return {
              date: itemDate.toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              }),
              value: Number(item.value),
              changes: item.changes,
              achievedMilestone: achievedMilestone
                ? {
                    name: achievedMilestone.name,
                    targetValue: Number(achievedMilestone.targetValue),
                  }
                : undefined,
            };
          })
        )
      : [];

  // Add milestone data if enabled
  const chartData = [...data];

  // Helper to get account type name
  const getAccountTypeName = (accountId: string) => {
    const account = brokerAssets.find((acc) => acc.id === accountId);
    return account
      ? `${account.providerId} ${account.accountType}`
      : `Account ${accountId}`;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full md:bg-white md:border md:rounded-lg md:shadow-sm",
          className
        )}
      >
        <div className="p-2 md:p-4 h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full md:bg-white md:border md:rounded-lg md:shadow-sm",
        className
      )}
    >
      <div className="px-[5px] py-1 md:p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Portfolio Overview</h2>
          <div className="flex space-x-3">
            <div className="flex items-center">
              <span className="text-sm text-neutral-700 mr-2">Chart</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="toggle-chart"
                  checked={chartVisible}
                  onChange={() => setChartVisible(!chartVisible)}
                  className="sr-only"
                />
                <label
                  htmlFor="toggle-chart"
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                >
                  <span
                    className={cn(
                      "block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out",
                      chartVisible ? "translate-x-4" : ""
                    )}
                  ></span>
                </label>
              </div>
            </div>
            {chartVisible && (
              <div className="flex items-center">
                <span className="text-sm text-neutral-700 mr-2">
                  Milestones
                </span>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="toggle-milestones"
                    checked={showMilestonesLocal}
                    onChange={() =>
                      setShowMilestonesLocal(!showMilestonesLocal)
                    }
                    className="sr-only"
                  />
                  <label
                    htmlFor="toggle-milestones"
                    className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out",
                        showMilestonesLocal ? "translate-x-4" : ""
                      )}
                    ></span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {chartVisible && (
          <>
            <ChartContainer
              config={chartConfig}
              className="min-h-[240px] w-full mb-5"
            >
              <LineChart
                data={chartData}
                onClick={(data) => {
                  if (data && data.activePayload) {
                    setSelectedPoint(
                      data.activePayload[0].payload as ChartData
                    );
                  }
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `£${value.toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  domain={[0, getMaxYValue()]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: any, name: any) => {
                        const formattedValue = `£${Number(value).toLocaleString()}`;
                        return [formattedValue, chartConfig[name as keyof typeof chartConfig]?.label || name];
                      }}
                      labelFormatter={(label: any) => label}
                    />
                  }
                />
                {showMilestonesLocal &&
                  milestones &&
                  milestones.map((milestone) => (
                    <ReferenceLine
                      key={milestone.id}
                      y={Number(milestone.targetValue)}
                      stroke="var(--color-milestones)"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      label={{
                        value: `£${Number(
                          milestone.targetValue
                        ).toLocaleString()}`,
                        position: "right",
                        fill: "var(--color-milestones)",
                        fontSize: 12,
                      }}
                    />
                  ))}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-value)" }}
                  activeDot={{ r: 5, fill: "var(--color-value)" }}
                  isAnimationActive={false}
                  name="value"
                />
              </LineChart>
            </ChartContainer>

            {/* Date range controls are now provided globally by DateRangeContext */}

            {selectedPoint && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">
                      {selectedPoint.date}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total Portfolio Value: £
                      {selectedPoint.value.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>

                {selectedPoint.achievedMilestone && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 mb-1">
                      Milestone Achieved!
                    </h4>
                    <p className="text-sm text-green-700">
                      {selectedPoint.achievedMilestone.name} (£
                      {selectedPoint.achievedMilestone.targetValue.toLocaleString()}
                      )
                    </p>
                  </div>
                )}

                {selectedPoint.changes && selectedPoint.changes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Account Changes
                    </h4>
                    <div className="space-y-2">
                      {selectedPoint.changes.map((change, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600 font-medium">
                            {getAccountTypeName(change.assetId)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">
                              £{change.previousValue.toLocaleString()} → £
                              {change.newValue.toLocaleString()}
                            </span>
                            <span
                              className={
                                change.change >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {change.change >= 0 ? "+" : ""}£
                              {Math.abs(change.change).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
