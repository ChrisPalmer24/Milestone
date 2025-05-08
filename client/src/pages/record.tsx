import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Edit, Check, X } from "lucide-react";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import { usePortfolio } from "@/context/PortfolioContext";
import { useToast } from "@/hooks/use-toast";
import DateRangeBar from "@/components/layout/DateRangeBar";
import { getProviderName } from "@/lib/broker";
import { BrokerProviderAsset, AssetValue } from "shared/schema";
import { useBrokerProviders } from "@/hooks/use-broker-providers";
type AccountFormData = {
  [key: string]: number | undefined;
};

const assetWithValeGuard = (
  formValue: [string, number | undefined]
): formValue is [string, number] => {
  return formValue[1] !== undefined && !isNaN(formValue[1]);
};

export default function Record() {
  const {
    addBrokerAssetValue,
    isLoading,
    updateBrokerAssetValue,
    brokerAssets,
  } = usePortfolio();

  const { data: brokerProviders } = useBrokerProviders();
  
  // Helper to get logo for provider
  const getProviderLogo = (providerName: string) => {
    switch (providerName.toLowerCase()) {
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

  const { toast } = useToast();
  const [accountValues, setAccountValues] = useState<AccountFormData>({});
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [updatingAccounts, setUpdatingAccounts] = useState<string[]>([]);
  
  // Initialize values with current values button
  const initializeWithCurrentValues = () => {
    const initialValues: AccountFormData = {};
    brokerAssets.forEach(asset => {
      initialValues[asset.id] = Number(asset.currentValue);
    });
    setAccountValues(initialValues);
  };

  // History dialog states
  const [editHistoryRecord, setEditHistoryRecord] = useState<AssetValue | null>(
    null
  );
  const [editValue, setEditValue] = useState<string>("");

  // Find account name by ID
  const getAssetName = (assetId: string) => {
    const asset = brokerAssets.find((acc) => acc.id === assetId);

    return asset
      ? `${getProviderName(asset.providerId, brokerProviders ?? [])} (${
          asset.assetType
        })`
      : "Unknown Account";
  };

  // Start editing a history record
  const handleEditRecord = (record: AssetValue) => {
    setEditHistoryRecord(record);
    setEditValue(record.value.toString());
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditHistoryRecord(null);
    setEditValue("");
  };

  console.log("brokerAssets", brokerAssets);

  // Save edited record
  const handleSaveEdit = async () => {
    if (!editHistoryRecord) return;

    try {
      // Use the updateAccountHistory function to update the record
      await updateBrokerAssetValue.mutateAsync({
        assetId: editHistoryRecord.assetId,
        value: Number(editValue),
        recordedAt: new Date(editHistoryRecord.recordedAt),
        historyId: editHistoryRecord.id,
      });

      setEditHistoryRecord(null);
      setEditValue("");
    } catch (error) {
      console.error("Error updating history record:", error);
      toast({
        title: "Error",
        description: "Failed to update history record. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle input change for account values
  const handleAccountValueChange = (assetId: string, value: string) => {
    setAccountValues((prev) => ({
      ...prev,
      [assetId]: value === "" ? undefined : Number(value),
    }));
  };

  // Handle form submission for a single account
  const handleSubmitAccount = async (assetId: string) => {
    const value = accountValues[assetId];

    if (!value || !date) {
      toast({
        title: "Missing information",
        description: "Please enter a value for this account",
        variant: "destructive",
      });
      return;
    }

    setUpdatingAccounts((prev) => [...prev, assetId]);

    try {
      await addBrokerAssetValue.mutateAsync({
        assetId,
        value,
        recordedAt: new Date(date),
      });

      toast({
        title: "Value recorded",
        description: "Account value has been updated successfully",
      });

      // Clear the value for this account
      setAccountValues((prev) => {
        const newValues = { ...prev };
        delete newValues[assetId];
        return newValues;
      });
    } catch (error) {
      console.error("Error recording value:", error);
      toast({
        title: "Error",
        description: "Failed to record value. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAccounts((prev) => prev.filter((id) => id !== assetId));
    }
  };

  const getFullAssetName = (asset: BrokerProviderAsset) => {
    return `${getProviderName(asset.providerId, brokerProviders ?? [])} (${
      asset.accountType
    })`;
  };

  // Handle submission of all accounts at once
  const handleSubmitAll = async () => {
    const dataWithValues: [string, number][] =
      Object.entries(accountValues).filter(assetWithValeGuard);

    const accountsToUpdate = dataWithValues.map(([id, value]) => ({
      assetId: id,
      value: value,
      recordedAt: new Date(date),
    }));

    if (accountsToUpdate.length === 0) {
      toast({
        title: "No values to update",
        description: "Please enter at least one account value",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await Promise.all(
        accountsToUpdate.map(async (accountData) => {
          await addBrokerAssetValue.mutateAsync(accountData);
        })
      );

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
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="record-screen max-w-5xl mx-auto px-4 pb-20">
      {/* Date Range Control */}
      <DateRangeBar className="mt-4 rounded-lg" />

      <Card className="mt-4">
        <CardHeader className="relative">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">
                Record Account Values
              </CardTitle>
              <CardDescription className="mt-1">
                Update the value of your accounts to keep track of your investments.
              </CardDescription>
            </div>
            <div className="flex items-center">
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-32 py-1 px-1 border border-gray-300 rounded-md shadow-sm text-sm text-center"
                style={{ textAlign: "center" }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {brokerAssets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                You don't have any accounts yet. Add accounts in the Portfolio
                section.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="space-y-4">
                {[...brokerAssets]
                  .sort(
                    (a, b) => Number(b.currentValue) - Number(a.currentValue)
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 border rounded-lg bg-card"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                        {/* Column 1: Provider Logo and Information */}
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                            {getProviderLogo(getProviderName(asset.providerId, brokerProviders ?? []))}
                          </div>
                          <div>
                            <h3 className="font-medium">{getProviderName(asset.providerId, brokerProviders ?? [])}</h3>
                            <span className={`text-sm ${getAccountTypeColor(asset.accountType)}`}>
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

                        {/* Column 2: New Value Input */}
                        <div className="flex items-center justify-end">
                          <div className="relative md:w-1/3 w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">£</span>
                            </div>
                            <Input
                              type="number"
                              className="pl-7"
                              placeholder={`${Number(asset.currentValue).toLocaleString()}`}
                              value={accountValues[asset.id] || ""}
                              onChange={(e) =>
                                handleAccountValueChange(
                                  asset.id,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSubmitAll}
                    disabled={
                      submitting ||
                      isLoading ||
                      Object.keys(accountValues).length === 0
                    }
                    className="md:w-1/3 w-full bg-black hover:bg-gray-800 text-white"
                  >
                    {submitting ? (
                      <>
                        <span className="mr-2">Updating...</span>
                        <span className="animate-spin">⏳</span>
                      </>
                    ) : (
                      "Update Portfolio"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Regularly updating your account values helps you track your
              progress and keeps your portfolio data accurate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
