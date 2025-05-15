import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  calculateFireNumber,
  calculateYearsToTarget,
  calculateContributionImpact,
} from "@/lib/utils/finance";
import FireChart from "@/components/ui/charts/FireChart";
import { useToast } from "@/hooks/use-toast";
import { FireSettingsInsert } from "shared/schema";

export default function Fire() {
  const {
    fireSettings,
    updateFireSettings,
    isLoading,
    createFireSettings,
    portfolioOverview,
  } = usePortfolio();
  const { toast } = useToast();

  // Default values if fireSettings is not loaded yet
  const defaultSettings: Omit<FireSettingsInsert, "id" | "userAccountId"> = {
    targetRetirementAge: 60,
    annualIncomeGoal: "48000",
    expectedAnnualReturn: "7",
    safeWithdrawalRate: "4",
    monthlyInvestment: "300",
    currentAge: 35,
  };

  // Form state with defaults
  const [formState, setFormState] = useState<{
    annualIncome: number;
    expectedReturn: number;
    withdrawalRate: number;
    monthlyInvestment: number;
    targetRetirementAge: number;
    adjustInflation: boolean;
  }>({
    annualIncome:
      Number(fireSettings?.annualIncomeGoal) ||
      Number(defaultSettings.annualIncomeGoal),
    expectedReturn:
      Number(fireSettings?.expectedAnnualReturn) ||
      Number(defaultSettings.expectedAnnualReturn),
    withdrawalRate:
      Number(fireSettings?.safeWithdrawalRate) ||
      Number(defaultSettings.safeWithdrawalRate),
    monthlyInvestment:
      Number(fireSettings?.monthlyInvestment) ||
      Number(defaultSettings.monthlyInvestment),
    targetRetirementAge:
      Number(fireSettings?.targetRetirementAge) ||
      Number(defaultSettings.targetRetirementAge),
    adjustInflation:
      fireSettings?.adjustInflation !== undefined
        ? Boolean(fireSettings.adjustInflation)
        : true,
  });

  // Update form state when fireSettings loads
  useEffect(() => {
    if (fireSettings) {
      setFormState({
        annualIncome: Number(fireSettings.annualIncomeGoal),
        expectedReturn: Number(fireSettings.expectedAnnualReturn),
        withdrawalRate: Number(fireSettings.safeWithdrawalRate),
        monthlyInvestment: Number(fireSettings.monthlyInvestment),
        targetRetirementAge: Number(fireSettings.targetRetirementAge),
        adjustInflation: fireSettings.adjustInflation !== undefined 
          ? Boolean(fireSettings.adjustInflation) 
          : true,
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
    portfolioOverview?.value ?? 0,
    formState.monthlyInvestment,
    formState.expectedReturn,
    fireNumber
  );

  // Calculate the impact of changing monthly investment
  const increaseImpact = calculateContributionImpact({
    currentAmount: portfolioOverview?.value ?? 0,
    currentMonthlyInvestment: formState.monthlyInvestment,
    newMonthlyInvestment: formState.monthlyInvestment + 100,
    expectedReturn: formState.expectedReturn,
    targetAmount: fireNumber,
    currentAge: fireSettings?.currentAge || defaultSettings.currentAge,
  });

  const decreaseImpact = calculateContributionImpact({
    currentAmount: portfolioOverview?.value ?? 0,
    currentMonthlyInvestment: formState.monthlyInvestment,
    newMonthlyInvestment: formState.monthlyInvestment - 100,
    expectedReturn: formState.expectedReturn,
    targetAmount: fireNumber,
    currentAge: fireSettings?.currentAge || defaultSettings.currentAge,
  });

  // Projected retirement age
  const projectedRetirementAge = Math.round(
    (fireSettings?.currentAge || defaultSettings.currentAge) + yearsToFire
  );

  // Handle adjusting the monthly investment
  const handleAdjustInvestment = async (adjustment: number) => {
    if (!fireSettings) return;

    const newMonthlyInvestment =
      Number(formState.monthlyInvestment) + adjustment;

    try {
      await updateFireSettings.mutateAsync({
        monthlyInvestment: newMonthlyInvestment.toString(),
        targetRetirementAge: fireSettings.targetRetirementAge,
        annualIncomeGoal: fireSettings.annualIncomeGoal,
        expectedAnnualReturn: fireSettings.expectedAnnualReturn,
        safeWithdrawalRate: fireSettings.safeWithdrawalRate,
        currentAge: fireSettings.currentAge,
      });

      setFormState((prev) => ({
        ...prev,
        monthlyInvestment: newMonthlyInvestment,
      }));
    } catch (error) {
      console.error("Error updating monthly investment:", error);
    }
  };

  // Handle form submission
  const handleSaveSettings = async () => {
    const settings: Omit<FireSettingsInsert, "id" | "userAccountId"> = {
      targetRetirementAge: formState.targetRetirementAge,
      annualIncomeGoal: formState.annualIncome.toString(),
      expectedAnnualReturn: formState.expectedReturn.toString(),
      safeWithdrawalRate: formState.withdrawalRate.toString(),
      monthlyInvestment: formState.monthlyInvestment.toString(),
      currentAge: defaultSettings.currentAge,
      adjustInflation: formState.adjustInflation,
    };

    try {
      if (!fireSettings) {
        await createFireSettings.mutateAsync(settings);
      } else {
        await updateFireSettings.mutateAsync(settings);
      }
      toast({
        title: "Settings saved",
        description: "Your FIRE settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving FIRE settings:", error);
      toast({
        title: "Error saving settings",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formState, value: string | boolean) => {
    if (typeof value === 'boolean') {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormState((prev) => ({
          ...prev,
          [field]: numValue,
        }));
      }
    }
  };

  // If no FIRE settings exist, show initial setup
  if (!fireSettings) {
    return (
      <div className="fire-screen max-w-5xl mx-auto px-4 pb-20">
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-3">
              Welcome to FIRE Planning
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Let's set up your Financial Independence and Retire Early (FIRE)
              goals. This will help you track your progress towards financial
              independence.
            </p>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="annual-income"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Desired Annual Income in Retirement
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
                    onChange={(e) =>
                      handleInputChange("annualIncome", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="expected-return"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expected Annual Return (%)
                </Label>
                <Input
                  id="expected-return"
                  type="number"
                  value={formState.expectedReturn}
                  onChange={(e) =>
                    handleInputChange("expectedReturn", e.target.value)
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor="withdrawal-rate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Safe Withdrawal Rate (%)
                </Label>
                <Input
                  id="withdrawal-rate"
                  type="number"
                  value={formState.withdrawalRate}
                  onChange={(e) =>
                    handleInputChange("withdrawalRate", e.target.value)
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor="monthly-investment"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Monthly Investment
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
                    onChange={(e) =>
                      handleInputChange("monthlyInvestment", e.target.value)
                    }
                  />
                </div>
              </div>

              <Button
                className="w-full bg-primary text-white py-2 rounded-lg font-medium"
                onClick={handleSaveSettings}
              >
                Save FIRE Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main FIRE calculator view
  return (
    <div className="fire-screen max-w-5xl mx-auto px-4 pb-20">
      <Card className="mt-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-3">FIRE Calculator</h2>
          <p className="text-sm text-gray-600 mb-6">
            Plan your Financial Independence and Retire Early
          </p>

          {/* Chart */}
          <FireChart
            currentAge={fireSettings.currentAge}
            currentAmount={portfolioOverview?.value ?? 0}
            monthlyInvestment={formState.monthlyInvestment}
            targetAmount={fireNumber}
            expectedReturn={formState.expectedReturn}
            adjustInflation={formState.adjustInflation}
            className="mb-6"
          />

          {/* FIRE Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Your FIRE Summary</h3>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Current portfolio:</span>
              <span className="font-medium">
                £{portfolioOverview?.value?.toLocaleString() ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">
                FIRE number (25x expenses):
              </span>
              <span className="font-medium">
                £{fireNumber.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">
                Annual sustainable income ({formState.withdrawalRate}%):
              </span>
              <span className="font-medium">
                £{formState.annualIncome.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">
                Projected retirement age:
              </span>
              <span className="font-medium">
                {projectedRetirementAge} years
              </span>
            </div>
          </div>

          {/* Adjust Investment */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">Adjust Your Investment</h3>

            <div className="mb-4">
              <Label
                htmlFor="monthly-investment"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                  onChange={(e) =>
                    handleInputChange("monthlyInvestment", e.target.value)
                  }
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
                  By increasing your monthly investment by £100, you could
                  retire{" "}
                  <span className="font-medium">
                    {increaseImpact.monthsDifference > 12
                      ? `${Math.floor(
                          increaseImpact.monthsDifference / 12
                        )} years and ${
                          increaseImpact.monthsDifference % 12
                        } months`
                      : `${increaseImpact.monthsDifference} months`}{" "}
                    earlier
                  </span>
                  .
                </p>
              ) : (
                <p>
                  By decreasing your monthly investment by £100, your retirement
                  would be delayed by{" "}
                  <span className="font-medium">
                    {decreaseImpact.monthsDifference > 12
                      ? `${Math.floor(
                          Math.abs(decreaseImpact.monthsDifference) / 12
                        )} years and ${
                          Math.abs(decreaseImpact.monthsDifference) % 12
                        } months`
                      : `${Math.abs(decreaseImpact.monthsDifference)} months`}
                  </span>
                  .
                </p>
              )}
            </div>
          </div>

          {/* FIRE Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Your FIRE Settings</h3>

            <div className="mb-4">
              <Label
                htmlFor="annual-income"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                  onChange={(e) =>
                    handleInputChange("annualIncome", e.target.value)
                  }
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your desired annual income in today's money.
              </p>
            </div>

            <div className="mb-4">
              <Label
                htmlFor="expected-return"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expected Annual Return (%)
              </Label>
              <Input
                id="expected-return"
                type="number"
                value={formState.expectedReturn}
                onChange={(e) =>
                  handleInputChange("expectedReturn", e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <Label
                htmlFor="withdrawal-rate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Safe Withdrawal Rate (%)
              </Label>
              <Input
                id="withdrawal-rate"
                type="number"
                value={formState.withdrawalRate}
                onChange={(e) =>
                  handleInputChange("withdrawalRate", e.target.value)
                }
              />
            </div>

            <div className="mb-4">
              <Label
                htmlFor="target-retirement-age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Desired Retirement Age
              </Label>
              <Input
                id="target-retirement-age"
                type="number"
                value={formState.targetRetirementAge}
                onChange={(e) =>
                  handleInputChange("targetRetirementAge", e.target.value)
                }
              />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="adjust-inflation" 
                  checked={formState.adjustInflation}
                  onCheckedChange={(checked) => 
                    handleInputChange("adjustInflation", checked === true)
                  }
                />
                <Label 
                  htmlFor="adjust-inflation" 
                  className="text-sm cursor-pointer"
                >
                  Adjust for inflation (2.8%)
                </Label>
              </div>
            </div>

            <Button
              className="w-full bg-primary text-white py-2 rounded-lg font-medium"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
