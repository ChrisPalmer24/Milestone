import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, History } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import PortfolioChart from "@/components/ui/charts/PortfolioChart";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";

// Form schema for adding a new account
const accountSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  accountType: z.string().min(1, "Account type is required"),
  currentValue: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Value must be a positive number" }
  ),
});

export default function Portfolio() {
  const { 
    accounts, 
    milestones,
    totalPortfolioValue,
    addAccount,
    setActiveSection,
    isLoading
  } = usePortfolio();
  const { toast } = useToast();
  
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [displayInPercentage, setDisplayInPercentage] = useState(false);
  
  // Form for adding a new account
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      provider: "",
      accountType: "",
      currentValue: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    try {
      // Send the currentValue as a string to match the server's expectation
      await addAccount({
        provider: values.provider,
        accountType: values.accountType as any,
        currentValue: values.currentValue // Keep as string for numeric type
      });
      setIsAddAccountOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };
  
  // Helper to get logo for provider
  const getProviderLogo = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "trading 212":
      case "trading212":
        return <SiTradingview className="w-6 h-6" />;
      case "vanguard":
        return <BsPiggyBank className="w-6 h-6" />;
      case "invest engine":
      case "investengine":
        return <SiCoinbase className="w-6 h-6" />;
      default:
        return <SiTradingview className="w-6 h-6" />;
    }
  };
  
  // Get color for account type
  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "ISA":
        return "text-blue-400";
      case "SIPP":
        return "text-secondary";
      case "LISA":
        return "text-accent";
      case "GIA":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };
  
  // Find next milestone for the portfolio if any
  const getNextMilestone = () => {
    if (!milestones || milestones.length === 0) return null;
    
    const portfolioMilestones = milestones
      .filter(m => !m.accountType && !m.isCompleted)
      .sort((a, b) => Number(a.targetValue) - Number(b.targetValue));
    
    return portfolioMilestones.find(m => Number(m.targetValue) > totalPortfolioValue);
  };
  
  const nextMilestone = getNextMilestone();
  
  // Calculate total gain across all accounts
  const calculateTotalGain = () => {
    // In a real app, this would compare to previous values
    // For now, let's assume a 3.8% gain for demo
    const gain = totalPortfolioValue * 0.038;
    return displayInPercentage ? "+3.8%" : `+£${gain.toLocaleString()}`;
  };

  return (
    <div className="portfolio-screen max-w-5xl mx-auto px-4 pb-20">
      {/* Chart Section */}
      <PortfolioChart 
        className="mt-4" 
        showMilestones={showMilestones}
        nextMilestone={nextMilestone ? Number(nextMilestone.targetValue) : undefined}
      />

      {/* Portfolio Accounts List */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-200 rounded-lg">
                <button 
                  className={`text-sm font-medium py-1 px-3 rounded-lg ${!displayInPercentage ? 'bg-primary text-white' : ''}`}
                  onClick={() => setDisplayInPercentage(false)}
                >
                  £
                </button>
                <button 
                  className={`text-sm font-medium py-1 px-3 rounded-lg ${displayInPercentage ? 'bg-primary text-white' : ''}`}
                  onClick={() => setDisplayInPercentage(true)}
                >
                  %
                </button>
              </div>
              
              <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Investment Account</DialogTitle>
                    <DialogDescription>
                      Enter the details of your investment account below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Trading 212">Trading 212</SelectItem>
                                <SelectItem value="Vanguard">Vanguard</SelectItem>
                                <SelectItem value="InvestEngine">InvestEngine</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ISA">ISA</SelectItem>
                                <SelectItem value="SIPP">SIPP</SelectItem>
                                <SelectItem value="LISA">LISA</SelectItem>
                                <SelectItem value="GIA">GIA</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Value (£)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">Add Account</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            // Skeleton loading state for accounts
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border-b border-gray-200 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Skeleton className="w-10 h-10 rounded-md mr-3" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 mb-4">No investment accounts added yet.</p>
              <Button 
                onClick={() => setIsAddAccountOpen(true)}
                className="bg-primary text-white"
              >
                Add Your First Account
              </Button>
            </div>
          ) : (
            // List of accounts
            <>
              {accounts.map((account) => (
                <div key={account.id} className="border-b border-gray-200 py-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                        {getProviderLogo(account.provider)}
                      </div>
                      <div>
                        <h3 className="font-medium">{account.provider}</h3>
                        <span className={`text-sm ${getAccountTypeColor(account.accountType)}`}>
                          {account.accountType}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">£{Number(account.currentValue).toLocaleString()}</p>
                      <p className="text-sm text-secondary font-medium">
                        {displayInPercentage ? "+3.2%" : `+£${(Number(account.currentValue) * 0.032).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals Row */}
              <div className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Total Portfolio</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">£{totalPortfolioValue.toLocaleString()}</p>
                    <p className="text-secondary font-medium">{calculateTotalGain()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  Last updated on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • 
                  <Button 
                    variant="link" 
                    className="text-primary font-medium p-0 ml-1"
                    onClick={() => setActiveSection("record")}
                  >
                    Update Now
                  </Button>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
