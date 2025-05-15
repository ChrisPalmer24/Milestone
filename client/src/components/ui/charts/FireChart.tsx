import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
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
  
  // Create a point specifically for the retirement marker
  const retirementPoint = projectionData.find(point => point.age === retirementAge);
  const retirementMarker = retirementPoint ? [
    { 
      age: retirementAge, 
      portfolio: retirementPoint.portfolio,
      marker: retirementPoint.portfolio
    }
  ] : [];
  
  // Generate reasonable ticks for the X axis (age)
  const xAxisTicks = [];
  // Start with current age
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

  // Calculate max value for Y axis formatting
  const maxValue = Math.max(...projectionData.map(d => d.portfolio));

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="chart-container h-[240px] w-full mb-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              
              {/* Add a reference area for the retirement phase */}
              <ReferenceArea
                x1={retirementAge}
                x2={87}
                fill="#f2f9ff"
                fillOpacity={0.4}
                strokeOpacity={0}
              />
              
              <XAxis 
                dataKey="age" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                ticks={xAxisTicks}
                domain={[currentAge, 87]}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `£${(value / 1000000).toFixed(1)}M`;
                  } else {
                    return `£${(value / 1000).toFixed(0)}k`;
                  }
                }}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name) => {
                  let formattedValue = '';
                  if (value >= 1000000) {
                    formattedValue = `£${(value / 1000000).toFixed(2)}M`;
                  } else {
                    formattedValue = `£${value.toLocaleString()}`;
                  }
                  
                  // Customize label based on data series
                  let label = name;
                  if (name === "portfolio") {
                    label = "Portfolio Growth";
                  } else if (name === "target") {
                    label = "FIRE Target";
                  } else if (name === "marker") {
                    label = "Retirement Point";
                  }
                  
                  return [formattedValue, label];
                }}
                labelFormatter={(age) => {
                  // Add special indicator if this is the retirement age
                  if (age === retirementAge) {
                    return `Age: ${age} (Retirement)`;
                  }
                  return `Age: ${age}`;
                }}
              />
              
              {/* Add a reference line for retirement age */}
              <ReferenceLine
                x={retirementAge}
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{
                  value: targetRetirementAge 
                    ? `Retirement at ${retirementAge}` 
                    : `FIRE at ${retirementAge}`,
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 12
                }}
              />
              
              {/* Portfolio growth line - ending at retirement age */}
              <Line 
                type="monotone" 
                dataKey="portfolio" 
                stroke="#3B82F6" 
                strokeWidth={2}
                activeDot={{ r: 5 }}
                name="Portfolio Growth"
                // Filter data points to only show up to retirement age
                data={projectionData.filter(point => point.age <= retirementAge)}
                dot={false}
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
              
              {/* Special marker for retirement point */}
              {retirementMarker.length > 0 && (
                <Line 
                  dataKey="marker"
                  data={retirementMarker}
                  stroke="none"
                  dot={{
                    r: 8,
                    fill: "#10b981", 
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                  name="Retirement Point"
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
