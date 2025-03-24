import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateFireProjection } from "@/lib/utils/finance";

type FireChartProps = {
  currentAge: number;
  currentAmount: number;
  monthlyInvestment: number;
  targetAmount: number;
  expectedReturn: number;
  className?: string;
};

export default function FireChart({
  currentAge,
  currentAmount,
  monthlyInvestment,
  targetAmount,
  expectedReturn,
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

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="chart-container h-[240px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
              <Tooltip 
                formatter={(value: number, name) => [
                  `£${value.toLocaleString()}`, 
                  name === "portfolio" ? "Portfolio Growth" : "FIRE Target"
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="portfolio" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                name="Portfolio Growth"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="FIRE Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
