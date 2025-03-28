import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown,
  Link as LinkIcon,
  Check, 
  Lock
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export default function Record() {
  const { 
    accounts, 
    updateAccountValue,
    connectAccountApi,
    isLoading 
  } = usePortfolio();
  const { toast } = useToast();
  
  // State to track new values
  const [newValues, setNewValues] = useState<Record<number, number>>({});
  // State for API connection dialog
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  
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
  
  // Handle input change
  const handleValueChange = (accountId: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setNewValues({
        ...newValues,
        [accountId]: numValue
      });
    }
  };
  
  // Calculate difference between current and new value
  const calculateDifference = (accountId: number, currentValue: number) => {
    const newValue = newValues[accountId];
    if (newValue === undefined) return null;
    
    const difference = newValue - currentValue;
    const percentChange = ((difference / currentValue) * 100).toFixed(1);
    
    return {
      difference,
      percentChange,
      isPositive: difference >= 0
    };
  };
  
  // Check if account is Trading212
  const isTrading212 = (provider: string) => {
    return provider.toLowerCase() === "trading212" || provider.toLowerCase() === "trading 212";
  };
  
  // Open API connect dialog
  const openApiDialog = (accountId: number) => {
    setSelectedAccountId(accountId);
    setApiKey("");
    setApiDialogOpen(true);
  };
  
  // Handle API connection
  const handleConnectApi = async () => {
    if (!selectedAccountId || !apiKey.trim()) return;
    
    try {
      await connectAccountApi(selectedAccountId, apiKey);
      setApiDialogOpen(false);
      toast({
        title: "API Connected",
        description: "Your Trading212 account has been connected successfully. Values will now update automatically.",
      });
    } catch (error) {
      toast({
        title: "Error connecting API",
        description: "There was a problem connecting to the Trading212 API. Please check your API key and try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle save records
  const handleSaveRecords = async () => {
    const updates = Object.entries(newValues).map(async ([accountId, value]) => {
      try {
        await updateAccountValue(parseInt(accountId), value);
      } catch (error) {
        console.error(`Error updating account ${accountId}:`, error);
        throw error;
      }
    });
    
    try {
      await Promise.all(updates);
      setNewValues({});
      toast({
        title: "Records saved",
        description: "Your investment values have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving records",
        description: "There was a problem updating your investment values.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="record-screen max-w-5xl mx-auto px-4 pb-20">
      <Card className="mt-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-5 text-center">How's the portfolio looking?</h2>

          <div className="space-y-5">
            {isLoading ? (
              // Skeleton loading state
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-md mr-3" />
                      <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <div className="flex-1 max-w-[220px] ml-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))
            ) : accounts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 mb-4">No investment accounts to update.</p>
                <Link href="/">
                  <Button variant="outline">
                    Add Accounts First
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {accounts.map((account) => {
                  const difference = calculateDifference(account.id, Number(account.currentValue));
                  const isTrading212Account = isTrading212(account.provider);
                  
                  return (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                            {getProviderLogo(account.provider)}
                          </div>
                          <div>
                            <h3 className="font-medium">{account.provider}</h3>
                            <span className="text-sm text-gray-500">{account.accountType}</span>
                            
                            {/* API connection status for Trading212 */}
                            {isTrading212Account && (
                              <div className="flex items-center mt-1">
                                {account.isApiConnected ? (
                                  <div className="flex items-center text-green-600 text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    <span>API Connected</span>
                                  </div>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs p-0 h-auto text-primary font-normal hover:underline"
                                    onClick={() => openApiDialog(account.id)}
                                  >
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    <span>Connect API</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 max-w-[220px] ml-4">
                          <Label htmlFor={`value-${account.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Current Value
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">£</span>
                            </div>
                            <Input
                              id={`value-${account.id}`}
                              type="number"
                              className="pl-7"
                              defaultValue={Number(account.currentValue)}
                              onChange={(e) => handleValueChange(account.id, e.target.value)}
                              readOnly={isTrading212Account && account.isApiConnected}
                            />
                            {isTrading212Account && account.isApiConnected && (
                              <div className="absolute inset-y-0 right-3 flex items-center">
                                <Lock className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {isTrading212Account && account.isApiConnected && (
                            <p className="text-xs text-gray-500 mt-1">
                              Values updated automatically via API
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mb-2">
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          Previous Value: £{Number(account.currentValue).toLocaleString()}
                        </Label>
                        {difference && (
                          <div className={`flex items-center text-sm ${difference.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {difference.isPositive ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            <span>
                              {difference.isPositive ? '+' : ''}
                              £{difference.difference.toLocaleString()} ({difference.isPositive ? '+' : ''}
                              {difference.percentChange}%)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          Last updated: {new Date(account.updatedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-8 flex space-x-4">
                  <Button 
                    variant="outline"
                    className="w-1/2"
                    onClick={() => setNewValues({})}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="w-1/2 bg-primary text-white"
                    onClick={handleSaveRecords}
                    disabled={Object.keys(newValues).length === 0}
                  >
                    Save Records
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Trading212 API Connection Dialog */}
      <Dialog open={apiDialogOpen} onOpenChange={setApiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Trading212 API</DialogTitle>
            <DialogDescription>
              Enter your Trading212 API key to automatically sync your account values.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-sm">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Trading212 API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Your API key is stored securely and only used to fetch your account values.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectApi} disabled={!apiKey.trim()}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
