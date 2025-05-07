import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  skipToken,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  Milestone,
  FireSettings,
  SessionUser,
  BrokerProviderAsset,
  BrokerProviderAssetInsert,
  BrokerProviderAssetOrphanInsert,
  AssetsChange,
  AssetValue,
  AssetValueInsert,
  MilestoneOrphanInsert,
  FireSettingsInsert,
  BrokerProviderAssetWithAccountChange,
  MilestoneInsert,
  FireSettingsOrphan,
} from "@shared/schema";
import { getEndpointPathWithUserId } from "@/lib/user";
import { useSession } from "@/hooks/use-session";
import { AccountType } from "@server/db/schema/portfolio-assets";
import { getDateUrlParams } from "@/lib/date";

export type PortfolioContextType = {
  brokerAssets: BrokerProviderAsset[];
  milestones: Milestone[];
  fireSettings: FireSettings | null;
  totalPortfolioValue: number;
  activeSection: string;
  portfolioOverview: AssetsChange;
};

type BrokerProviderAssetUpdate = BrokerProviderAssetInsert & {
  id: BrokerProviderAsset["id"];
};

type AssetValueUpdate = AssetValueInsert & {
  historyId: AssetValue["id"];
};

type AssetValueDelete = {
  assetId: BrokerProviderAsset["id"];
  historyId: AssetValue["id"];
};

type MilestoneUpdate = MilestoneOrphanInsert & {
  id: Milestone["id"];
};

type FireSettingsUpdate = FireSettingsInsert & {
  id: FireSettings["id"];
};

// Create the context
const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);
// Provider component
export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const value: PortfolioContextType = {
    brokerAssets: [],
    milestones: [],
    fireSettings: null,
    totalPortfolioValue: 0,
    activeSection: "portfolio",
    portfolioOverview: {
      value: 0,
      currencyChange: 0,
      percentageChange: 0,
      startDate: new Date(),
      endDate: new Date(),
    },
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

// Custom hook to use the portfolio context
export const usePortfolio = (startDate?: Date, endDate?: Date) => {
  console.log("usePortfolio", startDate, endDate);

  const context = useContext(PortfolioContext);

  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }

  const { user, isSessionPending, logout } = useSession();

  const queryClient = useQueryClient();

  const apiEnabled = !isSessionPending && !!user;

  const getAuthQueryKey = (
    (user: SessionUser | null) =>
    (path: string[]): string[] => {
      //TODO DOUBLE CHECK USER IS NOT NULL
      return [
        ...path.map((p) =>
          getEndpointPathWithUserId(p, user?.account.id ?? "none")
        ),
        ...(user?.account.id ? [user.account.id] : []),
      ];
    }
  )(user);

  const milestonesQueryKey = getAuthQueryKey(["/api/milestones/user/{userId}"]);
  const fireSettingsQueryKey = getAuthQueryKey([
    "/api/fire-settings/user/{userId}",
  ]);
  const portfolioValueQueryKey = getAuthQueryKey([
    "/api/assets/portfolio-value",
  ]);
  const portfolioHistoryPath = "/api/assets/portfolio-value/history";
  const portfolioHistoryQueryKey = getAuthQueryKey([portfolioHistoryPath]);
  const brokerAssetsQueryKey = ["/api/assets/broker", user?.account.id];

  const invalidateAccounts = useCallback(() => {
    queryClient.invalidateQueries({
      //We need fetch all queries for the time being
      //The portolfio chart is out of view and so would not be refetched otherwise
      refetchType: "all",
    });
    //We are using all for the time being, we can refine this later
    // [
    //   { queryKey: accountsQueryKey },
    //   { queryKey: accountsHistoryQueryKey },
    //   { queryKey: portfolioValueQueryKey },
    //   {
    //     predicate: (query) => {
    //       console.log("query", query);
    //       return query.queryKey.includes(portfolioHistoryPath);
    //     },
    //   },
    // ].forEach((query) => {
    //   queryClient.invalidateQueries(query);
    // });
  }, []);

  const invalidateMilestones = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: milestonesQueryKey });
  }, [milestonesQueryKey]);

  const invalidateFireSettings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: fireSettingsQueryKey });
  }, [fireSettingsQueryKey]);

  // Fetch broker assets
  const {
    data: brokerAssets = [],
    isLoading: isLoadingBrokerAssets,
    isError: isBrokerAssetsError,
  } = useQuery<BrokerProviderAssetWithAccountChange[]>({
    queryKey: [...brokerAssetsQueryKey, startDate, endDate],
    queryFn: apiEnabled
      ? async () =>
          apiRequest(
            "GET",
            `/api/assets/broker?${getDateUrlParams(startDate, endDate)}`
          )
      : skipToken,
  });

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading: isLoadingMilestones,
    isError: isMilestonesError,
  } = useQuery<Milestone[]>({
    queryKey: milestonesQueryKey,
    queryFn: apiEnabled
      ? async () => apiRequest("GET", milestonesQueryKey[0])
      : skipToken,
  });

  // Fetch FIRE settings
  const {
    data: fireSettings,
    isLoading: isLoadingFireSettings,
    isError: isFireSettingsError,
  } = useQuery<FireSettings>({
    queryKey: fireSettingsQueryKey,
    queryFn: apiEnabled
      ? async () => apiRequest("GET", fireSettingsQueryKey[0])
      : skipToken,
  });

  // Fetch total portfolio value
  const { data: portfolioOverview, isLoading: isLoadingPortfolioOverview } =
    useQuery<AssetsChange>({
      queryKey: ["/api/assets/portfolio-value", startDate, endDate],
      queryFn: apiEnabled
        ? async () =>
            await apiRequest(
              "GET",
              `/api/assets/portfolio-value?${getDateUrlParams(
                startDate,
                endDate
              )}`
            )
        : skipToken,
    });

  // Mutations for broker assets
  const addBrokerAsset = useMutation<
    BrokerProviderAsset,
    Error,
    BrokerProviderAssetOrphanInsert
  >({
    mutationFn: (newAsset) =>
      apiRequest<BrokerProviderAsset>("POST", "/api/assets/broker", {
        ...newAsset,
        userAccountId: user?.account.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brokerAssetsQueryKey });
      toast({
        title: "Broker Asset added",
        description: "Your broker asset has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding broker asset",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateBrokerAsset = useMutation<
    BrokerProviderAsset,
    Error,
    BrokerProviderAssetUpdate
  >({
    mutationFn: (data) => {
      const { id, ...rest } = data;
      return apiRequest<BrokerProviderAsset>(
        "PUT",
        `/api/assets/broker/${id}`,
        {
          ...rest,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brokerAssetsQueryKey });
      toast({
        title: "Broker Asset updated",
        description: "Your broker asset has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating broker asset",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteBrokerAsset = useMutation<void, Error, BrokerProviderAsset["id"]>(
    {
      mutationFn: (id) =>
        apiRequest<void>("DELETE", `/api/assets/broker/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: brokerAssetsQueryKey });
        toast({
          title: "Broker Asset deleted",
          description: "Your broker asset has been deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error deleting broker asset",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive",
        });
      },
    }
  );

  // Add new mutations for account history
  const addBrokerAssetValue = useMutation<
    AssetValueInsert,
    Error,
    AssetValueInsert
  >({
    mutationFn: (data: AssetValueInsert) => {
      const { assetId, ...rest } = data;
      return apiRequest<AssetValue>(
        "POST",
        `/api/assets/broker/${assetId}/history`,
        {
          ...rest,
          recordedAt: data.recordedAt ?? new Date(),
        }
      );
    },
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Broker provider asset value added",
        description: "Broker provider asset value has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding broker provider asset value",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateBrokerAssetValue = useMutation<
    AssetValue,
    Error,
    AssetValueUpdate
  >({
    mutationFn: (data) => {
      const { assetId, historyId, ...rest } = data;
      return apiRequest<AssetValue>(
        "PUT",
        `/api/assets/broker/${assetId}/history/${historyId}`,
        {
          ...rest,
        }
      );
    },
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Broker provider asset value updated",
        description:
          "Broker provider asset value has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding broker provider asset value",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteBrokerAssetValue = useMutation<void, Error, AssetValueDelete>({
    mutationFn: ({ assetId, historyId }) =>
      apiRequest<void>(
        "DELETE",
        `/api/assets/broker/${assetId}/history/${historyId}`
      ),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Broker provider asset value deleted",
        description:
          "Broker provider asset value has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding broker provider asset value",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const connectBrokerProviderAssetApi = useMutation<
    void,
    Error,
    { id: BrokerProviderAsset["id"]; apiKey: string }
  >({
    mutationFn: async ({ id, apiKey }) =>
      apiRequest("PATCH", `/api/assets/broker/${id}/connect-api`, {
        apiKey,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brokerAssetsQueryKey });
      toast({
        title: "API connected",
        description:
          "Your broker asset has been connected to the API successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding broker provider asset value",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Update milestone mutations to handle response data
  const addMilestone = useMutation<Milestone, Error, MilestoneInsert>({
    mutationFn: async (newMilestone) => {
      const processedMilestone = {
        ...newMilestone,
        accountType:
          newMilestone.accountType === "ALL"
            ? null
            : (newMilestone.accountType as AccountType),
      };
      return apiRequest<Milestone>(
        "POST",
        "/api/milestones",
        processedMilestone
      );
    },
    onSuccess: () => {
      invalidateMilestones();
      toast({
        title: "Milestone added",
        description: "Your investment milestone has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding milestone",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMilestone = useMutation<void, Error, Milestone["id"]>({
    mutationFn: async (id) => {
      return apiRequest("DELETE", `/api/milestones/${id}`);
    },
    onSuccess: () => {
      invalidateMilestones();
      toast({
        title: "Milestone deleted",
        description: "Your investment milestone has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting milestone",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMilestone = useMutation<Milestone, Error, MilestoneUpdate>({
    mutationFn: async (data) => {
      const { id, ...rest } = data;
      return apiRequest("PATCH", `/api/milestones/${id}`, data);
    },
    onSuccess: () => {
      invalidateMilestones();
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update milestone: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const createFireSettings = useMutation<
    FireSettings,
    Error,
    FireSettingsOrphan
  >({
    mutationFn: (settings) => {
      return apiRequest("POST", "/api/fire-settings", {
        ...settings,
        accountId: user?.account.id,
      });
    },
    onSuccess: () => {
      invalidateFireSettings();
      toast({
        title: "FIRE settings created",
        description:
          "Your retirement planning settings have been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating FIRE settings",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateFireSettings = useMutation<
    FireSettings,
    Error,
    FireSettingsOrphan
  >({
    mutationFn: (settings) =>
      apiRequest("PATCH", "/api/fire-settings", settings),
    onSuccess: () => {
      invalidateFireSettings();
      toast({
        title: "FIRE settings updated",
        description:
          "Your retirement planning settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating FIRE settings",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Check for errors and show notifications
  useEffect(() => {
    if (isBrokerAssetsError) {
      toast({
        title: "Failed to load broker assets",
        description:
          "There was an error loading your broker assets. Please try again.",
        variant: "destructive",
      });
    }

    if (isMilestonesError) {
      toast({
        title: "Failed to load milestones",
        description:
          "There was an error loading your investment milestones. Please try again.",
        variant: "destructive",
      });
    }

    if (isFireSettingsError) {
      toast({
        title: "Failed to load FIRE settings",
        description:
          "There was an error loading your retirement settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [isBrokerAssetsError, isMilestonesError, isFireSettingsError]);

  const isLoading =
    isLoadingBrokerAssets ||
    isLoadingMilestones ||
    isLoadingFireSettings ||
    isLoadingPortfolioOverview;

  return {
    ...context,
    addBrokerAsset,
    updateBrokerAsset,
    deleteBrokerAsset,
    addBrokerAssetValue,
    updateBrokerAssetValue,
    deleteBrokerAssetValue,
    connectBrokerProviderAssetApi,
    addMilestone,
    deleteMilestone,
    updateMilestone,
    updateFireSettings,
    createFireSettings,
    isLoading,
    brokerAssets,
    milestones,
    fireSettings,
    portfolioOverview,
  };
};
