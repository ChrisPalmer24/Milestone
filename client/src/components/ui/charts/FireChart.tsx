import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { calculateFireProjection } from "@/lib/utils/finance";

type FireChartProps = {
  currentAge: number;
  currentAmount: number;
  monthlyInvestment: number;
  targetAmount: number;
  expectedReturn: number;
  targetRetirementAge?: number;
  className?: string;
};

const chartConfig = {
  portfolio: {
    label: "Portfolio Value",
    color: "hsl(var(--chart-1))",
  },
  target: {
    label: "FIRE Target",
    color: "hsl(var(--chart-2))",
  },
  retirementMarker: {
    label: "Retirement Point",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function FireChart({
  currentAge,
  currentAmount,
  monthlyInvestment,
  targetAmount,
  expectedReturn,
  targetRetirementAge,
  className
}: FireChartProps) {
  // Calculate projection data
  const { projectionData, yearsToFire } = calculateFireProjection({
    currentAmount,
    monthlyInvestment,
    expectedReturn,
    targetAmount,
    currentAge
  });

  // Format currency values
  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString()}`;
  };

  // Determine retirement age based on when FIRE is achieved or user's target age (whichever comes first)
  const fireAchievedAge = Math.ceil(currentAge + yearsToFire);
  // Use the target retirement age if provided, otherwise use the calculated FIRE achievement age
  const retirementAge = targetRetirementAge || fireAchievedAge;
  
  // Find the exact retirement point or the closest one
  let retirementPoint = projectionData.find(point => point.age === retirementAge);
  
  // If we don't have an exact match, find the closest point
  if (!retirementPoint) {
    // Find the closest age point to the retirement age
    const closest = projectionData.reduce((prev, curr) => {
      return Math.abs(curr.age - retirementAge) < Math.abs(prev.age - retirementAge) ? curr : prev;
    });
    retirementPoint = { ...closest, age: retirementAge };
  }

  // Create portfolio line data that ends at retirement age
  const portfolioLineData = projectionData.filter(point => point.age <= retirementAge);
  
  // Create a marker for the retirement point
  const retirementMarker = retirementPoint ? [retirementPoint] : [];

  // Generate X-axis ticks intelligently
  const xAxisTicks: number[] = [];
  
  // Always include current age
  xAxisTicks.push(currentAge);
  
  // Add the retirement age
  if (!xAxisTicks.includes(retirementAge)) {
    xAxisTicks.push(retirementAge);
  }
  
  // Add regular intervals up to 87
  for (let age = Math.ceil(currentAge / 10) * 10; age <= 87; age += 10) {
    if (!xAxisTicks.includes(age)) {
      xAxisTicks.push(age);
    }
  }
  
  // Add age 87 if not already included
  if (!xAxisTicks.includes(87)) {
    xAxisTicks.push(87);
  }
  
  // Sort the ticks in ascending order
  xAxisTicks.sort((a, b) => a - b);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <ChartContainer
          config={chartConfig}
          className="min-h-[240px] w-full"
        >
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            
            <XAxis 
              dataKey="age" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
              ticks={xAxisTicks}
              domain={[currentAge, 87]}
              allowDecimals={false}
              type="number"
            />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `£${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `£${(value / 1000).toFixed(0)}K`;
                }
                return `£${value.toLocaleString()}`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              width={80}
            />
            
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value: any, name: any) => {
                    const formattedValue = formatCurrency(Number(value));
                    return [formattedValue, chartConfig[name as keyof typeof chartConfig]?.label || name];
                  }}
                  labelFormatter={(age: any) => {
                    const ageValue = Number(age);
                    const retirementLabel = ageValue >= retirementAge 
                      ? ` (Retirement at ${retirementAge})` 
                      : "";
                    return `Age: ${ageValue}${retirementLabel}`;
                  }}
                />
              } 
            />
            
            {/* FIRE Target Reference Line */}
            <ReferenceLine
              y={targetAmount}
              stroke="var(--color-target)"
              strokeDasharray="8 8"
              strokeWidth={2}
              label={{
                value: `FIRE Target: ${formatCurrency(targetAmount)}`,
                position: "insideTopRight",
                fontSize: 12,
                fill: "var(--color-target)",
              }}
            />
            
            {/* Portfolio Growth Line - only to retirement age */}
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="var(--color-portfolio)"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
              data={portfolioLineData}
              name="portfolio"
            />
            
            {/* Target value line after retirement */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--color-target)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="target"
            />
            
            {/* Retirement point marker */}
            {retirementMarker.length > 0 && (
              <Line
                key="retirement-marker"
                name="retirementMarker"
                data={retirementMarker}
                dataKey="portfolio"
                dot={{
                  r: 8,
                  fill: "var(--color-retirement)",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
                activeDot={{ r: 10 }}
                stroke="none"
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}