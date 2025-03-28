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
      ? historyData.map((item) => ({
          date: new Date(item.date).toLocaleDateString("en-GB", {
            month: "short",
            day: "2-digit",
          }),
          value: Number(item.value),
        }))
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
                <LineChart data={chartData}>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
