import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import { usePortfolio } from "@/context/PortfolioContext";
import { AssetValue, BrokerProviderAsset } from "shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getProviderName } from "@/lib/broker";
import { useBrokerProviders } from "@/hooks/use-broker-providers";

// Form schema for history entry
const historySchema = z.object({
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Value must be a positive number",
  }),
  recordedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
});

export default function AccountPage() {
  const params = useParams();
  const assetId: BrokerProviderAsset["id"] | undefined = params?.id;

  const {
    addBrokerAssetValue,
    updateBrokerAssetValue,
    deleteBrokerAssetValue,
  } = usePortfolio();

  const { data: providers, isLoading: isProvidersLoading } =
    useBrokerProviders();

  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [historyToEdit, setHistoryToEdit] = useState<any>(null);

  const {
    data: asset,
    isLoading: isAssetLoading,
    isError: isAssetError,
    error: assetError,
  } = useQuery<BrokerProviderAsset>({
    queryKey: ["broker-asset", assetId],
    queryFn: () =>
      apiRequest<BrokerProviderAsset>("GET", `/api/assets/broker/${assetId}`),
  });

  console.log("assetError", assetError);
  console.log("asset", asset);

  const { data: history, isLoading: isHistoryLoading } = useQuery<AssetValue[]>(
    {
      queryKey: ["broker-asset-history", assetId],
      queryFn: () =>
        apiRequest<AssetValue[]>(
          "GET",
          `/api/assets/broker/${assetId}/history`
        ),
    }
  );

  // Form for adding/editing history
  const form = useForm<z.infer<typeof historySchema>>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      value: "",
      recordedAt: new Date().toISOString().split("T")[0],
    },
  });

  const handleCreateHistory = async (values: z.infer<typeof historySchema>) => {
    if (!assetId) return;

    try {
      await addBrokerAssetValue.mutateAsync({
        assetId: assetId,
        value: Number(values.value),
        recordedAt: new Date(values.recordedAt),
      });
      setIsAddHistoryOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating history:", error);
    }
  };

  const handleEditHistory = async (values: z.infer<typeof historySchema>) => {
    if (!historyToEdit || !assetId) return;
    try {
      await updateBrokerAssetValue.mutateAsync({
        historyId: historyToEdit.id,
        assetId: assetId,
        value: Number(values.value),
        recordedAt: new Date(values.recordedAt),
      });
      setIsEditHistoryOpen(false);
      form.reset();
      setHistoryToEdit(null);
    } catch (error) {
      console.error("Error updating history:", error);
    }
  };

  const handleDeleteHistory = async () => {
    if (!historyToDelete) return;

    try {
      if (!assetId) return;
      await deleteBrokerAssetValue.mutateAsync({
        assetId: assetId,
        historyId: historyToDelete,
      });
      setHistoryToDelete(null);
    } catch (error) {
      console.error("Error deleting history:", error);
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

  if (isAssetLoading || isHistoryLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-6">
              <Skeleton className="w-10 h-10 rounded-md mr-3" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-center text-gray-500">Account not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-4">
          {/* Account Header */}
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
              {getProviderLogo(
                getProviderName(asset.providerId, providers ?? [])
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {getProviderName(asset.providerId, providers ?? [])}
              </h1>
              <span className="text-sm text-gray-600">
                {asset.accountType === "LISA"
                  ? "Lifetime ISA"
                  : asset.accountType === "GIA"
                  ? "General Account"
                  : asset.accountType}
              </span>
            </div>
          </div>

          {/* Current Value */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Current Value</h2>
            <p className="text-2xl font-bold">
              £{Number(asset.currentValue).toLocaleString()}
            </p>
          </div>

          {/* History Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">History</h2>
              <Dialog
                open={isAddHistoryOpen}
                onOpenChange={setIsAddHistoryOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add History Entry</DialogTitle>
                    <DialogDescription>
                      Add a new value record for this account.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleCreateHistory)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter value"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recordedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit">Add Entry</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* History List */}
            <div className="space-y-4">
              {history?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      £{Number(entry.value).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(entry.recordedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setHistoryToEdit(entry);
                        form.reset({
                          value: entry.value.toString(),
                          recordedAt: new Date(entry.recordedAt)
                            .toISOString()
                            .split("T")[0],
                        });
                        setIsEditHistoryOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setHistoryToDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit History Dialog */}
      <Dialog open={isEditHistoryOpen} onOpenChange={setIsEditHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit History Entry</DialogTitle>
            <DialogDescription>
              Update the value and date of this history entry.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEditHistory)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recordedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Update Entry</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!historyToDelete}
        onOpenChange={() => setHistoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this history entry? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHistory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
