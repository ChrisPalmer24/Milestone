import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";

type AccountFormData = {
  [key: number]: string;
};

export default function Record() {
  const { 
    accounts,
    addAccountHistory,
    isLoading 
  } = usePortfolio();
  
  const { toast } = useToast();
  const [accountValues, setAccountValues] = useState<AccountFormData>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingAccounts, setUpdatingAccounts] = useState<number[]>([]);
  
  // Handle input change for account values
  const handleAccountValueChange = (accountId: number, value: string) => {
    setAccountValues(prev => ({
      ...prev,
      [accountId]: value
    }));
  };
  
  // Handle form submission for a single account
  const handleSubmitAccount = async (accountId: number) => {
    const value = accountValues[accountId];
    
    if (!value || !date) {
      toast({
        title: "Missing information",
        description: "Please enter a value for this account",
        variant: "destructive"
      });
      return;
    }
    
    setUpdatingAccounts(prev => [...prev, accountId]);
    
    try {
      await addAccountHistory({
        accountId,
        value,
        recordedAt: new Date(date)
      });
      
      toast({
        title: "Value recorded",
        description: "Account value has been updated successfully",
      });
      
      // Clear the value for this account
      setAccountValues(prev => {
        const newValues = {...prev};
        delete newValues[accountId];
        return newValues;
      });
    } catch (error) {
      console.error("Error recording value:", error);
      toast({
        title: "Error",
        description: "Failed to record value. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingAccounts(prev => prev.filter(id => id !== accountId));
    }
  };
  
  // Handle submission of all accounts at once
  const handleSubmitAll = async () => {
    const accountsToUpdate = Object.entries(accountValues)
      .filter(([_, value]) => value.trim() !== "")
      .map(([id, value]) => ({ 
        accountId: parseInt(id), 
        value,
        recordedAt: new Date(date) 
      }));
    
    if (accountsToUpdate.length === 0) {
      toast({
        title: "No values to update",
        description: "Please enter at least one account value",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update each account sequentially
      for (const accountData of accountsToUpdate) {
        await addAccountHistory(accountData);
      }
      
      toast({
        title: "Values recorded",
        description: `Updated ${accountsToUpdate.length} account(s) successfully`,
      });
      
      // Reset all values
      setAccountValues({});
    } catch (error) {
      console.error("Error recording values:", error);
      toast({
        title: "Error",
        description: "Failed to record some values. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="record-screen max-w-5xl mx-auto px-4 pb-20">
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Record Account Values</CardTitle>
          <CardDescription>
            Update the value of your accounts to keep track of your investments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Date for All Entries
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full md:w-1/3"
            />
          </div>
          
          {accounts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                You don't have any accounts yet. Add accounts in the Portfolio section.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium">{account.provider}</h3>
                        <p className="text-sm text-muted-foreground">{account.accountType}</p>
                        <p className="text-sm">Current: £{parseInt(account.currentValue).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex-1 md:max-w-xs">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">£</span>
                          </div>
                          <Input
                            type="number"
                            className="pl-7"
                            placeholder="Enter new value"
                            value={accountValues[account.id] || ""}
                            onChange={(e) => handleAccountValueChange(account.id, e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleSubmitAccount(account.id)}
                        disabled={!accountValues[account.id] || updatingAccounts.includes(account.id) || isLoading}
                        className="whitespace-nowrap"
                        size="sm"
                      >
                        {updatingAccounts.includes(account.id) ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handleSubmitAll}
                  disabled={submitting || isLoading || Object.keys(accountValues).length === 0}
                  className="w-full bg-primary text-white"
                >
                  {submitting ? "Recording All Values..." : "Record All Values"}
                </Button>
              </div>
            </>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Regularly updating your account values helps you track your progress
              and keeps your portfolio data accurate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}