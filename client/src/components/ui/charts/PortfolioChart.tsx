import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { PortfolioHistory } from "@shared/schema";
import { usePortfolio } from "@/context/PortfolioContext";

// Date range options for the chart
const DATE_RANGES = [
  { label: "W", value: "week" },
  { label: "1M", value: "1month" },
  { label: "3M", value: "3months" },
  { label: "6M", value: "6months" },
  { label: "1Y", value: "1year" },
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];

type ChartData = {
  date: string;
  value: number;
  milestone?: number;
  changes?: {
    accountId: number;
    previousValue: number;
    newValue: number;
    change: number;
  }[];
};

type DateRangeOption =
  | "week"
  | "1month"
  | "3months"
  | "6months"
  | "1year"
  | "ytd"
  | "all";

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

  // Convert map back to array and sort by date
  return Array.from(combinedData.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

// Helper to calculate date range
const getDateRange = (range: DateRangeOption): { start: Date; end: Date } => {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "1month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "3months":
      start.setMonth(end.getMonth() - 3);
      break;
    case "6months":
      start.setMonth(end.getMonth() - 6);
      break;
    case "1year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "ytd":
      start = new Date(end.getFullYear(), 0, 1); // January 1st of current year
      break;
    case "all":
      start = new Date(2019, 0, 1); // Just a distant past date
      break;
    default:
      start.setMonth(end.getMonth() - 6); // Default to 6 months
  }

  return { start, end };
};

type PortfolioChartProps = {
  showMilestones?: boolean;
  nextMilestone?: number;
  className?: string;
};

export default function PortfolioChart({
  showMilestones = false,
  nextMilestone,
  className,
}: PortfolioChartProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>("6months");
  const [chartVisible, setChartVisible] = useState(true);
  const [showMilestonesLocal, setShowMilestonesLocal] =
    useState(showMilestones);
  const [selectedPoint, setSelectedPoint] = useState<ChartData | null>(null);
  const { accounts } = usePortfolio();

  // Update local state when prop changes
  useEffect(() => {
    setShowMilestonesLocal(showMilestones);
  }, [showMilestones]);

  // Calculate date range for API request
  const { start, end } = getDateRange(dateRange);

  // Fetch portfolio history data
  const { data: historyData, isLoading } = useQuery<PortfolioHistory>({
    queryKey: ["/api/portfolio/history", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/portfolio/history?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio history");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch when network reconnects
  });

  const data: ChartData[] =
    Array.isArray(historyData) && historyData.length > 0
      ? combineDataPoints(
          historyData.map((item) => ({
            date: new Date(item.date).toLocaleDateString("en-GB", {
              month: "short",
              day: "2-digit",
            }),
            value: Number(item.value),
            changes: item.changes,
          }))
        )
      : [];

  // Add milestone data if enabled
  const chartData = [...data];
  if (showMilestonesLocal && nextMilestone && chartData.length > 0) {
    // Add the last actual value point
    const lastPoint = chartData[chartData.length - 1];

    // Add the milestone target
    chartData.push({
      ...lastPoint,
      milestone: nextMilestone,
    });
  }

  console.log("history data: ", historyData);

  // Helper to get account type name
  const getAccountTypeName = (accountId: number) => {
    const account = accounts.find((acc) => acc.id === accountId);
    return account
      ? `${account.provider} ${account.accountType}`
      : `Account ${accountId}`;
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4 h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
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
            <div className="flex items-center">
              <span className="text-sm text-neutral-700 mr-2">Milestones</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  id="toggle-milestones"
                  checked={showMilestonesLocal}
                  onChange={() => setShowMilestonesLocal(!showMilestonesLocal)}
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
          </div>
        </div>

        {chartVisible && (
          <>
            <div className="chart-container h-[240px] w-full mb-5">
              <ResponsiveContainer width="100%" height="100%">
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
                    stroke="#f0f0f0"
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
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `£${value.toLocaleString()}`,
                      "Portfolio Value",
                    ]}
                    cursor={{
                      stroke: "#3B82F6",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  {showMilestonesLocal && (
                    <Line
                      type="monotone"
                      dataKey="milestone"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center space-x-1 mb-5">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  className={cn(
                    "date-range-btn text-xs font-medium py-1 px-2 rounded-md transition-all",
                    dateRange === range.value
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-200 hover:bg-gray-300 shadow-sm"
                  )}
                  onClick={() => setDateRange(range.value as DateRangeOption)}
                >
                  {range.label}
                </button>
              ))}
            </div>

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
                            {getAccountTypeName(change.accountId)}
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
      </CardContent>
    </Card>
  );
}
