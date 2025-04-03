import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { PortfolioHistory } from "@shared/schema";
import { usePortfolio } from "@/context/PortfolioContext";
import { Check } from "lucide-react";

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
    accountId: string;
    previousValue: number;
    newValue: number;
    change: number;
  }[];
  achievedMilestone?: {
    name: string;
    targetValue: number;
  };
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

  // Convert map back to array and sort by date using proper date parsing
  return Array.from(combinedData.values()).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
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
  showMilestones = true,
  nextMilestone,
  className,
}: PortfolioChartProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>("6months");
  const [chartVisible, setChartVisible] = useState(true);
  const [showMilestonesLocal, setShowMilestonesLocal] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<ChartData | null>(null);
  const { accounts, milestones } = usePortfolio();

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
  });

  const data: ChartData[] =
    Array.isArray(historyData) && historyData.length > 0
      ? combineDataPoints(
          historyData.map((item) => {
            // Find the highest milestone achieved at this point
            const achievedMilestone = milestones
              ?.filter((m) => {
                const portfolioValue = Number(item.value);
                const milestoneValue = Number(m.targetValue);
                return portfolioValue >= milestoneValue;
              })
              .sort((a, b) => Number(b.targetValue) - Number(a.targetValue))[0];

            return {
              date: new Date(item.date).toLocaleDateString("en-GB", {
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
                    domain={[0, getMaxYValue()]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => {
                      const data = props.payload as ChartData;
                      console.log("Tooltip data:", data);
                      console.log(
                        "Achieved milestone:",
                        data.achievedMilestone
                      );

                      const items = [
                        [`£${value.toLocaleString()}`, "Portfolio Value"],
                      ];

                      if (data.achievedMilestone) {
                        items.push([
                          `£${data.achievedMilestone.targetValue.toLocaleString()}`,
                          `Milestone: ${data.achievedMilestone.name}`,
                        ]);
                      }

                      return items;
                    }}
                    cursor={{
                      stroke: "#3B82F6",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                    isAnimationActive={false}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                    }}
                    labelStyle={{
                      color: "#374151",
                      fontWeight: 500,
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartData;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                            <p className="font-medium text-gray-900">
                              {data.date}
                            </p>
                            <p className="text-gray-700">
                              £{data.value.toLocaleString()}
                            </p>
                            {data.achievedMilestone && (
                              <p className="text-green-600 font-medium flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                {data.achievedMilestone.name}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {showMilestonesLocal &&
                    milestones &&
                    milestones.map((milestone) => (
                      <ReferenceLine
                        key={milestone.id}
                        y={Number(milestone.targetValue)}
                        stroke="#F59E0B"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        label={{
                          value: `£${Number(
                            milestone.targetValue
                          ).toLocaleString()}`,
                          position: "right",
                          fill: "#F59E0B",
                          fontSize: 12,
                        }}
                      />
                    ))}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3B82F6" }}
                    activeDot={{ r: 5, fill: "#2563EB" }}
                    isAnimationActive={false}
                  />
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
