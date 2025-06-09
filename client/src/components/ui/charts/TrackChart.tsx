import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type TrackChartProps = {
  targetAge: number;
  targetAmount: number;
  currentAge: number;
  currentAmount: number;
  className?: string;
};

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
        <div className="chart-container h-[240px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
                formatter={(value: number) => [`£${value.toLocaleString()}`, value === currentAmount ? 'Your Progress' : 'Projected Growth']}
              />
              <Line 
                type="monotone" 
                dataKey="projected" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                name="Projected Growth"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 6 }}
                name="Your Progress"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
