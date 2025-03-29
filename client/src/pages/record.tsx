import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Record() {
  const { 
    accounts,
    addAccountHistory,
    isLoading 
  } = usePortfolio();
  
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !value || !date) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      await addAccountHistory({
        accountId: selectedAccount,
        value,
        recordedAt: new Date(date)
      });
      
      toast({
        title: "Value recorded",
        description: "Your account value has been updated successfully",
      });
      
      // Reset form
      setValue("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error recording value:", error);
      toast({
        title: "Error",
        description: "Failed to record value. Please try again.",
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
          <CardTitle className="text-lg font-semibold">Record Account Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Update the value of your accounts to keep track of your investments.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={selectedAccount?.toString() || ""}
                onValueChange={(value) => setSelectedAccount(Number(value))}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.provider} - {account.accountType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Current Value</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">£</span>
                </div>
                <Input
                  id="value"
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-primary text-white"
              disabled={submitting || isLoading}
            >
              {submitting ? "Recording..." : "Record Value"}
            </Button>
          </form>
          
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