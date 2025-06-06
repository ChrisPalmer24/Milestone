import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type TrackChartProps = {
  targetAge: number;
  targetAmount: number;
  currentAge: number;
  currentAmount: number;
  className?: string;
};

const chartConfig = {
  projected: {
    label: "Projected Growth",
    color: "hsl(var(--chart-1))",
  },
  actual: {
    label: "Your Progress",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function TrackChart({
  targetAge,
  targetAmount,
  currentAge,
  currentAmount,
  className
}: TrackChartProps) {
  // Generate data points for projected growth path
  const generateProjectedData = () => {
    const data = [];
    const years = targetAge - currentAge;
    const growthRate = Math.pow(targetAmount / currentAmount, 1 / years) - 1;
    
    for (let i = 0; i <= years; i++) {
      const age = currentAge + i;
      const projected = currentAmount * Math.pow(1 + growthRate, i);
      
      data.push({
        age: age.toString(),
        projected: Math.round(projected),
        actual: i === 0 ? currentAmount : null
      });
    }
    
    return data;
  };

  const data = generateProjectedData();

  // Format currency values
  const formatCurrency = (value: number) => {
    return `£${value.toLocaleString()}`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <ChartContainer
          config={chartConfig}
          className="min-h-[240px] w-full"
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="age" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tickFormatter={(value) => `£${(value / 1000)}k`}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value: any, name: any) => {
                    const formattedValue = `£${Number(value).toLocaleString()}`;
                    return [formattedValue, chartConfig[name as keyof typeof chartConfig]?.label || name];
                  }}
                />
              }
            />
            <Line 
              type="monotone" 
              dataKey="projected" 
              stroke="var(--color-projected)" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              name="projected"
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="var(--color-actual)" 
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 6 }}
              name="actual"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
