import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Coins, Calendar, RotateCcw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SiTradingview, SiCoinbase } from "react-icons/si";
import { BsPiggyBank } from "react-icons/bs";
import { usePortfolio } from "@/context/PortfolioContext";
import { AssetValue, AssetDebit, BrokerProviderAsset, RecurringContribution } from "shared/schema";
import { getProviderName } from "@/lib/broker";
import { useBrokerProviders } from "@/hooks/use-broker-providers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Form schema for history entry
const historySchema = z.object({
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Value must be a positive number",
  }),
  recordedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
});

// Form schema for contribution entry (same structure)
const contributionSchema = z.object({
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Value must be a positive number",
  }),
  recordedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
});

// Form schema for recurring contribution
const recurringContributionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  interval: z.enum(["weekly", "biweekly", "monthly"], {
    required_error: "Interval is required",
  }),
  isActive: z.boolean().default(true),
});

export default function AccountPage() {
  const params = useParams();
  const assetId: BrokerProviderAsset["id"] | undefined = params?.id;

  const {
    addBrokerAssetValue,
    updateBrokerAssetValue,
    deleteBrokerAssetValue,
    addBrokerAssetContribution,
    updateBrokerAssetContribution,
    deleteBrokerAssetContribution,
  } = usePortfolio();
  
  // Mutations for recurring contributions
  const addRecurringContribution = useMutation({
    mutationFn: (data: { assetId: string, amount: number, startDate: Date, interval: "weekly" | "biweekly" | "monthly", isActive: boolean }) => 
      apiRequest("POST", `/api/assets/broker/${data.assetId}/recurring-contributions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-asset-recurring-contributions", assetId] });
    }
  });
  
  const updateRecurringContribution = useMutation({
    mutationFn: (data: { assetId: string, contributionId: string, amount: number, startDate: Date, interval: "weekly" | "biweekly" | "monthly", isActive: boolean }) => 
      apiRequest("PUT", `/api/assets/broker/${data.assetId}/recurring-contributions/${data.contributionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-asset-recurring-contributions", assetId] });
    }
  });
  
  const deleteRecurringContribution = useMutation({
    mutationFn: (data: { assetId: string, contributionId: string }) => 
      apiRequest("DELETE", `/api/assets/broker/${data.assetId}/recurring-contributions/${data.contributionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-asset-recurring-contributions", assetId] });
    }
  });

  const { data: providers, isLoading: isProvidersLoading } =
    useBrokerProviders();

  // State for history (values) tab
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false);
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [historyToEdit, setHistoryToEdit] = useState<any>(null);
  
  // State for contributions tab
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [isEditContributionOpen, setIsEditContributionOpen] = useState(false);
  const [contributionToDelete, setContributionToDelete] = useState<string | null>(null);
  const [contributionToEdit, setContributionToEdit] = useState<any>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<"values" | "contributions" | "recurring">("values");
  
  // State for recurring contributions
  const [recurringContributions, setRecurringContributions] = useState<RecurringContribution[]>([]);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);

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
  
  // Query for asset contributions history
  const { 
    data: contributions, 
    isLoading: isContributionsLoading 
  } = useQuery<AssetDebit[]>({
    queryKey: ["broker-asset-contributions", assetId],
    queryFn: () =>
      apiRequest<AssetDebit[]>(
        "GET",
        `/api/assets/broker/${assetId}/contributions`
      ),
  });
  
  // Query for recurring contributions
  const {
    data: recurringContributionsData,
    isLoading: isRecurringLoading
  } = useQuery<RecurringContribution[]>({
    queryKey: ["broker-asset-recurring-contributions", assetId],
    queryFn: () => 
      apiRequest<RecurringContribution[]>(
        "GET", 
        `/api/assets/broker/${assetId}/recurring-contributions`
      ),
    enabled: !!assetId && activeTab === "recurring"
  });

  // Form for adding/editing history
  const form = useForm<z.infer<typeof historySchema>>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      value: "",
      recordedAt: new Date().toISOString().split("T")[0],
    },
  });
  
  // Form for adding/editing contributions
  const contributionForm = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      value: "",
      recordedAt: new Date().toISOString().split("T")[0],
    },
  });
  
  // Form for recurring contributions
  const recurringForm = useForm<z.infer<typeof recurringContributionSchema>>({
    resolver: zodResolver(recurringContributionSchema),
    defaultValues: {
      amount: "",
      startDate: new Date().toISOString().split("T")[0],
      interval: "monthly",
      isActive: true,
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
  
  // Handlers for contributions
  const handleCreateContribution = async (values: z.infer<typeof contributionSchema>) => {
    if (!assetId) return;

    try {
      await addBrokerAssetContribution.mutateAsync({
        assetId: assetId,
        value: Number(values.value),
        recordedAt: new Date(values.recordedAt),
      });
      setIsAddContributionOpen(false);
      contributionForm.reset();
    } catch (error) {
      console.error("Error creating contribution:", error);
    }
  };

  const handleEditContribution = async (values: z.infer<typeof contributionSchema>) => {
    if (!contributionToEdit || !assetId) return;
    try {
      await updateBrokerAssetContribution.mutateAsync({
        contributionId: contributionToEdit.id,
        assetId: assetId,
        value: Number(values.value),
        recordedAt: new Date(values.recordedAt),
      });
      setIsEditContributionOpen(false);
      contributionForm.reset();
      setContributionToEdit(null);
    } catch (error) {
      console.error("Error updating contribution:", error);
    }
  };

  const handleDeleteContribution = async () => {
    if (!contributionToDelete || !assetId) return;

    try {
      await deleteBrokerAssetContribution.mutateAsync({
        assetId: assetId,
        contributionId: contributionToDelete,
      });
      setContributionToDelete(null);
    } catch (error) {
      console.error("Error deleting contribution:", error);
    }
  };
  
  // State for recurring contributions modal
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [isEditRecurringOpen, setIsEditRecurringOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringContribution | null>(null);
  const [recurringToDelete, setRecurringToDelete] = useState<string | null>(null);
  
  // Handlers for recurring contributions
  const handleCreateRecurringContribution = async (values: z.infer<typeof recurringContributionSchema>) => {
    if (!assetId) return;

    try {
      await addRecurringContribution.mutateAsync({
        assetId: assetId,
        amount: Number(values.amount),
        startDate: new Date(values.startDate),
        interval: values.interval,
        isActive: values.isActive,
      });
      setIsAddRecurringOpen(false);
      recurringForm.reset();
    } catch (error) {
      console.error("Error creating recurring contribution:", error);
    }
  };

  const handleEditRecurringContribution = async (values: z.infer<typeof recurringContributionSchema>) => {
    if (!recurringToEdit || !assetId) return;
    
    try {
      await updateRecurringContribution.mutateAsync({
        contributionId: recurringToEdit.id,
        assetId: assetId,
        amount: Number(values.amount),
        startDate: new Date(values.startDate),
        interval: values.interval,
        isActive: values.isActive,
      });
      setIsEditRecurringOpen(false);
      recurringForm.reset();
      setRecurringToEdit(null);
    } catch (error) {
      console.error("Error updating recurring contribution:", error);
    }
  };

  const handleDeleteRecurringContribution = async () => {
    if (!recurringToDelete || !assetId) return;

    try {
      await deleteRecurringContribution.mutateAsync({
        assetId: assetId,
        contributionId: recurringToDelete,
      });
      setRecurringToDelete(null);
    } catch (error) {
      console.error("Error deleting recurring contribution:", error);
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

  if (isAssetLoading || isHistoryLoading || isContributionsLoading) {
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

          {/* Tabs for Values/Contributions */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "values" | "contributions")}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="values" className="flex-1">Account Values</TabsTrigger>
              <TabsTrigger value="contributions" className="flex-1">Contributions</TabsTrigger>
            </TabsList>
            
            {/* Values Tab Content */}
            <TabsContent value="values">
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
                        Add Value
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
                  {history?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No account value history available.
                    </div>
                  )}
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
            </TabsContent>
            
            {/* Contributions Tab Content */}
            <TabsContent value="contributions">
              <div>
                {/* Contribution Summary Section */}
                {contributions && contributions.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <BsPiggyBank className="h-5 w-5 mr-2 text-green-600" />
                      Contribution Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Contributed</p>
                        <p className="text-xl font-semibold">
                          £{contributions
                            .reduce((sum, item) => sum + Number(item.value), 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Number of Contributions</p>
                        <p className="text-xl font-semibold">{contributions.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">First Contribution</p>
                        <p className="text-base font-medium">
                          {contributions.length > 0
                            ? new Date(
                                Math.min(...contributions.map(c => new Date(c.recordedAt).getTime()))
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Latest Contribution</p>
                        <p className="text-base font-medium">
                          {contributions.length > 0
                            ? new Date(
                                Math.max(...contributions.map(c => new Date(c.recordedAt).getTime()))
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Contributions</h2>
                  <Dialog
                    open={isAddContributionOpen}
                    onOpenChange={setIsAddContributionOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contribution
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Contribution</DialogTitle>
                        <DialogDescription>
                          Record a new contribution to this account.
                        </DialogDescription>
                      </DialogHeader>
    
                      <Form {...contributionForm}>
                        <form
                          onSubmit={contributionForm.handleSubmit(handleCreateContribution)}
                          className="space-y-4"
                        >
                          <FormField
                            control={contributionForm.control}
                            name="value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter contribution amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
    
                          <FormField
                            control={contributionForm.control}
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
                            <Button type="submit">Add Contribution</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
    
                {/* Contributions List */}
                <div className="space-y-4">
                  {contributions?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No contributions recorded for this account.
                    </div>
                  )}
                  {contributions?.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-1 text-green-600" />
                          <p className="font-medium">
                            £{Number(contribution.value).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(contribution.recordedAt).toLocaleDateString("en-GB", {
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
                            setContributionToEdit(contribution);
                            contributionForm.reset({
                              value: contribution.value.toString(),
                              recordedAt: new Date(contribution.recordedAt)
                                .toISOString()
                                .split("T")[0],
                            });
                            setIsEditContributionOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setContributionToDelete(contribution.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Recurring Contributions Tab Content */}
            <TabsContent value="recurring">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Recurring Contributions</h3>
                  <Dialog open={isAddRecurringOpen} onOpenChange={setIsAddRecurringOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recurring
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Recurring Contribution</DialogTitle>
                        <DialogDescription>
                          Set up regular contributions to your investment account
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...recurringForm}>
                        <form
                          onSubmit={recurringForm.handleSubmit(handleCreateRecurringContribution)}
                          className="space-y-4"
                        >
                          <FormField
                            control={recurringForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount (£)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={recurringForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={recurringForm.control}
                            name="interval"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biweekly">Biweekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={recurringForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Active
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    Enable or disable this recurring contribution
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit">Add Recurring Contribution</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                      <div className="p-4">
                        <p className="text-center text-sm text-muted-foreground">
                          Recurring contributions feature is coming soon. This will allow you to 
                          automatically track regular investments to your portfolio.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="rounded-md border">
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Calendar className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p>You don't have any recurring contributions set up yet.</p>
                    <p className="mt-1">Use the "Add Recurring" button above to set one up.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
      
      {/* Edit Contribution Dialog */}
      <Dialog open={isEditContributionOpen} onOpenChange={setIsEditContributionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
            <DialogDescription>
              Update the amount and date of this contribution.
            </DialogDescription>
          </DialogHeader>

          <Form {...contributionForm}>
            <form
              onSubmit={contributionForm.handleSubmit(handleEditContribution)}
              className="space-y-4"
            >
              <FormField
                control={contributionForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter contribution amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contributionForm.control}
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
                <Button type="submit">Update Contribution</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete History Confirmation Dialog */}
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
      
      {/* Delete Contribution Confirmation Dialog */}
      <AlertDialog
        open={!!contributionToDelete}
        onOpenChange={() => setContributionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contribution record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContribution}
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
