import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import PortfolioChart from "@/components/ui/charts/PortfolioChart";
import DateRangeBar from "@/components/layout/DateRangeBar";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";
import { getNextMilestone } from "@/lib/utils/milestones";
import { calculateAccountChange } from "@/lib/utils/performance";

// Form schema for adding a new account
const accountSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  accountType: z.string().min(1, "Account type is required"),
  currentValue: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Value must be a positive number",
    }),
});

export default function Portfolio() {
  const [, setLocation] = useLocation();
  const {
    accounts,
    accountsHistory: accountHistory,
    milestones,
    totalPortfolioValue,
    addAccount,
    deleteAccount,
    isLoading,
  } = usePortfolio();
  const { toast } = useToast();

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [displayInPercentage, setDisplayInPercentage] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // State to track the selected provider for conditional account type display
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Memoize accounts with their percentage changes and portfolio totals
  const { accountsWithPerformance, portfolioTotal } = useMemo(() => {
    const accountsWithPct = accounts.map((account) => {
      const accountHistoryData = accountHistory.find(
        (h) => h.accountId === account.id
      );
      const history = accountHistoryData?.history || [];
      const { currency: absoluteChange, percentage: totalPercentageChange } =
        calculateAccountChange(history);

      return {
        ...account,
        totalPercentageChange,
        absoluteChange,
      };
    });

    // Sort accounts from largest to smallest balance
    const sortedAccounts = [...accountsWithPct].sort(
      (a, b) => Number(b.currentValue) - Number(a.currentValue)
    );

    const totalValue = sortedAccounts.reduce(
      (sum, account) => sum + Number(account.currentValue),
      0
    );
    const totalPercentageChange = sortedAccounts.reduce(
      (sum, account) => sum + account.totalPercentageChange,
      0
    );
    const totalCurrencyChange = sortedAccounts.reduce(
      (sum, account) => sum + account.absoluteChange,
      0
    );

    return {
      accountsWithPerformance: sortedAccounts,
      portfolioTotal: {
        value: totalValue,
        percentageChange: totalPercentageChange,
        currencyChange: totalCurrencyChange,
      },
    };
  }, [accounts, accountHistory]);

  // Form for adding a new account
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      provider: "",
      accountType: "",
      currentValue: "",
    },
  });

  // Watch for changes to the provider field
  const watchProvider = form.watch("provider");

  // Update the selected provider when it changes
  useEffect(() => {
    setSelectedProvider(watchProvider);
  }, [watchProvider]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    try {
      setIsAddingAccount(true);
      await addAccount({
        provider: values.provider,
        accountType: values.accountType as any,
        currentValue: values.currentValue,
      });
      setIsAddAccountOpen(false);
      form.reset();
      toast({
        title: "Account added successfully",
        description:
          "Your new investment account has been added to your portfolio.",
      });
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        title: "Error adding account",
        description:
          "There was a problem adding your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAccount(false);
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
      case "hargreaves lansdown":
        return <BsPiggyBank className="w-6 h-6" />;
      case "aj bell":
        return <SiCoinbase className="w-6 h-6" />;
      default:
        return <SiTradingview className="w-6 h-6" />;
    }
  };

  // Get color for account type
  const getAccountTypeColor = (type: string) => {
    // Return black for all account types
    return "text-black font-semibold";
  };

  // Find next milestone for the portfolio if any
  const nextMilestone = getNextMilestone(milestones ?? [], totalPortfolioValue);

  // Calculate total gain across all accounts
  const calculateTotalGain = () => {
    // In a real app, this would compare to previous values
    // For now, let's randomly show either gain or loss for demo
    const isPositive = Math.random() > 0.3;
    const gainPercentage = isPositive ? 0.038 : -0.021;
    const gain = totalPortfolioValue * Math.abs(gainPercentage);

    return {
      value: displayInPercentage
        ? `${isPositive ? "+" : "-"}${Math.abs(gainPercentage * 100).toFixed(
            1
          )}%`
        : `${isPositive ? "+" : "-"}£${gain.toLocaleString()}`,
      isPositive,
    };
  };

  return (
    <div className="portfolio-screen max-w-5xl mx-auto px-4 pb-20">
      {/* Date Range Control */}
      <DateRangeBar className="mt-4 rounded-lg" />

      {/* Chart Section */}
      <PortfolioChart
        className="mt-4"
        showMilestones={showMilestones}
        nextMilestone={
          nextMilestone ? Number(nextMilestone.targetValue) : undefined
        }
      />

      {/* Portfolio Accounts List */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-200 rounded-lg shadow-md">
                <button
                  className={`text-sm font-medium py-1 px-3 rounded-lg transition-all ${
                    !displayInPercentage
                      ? "bg-white text-black shadow-inner"
                      : "hover:bg-gray-300"
                  }`}
                  onClick={() => setDisplayInPercentage(false)}
                >
                  £
                </button>
                <button
                  className={`text-sm font-medium py-1 px-3 rounded-lg transition-all ${
                    displayInPercentage
                      ? "bg-white text-black shadow-inner"
                      : "hover:bg-gray-300"
                  }`}
                  onClick={() => setDisplayInPercentage(true)}
                >
                  %
                </button>
              </div>

              {/* Delete Account Alert Dialog */}
              <AlertDialog
                open={!!accountToDelete}
                onOpenChange={(open) => !open && setAccountToDelete(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all data associated with this investment
                      account, are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={async () => {
                        if (accountToDelete) {
                          await deleteAccount(accountToDelete);
                          setAccountToDelete(null);
                          setIsEditMode(false);
                        }
                      }}
                    >
                      Yes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Edit Mode Toggle Button - Only shown when accounts exist */}
              {accounts.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full w-10 h-10 flex items-center justify-center ${
                    isEditMode
                      ? "bg-blue-100 border-blue-300 text-blue-600"
                      : "text-primary"
                  }`}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              )}

              {/* Add Account Dialog */}
              <Dialog
                open={isAddAccountOpen}
                onOpenChange={setIsAddAccountOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-10 h-10 flex items-center justify-center bg-black text-white border-black"
                  >
                    <Plus className="h-5 w-5" />
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
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
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
                                <SelectItem value="Trading 212">
                                  Trading 212
                                </SelectItem>
                                <SelectItem value="Vanguard">
                                  Vanguard
                                </SelectItem>
                                <SelectItem value="InvestEngine">
                                  InvestEngine
                                </SelectItem>
                                <SelectItem value="Hargreaves Lansdown">
                                  Hargreaves Lansdown
                                </SelectItem>
                                <SelectItem value="AJ Bell">AJ Bell</SelectItem>
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
                                {(selectedProvider === "Hargreaves Lansdown" ||
                                  selectedProvider === "AJ Bell") && (
                                  <SelectItem value="LISA">
                                    Lifetime ISA
                                  </SelectItem>
                                )}
                                <SelectItem value="GIA">
                                  General Account
                                </SelectItem>
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
                        <Button type="submit" disabled={isAddingAccount}>
                          {isAddingAccount ? (
                            <>
                              <span className="mr-2">Adding...</span>
                              <span className="animate-spin">⏳</span>
                            </>
                          ) : (
                            "Add Account"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            // Skeleton loading state for accounts
            Array(3)
              .fill(0)
              .map((_, i) => (
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
              <p className="text-gray-500 mb-4">
                No investment accounts added yet.
              </p>
              <Button
                onClick={() => setIsAddAccountOpen(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                Add Your First Account
              </Button>
            </div>
          ) : (
            // List of accounts
            <>
              {accountsWithPerformance.map((account) => (
                <div
                  key={account.id}
                  className="border-b border-gray-200 py-3 cursor-pointer hover:bg-gray-50 transition-colors relative"
                  onClick={(e) => {
                    if (!isEditMode) {
                      setLocation(`/account/${account.id}`);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                        {getProviderLogo(account.provider)}
                      </div>
                      <div>
                        <h3 className="font-medium">{account.provider}</h3>
                        <span
                          className={`text-sm ${getAccountTypeColor(
                            account.accountType
                          )}`}
                        >
                          {account.accountType === "LISA"
                            ? "Lifetime ISA"
                            : account.accountType === "GIA"
                            ? "General Account"
                            : account.accountType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {isEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccountToDelete(account.id);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                      <div className="text-right">
                        <p className="font-semibold">
                          £{Number(account.currentValue).toLocaleString()}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            (displayInPercentage
                              ? account.totalPercentageChange
                              : account.absoluteChange) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {displayInPercentage ? (
                            <>
                              {account.totalPercentageChange >= 0 ? "+" : ""}
                              {account.totalPercentageChange.toFixed(1)}%
                            </>
                          ) : (
                            <>
                              {account.absoluteChange >= 0 ? "+" : ""}£
                              {Math.abs(
                                account.absoluteChange
                              ).toLocaleString()}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Portfolio Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Portfolio Total</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      £{portfolioTotal.value.toLocaleString()}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        portfolioTotal.percentageChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {displayInPercentage ? (
                        <>
                          {portfolioTotal.percentageChange >= 0 ? "+" : ""}
                          {portfolioTotal.percentageChange.toFixed(1)}%
                        </>
                      ) : (
                        <>
                          {portfolioTotal.currencyChange >= 0 ? "+" : ""}£
                          {Math.abs(
                            portfolioTotal.currencyChange
                          ).toLocaleString()}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  Last updated on{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  •
                  <Button
                    variant="link"
                    className="text-primary font-medium p-0 ml-1"
                    onClick={() => setLocation("/record")}
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
