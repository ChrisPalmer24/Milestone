import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import PortfolioChart from "@/components/ui/charts/PortfolioChart";
import DateRangeBar from "@/components/layout/DateRangeBar";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";
import { getNextMilestone } from "@/lib/utils/milestones";
import AddAccountDialogue from "@/components/account/AddAccountDialogue";
import { BrokerProviderAssetOrphanInsert } from "shared/schema";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";

import {
  getDateRange,
  DateRangeOption,
} from "@/components/ui/DateRangeControl";
import { useBrokerProviders } from "@/hooks/use-broker-providers";
import { getProviderName } from "@/lib/broker";

function Portfolio() {
  const { dateRange } = useDateRange();

  const { start: startDate, end: endDate } = useMemo(() => {
    return getDateRange(dateRange as DateRangeOption);
  }, [dateRange]);

  const { data: brokerProviders, isLoading: isLoadingBrokerProviders } =
    useBrokerProviders();

  const [, setLocation] = useLocation();
  const {
    brokerAssets,
    milestones,
    deleteBrokerAsset,
    isLoading,
    addBrokerAsset,
    portfolioOverview,
  } = usePortfolio(startDate, endDate);

  const { toast } = useToast();

  // Get start and end dates based on the selected date range

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [displayInPercentage, setDisplayInPercentage] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Helper to get logo for provider
  const getProviderLogo = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case "trading 212":
      case "trading212":
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path 
              d="M2 4V20H22V4H2ZM19.5 17.5H4.5V6.5H19.5V17.5Z" 
              fill="#0061FF"
            />
            <path 
              d="M9 8.5L7 15.5H8.5L10.5 8.5H9Z" 
              fill="#0061FF"
            />
            <path 
              d="M11 8.5L13 15.5H11.5L9.5 8.5H11Z" 
              fill="#0061FF"
            />
            <path 
              d="M14 8.5L12 15.5H13.5L15.5 8.5H14Z" 
              fill="#0061FF"
            />
            <path 
              d="M16 8.5L18 15.5H16.5L14.5 8.5H16Z" 
              fill="#0061FF"
            />
          </svg>
        );
      case "vanguard":
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <path 
              d="M4 17L8 7H16L20 17H16L12 7L8 17H4Z" 
              fill="#BD0008"
            />
            <path 
              d="M8 17L12 7L16 17H8Z" 
              fill="#BD0008" 
              fillOpacity="0.6"
            />
          </svg>
        );
      case "invest engine":
      case "investengine":
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#FF7022"/>
            <path 
              d="M7 12H17" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M7 8H17" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M7 16H13" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        );
      case "hargreaves lansdown":
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <rect x="3" y="3" width="18" height="18" rx="9" fill="#00417D"/>
            <path 
              d="M8 12.5H16" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M10 8H14" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M12 16H16" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M8 16H10" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        );
      case "aj bell":
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="#00274C"/>
            <path 
              d="M7 13L10 7H14L17 13L14 19H10L7 13Z" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="2" stroke="white" strokeWidth="1.5"/>
          </svg>
        );
      default:
        // Default generic investment logo
        return (
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              fill="#0061FF"
              fillOpacity="0.8"
            />
            <path
              d="M7 17L10 12L13 14L17 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="7"
              cy="17"
              r="1"
              fill="white"
            />
            <circle
              cx="10"
              cy="12"
              r="1"
              fill="white"
            />
            <circle
              cx="13"
              cy="14"
              r="1"
              fill="white"
            />
            <circle
              cx="17"
              cy="7"
              r="1"
              fill="white"
            />
          </svg>
        );
    }
  };

  // Get color for account type
  const getAccountTypeColor = (type: string) => {
    // Return black for all account types
    return "text-black font-semibold";
  };

  // Find next milestone for the portfolio if any
  const nextMilestone = getNextMilestone(
    milestones ?? [],
    portfolioOverview?.value ?? 0
  );

  const onSubmit = async (values: BrokerProviderAssetOrphanInsert) => {
    try {
      setIsAddingAccount(true);
      await addBrokerAsset.mutateAsync(values);
      setIsAddAccountOpen(false);
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

  console.log("portfolioOverview", portfolioOverview);
  console.log("brokerAssets", brokerAssets);

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
                          await deleteBrokerAsset.mutateAsync(accountToDelete);
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
              {brokerAssets.length > 0 && (
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
              <AddAccountDialogue
                open={isAddAccountOpen}
                onOpenChange={setIsAddAccountOpen}
                inProgress={isAddingAccount}
                onSubmit={onSubmit}
              />
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
          ) : brokerAssets.length === 0 ? (
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
              {brokerAssets.map((asset) => {
                const providerName = getProviderName(
                  asset.providerId,
                  brokerProviders ?? []
                );
                return (
                  <div
                    key={asset.id}
                    className="border-b border-gray-200 py-3 cursor-pointer hover:bg-gray-50 transition-colors relative"
                    onClick={(e) => {
                      if (!isEditMode) {
                        setLocation(`/asset/broker/${asset.id}`);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-md flex items-center justify-center mr-3">
                          {getProviderLogo(providerName)}
                        </div>
                        <div>
                          <h3 className="font-medium">{providerName}</h3>
                          <span
                            className={`text-sm ${getAccountTypeColor(
                              asset.accountType
                            )}`}
                          >
                            {asset.accountType === "LISA"
                              ? "Lifetime ISA"
                              : asset.accountType === "GIA"
                              ? "General Account"
                              : asset.accountType === "CISA"
                              ? "Cash ISA"
                              : asset.accountType}
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
                              setAccountToDelete(asset.id);
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                        <div className="text-right">
                          <p className="font-semibold">
                            £{Number(asset.currentValue).toLocaleString()}
                          </p>
                          {asset.accountChange ? (
                            <p
                              className={`text-sm font-medium ${
                                (displayInPercentage
                                  ? asset.accountChange.percentageChange
                                  : asset.accountChange.currencyChange) >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {displayInPercentage ? (
                                <>
                                  {asset.accountChange.percentageChange >= 0
                                    ? "+"
                                    : ""}
                                  {asset.accountChange.percentageChange.toFixed(
                                    1
                                  )}
                                  %
                                </>
                              ) : (
                                <>
                                  {asset.accountChange.currencyChange >= 0
                                    ? "+"
                                    : ""}
                                  £
                                  {Math.abs(
                                    asset.accountChange.currencyChange
                                  ).toLocaleString()}
                                </>
                              )}
                            </p>
                          ) : (
                            <p className="text-gray-500">No change</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Portfolio Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Portfolio Total</h3>
                  </div>
                  <div className="text-right">
                    {portfolioOverview ? (
                      <>
                        <p className="font-bold text-lg">
                          £{portfolioOverview.value.toLocaleString()}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            portfolioOverview.percentageChange >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {displayInPercentage ? (
                            <>
                              {portfolioOverview.percentageChange >= 0
                                ? "+"
                                : ""}
                              {portfolioOverview.percentageChange.toFixed(1)}%
                            </>
                          ) : (
                            <>
                              {portfolioOverview.currencyChange >= 0 ? "+" : ""}
                              £
                              {Math.abs(
                                portfolioOverview.currencyChange
                              ).toLocaleString()}
                            </>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-lg">
                        Loading portfolio total...
                      </p>
                    )}
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

export default function PortfolioWithRangeProvider() {
  return (
    <DateRangeProvider>
      <Portfolio />
    </DateRangeProvider>
  );
}
