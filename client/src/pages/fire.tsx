import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  calculateFireNumber, 
  calculateYearsToTarget, 
  calculateContributionImpact
} from "@/lib/utils/finance";
import FireChart from "@/components/ui/charts/FireChart";

export default function Fire() {
  const { 
    totalPortfolioValue,
    fireSettings,
    updateFireSettings,
    isLoading 
  } = usePortfolio();
  
  // Default values if fireSettings is not loaded yet
  const defaultSettings = {
    targetRetirementAge: 60,
    annualIncomeGoal: 48000,
    expectedAnnualReturn: 7,
    safeWithdrawalRate: 4,
    monthlyInvestment: 1500,
    currentAge: 35
  };

  // Form state with defaults
  const [formState, setFormState] = useState({
    annualIncome: fireSettings?.annualIncomeGoal || defaultSettings.annualIncomeGoal,
    expectedReturn: fireSettings?.expectedAnnualReturn || defaultSettings.expectedAnnualReturn,
    withdrawalRate: fireSettings?.safeWithdrawalRate || defaultSettings.safeWithdrawalRate,
    monthlyInvestment: fireSettings?.monthlyInvestment || defaultSettings.monthlyInvestment
  });
  
  // Update form state when fireSettings loads
  useEffect(() => {
    if (fireSettings) {
      setFormState({
        annualIncome: Number(fireSettings.annualIncomeGoal),
        expectedReturn: Number(fireSettings.expectedAnnualReturn),
        withdrawalRate: Number(fireSettings.safeWithdrawalRate),
        monthlyInvestment: Number(fireSettings.monthlyInvestment)
      });
    }
  }, [fireSettings]);
  
  // Calculate FIRE number based on desired income and withdrawal rate
  const fireNumber = calculateFireNumber(
    formState.annualIncome,
    formState.withdrawalRate
  );
  
  // Calculate years to reach FIRE
  const yearsToFire = calculateYearsToTarget(
    totalPortfolioValue,
    formState.monthlyInvestment,
    formState.expectedReturn,
    fireNumber
  );
  
  // Calculate the impact of changing monthly investment
  const increaseImpact = calculateContributionImpact({
    currentAmount: totalPortfolioValue,
    currentMonthlyInvestment: formState.monthlyInvestment,
    newMonthlyInvestment: formState.monthlyInvestment + 100,
    expectedReturn: formState.expectedReturn,
    targetAmount: fireNumber,
    currentAge: fireSettings?.currentAge || defaultSettings.currentAge
  });
  
  const decreaseImpact = calculateContributionImpact({
    currentAmount: totalPortfolioValue,
    currentMonthlyInvestment: formState.monthlyInvestment,
    newMonthlyInvestment: formState.monthlyInvestment - 100,
    expectedReturn: formState.expectedReturn,
    targetAmount: fireNumber,
    currentAge: fireSettings?.currentAge || defaultSettings.currentAge
  });
  
  // Projected retirement age
  const projectedRetirementAge = Math.round(
    (fireSettings?.currentAge || defaultSettings.currentAge) + yearsToFire
  );
  
  // Handle adjusting the monthly investment
  const handleAdjustInvestment = async (adjustment: number) => {
    if (!fireSettings) return;
    
    const newMonthlyInvestment = Number(formState.monthlyInvestment) + adjustment;
    
    try {
      await updateFireSettings({
        // Convert to string as expected by the API
        monthlyInvestment: newMonthlyInvestment.toString()
      });
      
      setFormState({
        ...formState,
        monthlyInvestment: newMonthlyInvestment
      });
    } catch (error) {
      console.error("Error updating monthly investment:", error);
    }
  };
  
  // Handle form submission
  const handleRecalculate = async () => {
    if (!fireSettings) return;
    
    try {
      await updateFireSettings({
        // Convert to strings as expected by the API
        annualIncomeGoal: formState.annualIncome.toString(),
        expectedAnnualReturn: formState.expectedReturn.toString(),
        safeWithdrawalRate: formState.withdrawalRate.toString()
      });
    } catch (error) {
      console.error("Error updating FIRE settings:", error);
    }
  };
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormState({
        ...formState,
        [field]: numValue
      });
    }
  };

  return (
    <div className="fire-screen max-w-5xl mx-auto px-4 pb-20">
      <Card className="mt-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-3">FIRE Calculator</h2>
          <p className="text-sm text-gray-600 mb-6">Plan your Financial Independence and Retire Early</p>

          {/* Chart */}
          <FireChart 
            currentAge={fireSettings?.currentAge || defaultSettings.currentAge}
            currentAmount={totalPortfolioValue}
            monthlyInvestment={formState.monthlyInvestment}
            targetAmount={fireNumber}
            expectedReturn={formState.expectedReturn}
            className="mb-6"
          />

          {/* FIRE Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Your FIRE Summary</h3>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Current portfolio:</span>
              <span className="font-medium">£{totalPortfolioValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">FIRE number (25x expenses):</span>
              <span className="font-medium">£{fireNumber.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Annual sustainable income ({formState.withdrawalRate}%):</span>
              <span className="font-medium">£{formState.annualIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Projected retirement age:</span>
              <span className="font-medium">{projectedRetirementAge} years</span>
            </div>
          </div>

          {/* Adjust Investment */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Adjust Your Investment</h3>
            
            <div className="mb-4">
              <Label htmlFor="monthly-investment" className="block text-sm font-medium text-gray-700 mb-1">
                Current Monthly Investment
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">£</span>
                </div>
                <Input
                  id="monthly-investment"
                  type="number"
                  className="pl-7"
                  value={formState.monthlyInvestment}
                  onChange={(e) => handleInputChange('monthlyInvestment', e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-2 mb-4">
              <Button 
                variant="outline"
                className="flex-1 py-2 px-3"
                onClick={() => handleAdjustInvestment(-100)}
                disabled={formState.monthlyInvestment <= 100}
              >
                -£100/month
              </Button>
              <Button 
                className="flex-1 py-2 px-3 bg-primary text-white"
                onClick={() => handleAdjustInvestment(100)}
              >
                +£100/month
              </Button>
            </div>

            <div className="px-3 py-2 bg-blue-50 rounded-lg text-blue-700 text-sm">
              {increaseImpact.monthsDifference > 0 ? (
                <p>
                  By increasing your monthly investment by £100, you could retire{' '}
                  <span className="font-medium">
                    {increaseImpact.monthsDifference > 12 ? 
                      `${Math.floor(increaseImpact.monthsDifference / 12)} years and ${increaseImpact.monthsDifference % 12} months` :
                      `${increaseImpact.monthsDifference} months`
                    } earlier
                  </span>.
                </p>
              ) : (
                <p>
                  By decreasing your monthly investment by £100, your retirement would be delayed by{' '}
                  <span className="font-medium">
                    {decreaseImpact.monthsDifference > 12 ? 
                      `${Math.floor(Math.abs(decreaseImpact.monthsDifference) / 12)} years and ${Math.abs(decreaseImpact.monthsDifference) % 12} months` :
                      `${Math.abs(decreaseImpact.monthsDifference)} months`
                    }
                  </span>.
                </p>
              )}
            </div>
          </div>

          {/* FIRE Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Your FIRE Settings</h3>
            
            <div className="mb-4">
              <Label htmlFor="annual-income" className="block text-sm font-medium text-gray-700 mb-1">
                Desired Annual Income
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">£</span>
                </div>
                <Input
                  id="annual-income"
                  type="number"
                  className="pl-7"
                  value={formState.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This sets your FIRE number to £{(formState.annualIncome * (100 / formState.withdrawalRate)).toLocaleString()} ({100/formState.withdrawalRate}x)
              </p>
            </div>

            <div className="mb-4">
              <Label htmlFor="expected-return" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Annual Return (%)
              </Label>
              <Input
                id="expected-return"
                type="number"
                value={formState.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="withdrawal-rate" className="block text-sm font-medium text-gray-700 mb-1">
                Safe Withdrawal Rate (%)
              </Label>
              <Input
                id="withdrawal-rate"
                type="number"
                value={formState.withdrawalRate}
                onChange={(e) => handleInputChange('withdrawalRate', e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-primary text-white py-2 rounded-lg font-medium"
              onClick={handleRecalculate}
            >
              Recalculate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
