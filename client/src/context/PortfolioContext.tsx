import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
  skipToken,
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import {
  AccountType,
  Milestone,
  Account,
  FireSettings,
  PortfolioValue,
  AccountHistory,
  AccountHistoryData,
  InsertAccount,
  SessionUser,
} from "@shared/schema";
import { getEndpointPathWithUserId } from "@/lib/user";
import { useSession } from "@/hooks/use-session";

type AddAccount = Omit<InsertAccount, "userId">;

interface PortfolioContextType {
  accounts: Account[];
  milestones: Milestone[];
  fireSettings: FireSettings | null;
  totalPortfolioValue: number;
  activeSection: string;
  setActiveSection: (section: string) => void;
  addAccount: (account: AddAccount) => Promise<Response>;
  updateAccountValue: (id: Account["id"], value: number) => Promise<void>;
  deleteAccount: (id: Account["id"]) => Promise<void>;
  connectAccountApi: (id: Account["id"], apiKey: string) => Promise<void>;
  addMilestone: (
    milestone: Omit<Milestone, "id" | "isCompleted">
  ) => Promise<void>;
  deleteMilestone: (id: Milestone["id"]) => Promise<void>;
  updateFireSettings: (settings: Partial<FireSettings>) => Promise<void>;
  createFireSettings: (
    settings: Omit<FireSettings, "id" | "userId">
  ) => Promise<void>;
  isLoading: boolean;
  accountsHistory: AccountHistoryData;
  addAccountHistory: (data: {
    accountId: Account["id"];
    value: string;
    recordedAt: Date;
  }) => Promise<void>;
  updateAccountHistory: (
    id: AccountHistory["id"],
    data: { value: string; recordedAt: Date }
  ) => Promise<void>;
  deleteAccountHistory: (id: AccountHistory["id"]) => Promise<void>;
  getAccountHistory: (accountId: Account["id"]) => AccountHistory[];
}

// Create the context
const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);
// Provider component
export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSessionPending, logout } = useSession();

  const [activeSection, setActiveSection] = useState("portfolio");
  const queryClient = useQueryClient();

  const apiEnabled = !isSessionPending && !!user;

  type EndPoint = {
    path: string;
    queryKey: QueryKey;
  };

  const getAuthQueryKey = (
    (user: SessionUser | null) =>
    (path: string[]): string[] => {
      return [
        ...path.map((p) =>
          getEndpointPathWithUserId(p, user?.account.id ?? "none")
        ),
        ...(user?.account.id ? [user.account.id] : []),
      ];
    }
  )(user);

  const accountsQueryKey = getAuthQueryKey(["/api/accounts/user/{userId}"]);
  const accountsHistoryQueryKey = getAuthQueryKey(["/api/account-history"]);
  const milestonesQueryKey = getAuthQueryKey(["/api/milestones/user/{userId}"]);
  const fireSettingsQueryKey = getAuthQueryKey([
    "/api/fire-settings/user/{userId}",
  ]);
  const portfolioValueQueryKey = getAuthQueryKey(["/api/portfolio/value"]);
  const portfolioHistoryQueryKey = getAuthQueryKey(["/api/portfolio/history"]);

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
  } = useQuery<Account[]>({
    queryKey: accountsQueryKey,
    queryFn: apiEnabled
      ? async () => {
          const response = await apiRequest("GET", accountsQueryKey[0]);
          return response.json();
        }
      : skipToken,
  });

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading: isLoadingMilestones,
    isError: isMilestonesError,
  } = useQuery({
    queryKey: milestonesQueryKey,
    queryFn: apiEnabled
      ? async () => {
          const response = await apiRequest("GET", milestonesQueryKey[0]);
          return response.json();
        }
      : skipToken,
  });

  // Fetch FIRE settings
  const {
    data: fireSettings,
    isLoading: isLoadingFireSettings,
    isError: isFireSettingsError,
  } = useQuery({
    queryKey: fireSettingsQueryKey,
    queryFn: apiEnabled
      ? async () => {
          const response = await apiRequest("GET", fireSettingsQueryKey[0]);
          return response.json();
        }
      : skipToken,
  });

  const invalidateQueries = useCallback(
    (queryKeys: string[][]) => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: queryKey });
      });
    },
    [queryClient]
  );

  const invalidateAccounts = useCallback(() => {
    invalidateQueries([
      accountsQueryKey,
      portfolioValueQueryKey,
      portfolioHistoryQueryKey,
      accountsHistoryQueryKey,
    ]);
  }, [invalidateQueries, accountsQueryKey]);

  const invalidateMilestones = useCallback(() => {
    invalidateQueries([milestonesQueryKey]);
  }, [invalidateQueries, milestonesQueryKey]);

  const invalidateFireSettings = useCallback(() => {
    invalidateQueries([fireSettingsQueryKey]);
  }, [invalidateQueries, fireSettingsQueryKey]);

  // Fetch total portfolio value
  const { data: portfolioValue, isLoading: isLoadingPortfolioValue } =
    useQuery<PortfolioValue>({
      queryKey: portfolioValueQueryKey,
      queryFn: apiEnabled
        ? async () => {
            const response = await apiRequest("GET", portfolioValueQueryKey[0]);
            return response.json();
          }
        : skipToken,
    });
  // Fetch account history for all accounts
  const { data: accountsHistory = [], isLoading: isLoadingAccountHistory } =
    useQuery<AccountHistoryData>({
      queryKey: accountsHistoryQueryKey,
      queryFn: async () => {
        const data = Promise.all(
          accounts.map(async (account) => {
            const response = await apiRequest(
              "GET",
              `/api/account-history/account/${account.id}`
            );
            if (!response.ok)
              throw new Error("Failed to fetch account history");
            const history = await response.json();
            return { accountId: account.id, history };
          })
        );
        return data;
      },
      enabled: accounts.length > 0,
    });

  // Calculate total portfolio value
  const totalPortfolioValue = portfolioValue?.totalValue || 0;

  // Mutations
  const { mutateAsync: addAccount } = useMutation<
    Response,
    Error,
    Omit<InsertAccount, "userId">
  >({
    mutationFn: (newAccount) =>
      apiRequest("POST", "/api/accounts", {
        ...newAccount,
        userId: 1,
      }),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Account added",
        description: "Your investment account has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding account",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateAccountValueMutation = useMutation({
    mutationFn: ({ id, value }: { id: Account["id"]; value: number }) =>
      apiRequest("PATCH", `/api/accounts/${id}/value`, { value }),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Account updated",
        description: "Account value has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating account",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: Account["id"]) =>
      apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "Account deleted",
        description: "Your investment account has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting account",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const connectAccountApiMutation = useMutation({
    mutationFn: ({ id, apiKey }: { id: Account["id"]; apiKey: string }) =>
      apiRequest("PATCH", `/api/accounts/${id}/connect-api`, { apiKey }),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "API connected",
        description:
          "Your account has been connected to the Trading212 API successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error connecting API",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const connectAccountApi = async (id: Account["id"], apiKey: string) => {
    await connectAccountApiMutation.mutateAsync({ id, apiKey });
  };

  const addMilestoneMutation = useMutation({
    mutationFn: (newMilestone: Omit<Milestone, "id" | "isCompleted">) => {
      console.log("Sending milestone data:", JSON.stringify(newMilestone));
      return apiRequest("POST", "/api/milestones", newMilestone);
    },
    onSuccess: () => {
      invalidateMilestones();
      toast({
        title: "Milestone added",
        description: "Your investment milestone has been added successfully.",
      });
    },
    onError: (error) => {
      console.log("Error response:", error);
      toast({
        title: "Error adding milestone",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: Milestone["id"]) =>
      apiRequest("DELETE", `/api/milestones/${id}`),
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

  const updateFireSettingsMutation = useMutation({
    mutationFn: (settings: Partial<FireSettings>) =>
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

  const createFireSettingsMutation = useMutation({
    mutationFn: (settings: Omit<FireSettings, "id" | "userId">) =>
      apiRequest("POST", "/api/fire-settings", {
        ...settings,
        userId: 1, // Demo user
      }),
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

  // Add new mutations for account history
  const addAccountHistoryMutation = useMutation({
    mutationFn: (data: {
      accountId: Account["id"];
      value: string;
      recordedAt: Date;
    }) =>
      apiRequest("POST", "/api/account-history", {
        ...data,
        recordedAt: data.recordedAt.toISOString(),
      }),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "History entry added",
        description: "Account history entry has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding history entry",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateAccountHistoryMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: AccountHistory["id"];
      data: { value: string; recordedAt: Date };
    }) =>
      apiRequest("PUT", `/api/account-history/${id}`, {
        ...data,
        recordedAt: data.recordedAt.toISOString(),
      }),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "History entry updated",
        description: "Account history entry has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating history entry",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteAccountHistoryMutation = useMutation({
    mutationFn: (id: AccountHistory["id"]) =>
      apiRequest("DELETE", `/api/account-history/${id}`),
    onSuccess: () => {
      invalidateAccounts();
      toast({
        title: "History entry deleted",
        description: "Account history entry has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting history entry",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Helper function to get history for a specific account
  const getAccountHistory = (accountId: Account["id"]): AccountHistory[] => {
    const accountData = accountsHistory.find((h) => h.accountId === accountId);
    return accountData?.history || [];
  };

  // Wrapper functions for mutations
  // const addAccount = async (account: {
  //   provider: string;
  //   accountType: AccountType;
  //   currentValue: string;
  // }) => {
  //   await addAccountMutation.mutateAsync({
  //     provider: account.provider,
  //     accountType: account.accountType,
  //     currentValue: account.currentValue,
  //     userId: 1, // Demo user
  //   });
  // };

  const updateAccountValue = async (id: Account["id"], value: number) => {
    await updateAccountValueMutation.mutateAsync({ id, value });
  };

  const deleteAccount = async (id: Account["id"]) => {
    await deleteAccountMutation.mutateAsync(id);
  };

  const addMilestone = async (
    milestone: Omit<Milestone, "id" | "isCompleted">
  ) => {
    // Convert "ALL" accountType to null which is what the backend expects
    const processedMilestone = {
      ...milestone,
      accountType:
        milestone.accountType === "ALL"
          ? null
          : (milestone.accountType as Exclude<AccountType, "ALL">),
    };
    await addMilestoneMutation.mutateAsync(processedMilestone);
  };

  const deleteMilestone = async (id: Milestone["id"]) => {
    await deleteMilestoneMutation.mutateAsync(id);
  };

  const updateFireSettings = async (settings: Partial<FireSettings>) => {
    await updateFireSettingsMutation.mutateAsync(settings);
  };

  const createFireSettings = async (
    settings: Omit<FireSettings, "id" | "userId">
  ) => {
    await createFireSettingsMutation.mutateAsync(settings);
  };

  // Wrapper functions for history mutations
  const addAccountHistory = async (data: {
    accountId: Account["id"];
    value: string;
    recordedAt: Date;
  }) => {
    await addAccountHistoryMutation.mutateAsync(data);
  };

  const updateAccountHistory = async (
    id: AccountHistory["id"],
    data: { value: string; recordedAt: Date }
  ) => {
    await updateAccountHistoryMutation.mutateAsync({ id, data });
  };

  const deleteAccountHistory = async (id: AccountHistory["id"]) => {
    await deleteAccountHistoryMutation.mutateAsync(id);
  };

  // Check for errors and show notifications
  useEffect(() => {
    if (isAccountsError) {
      toast({
        title: "Failed to load accounts",
        description:
          "There was an error loading your investment accounts. Please try again.",
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
  }, [isAccountsError, isMilestonesError, isFireSettingsError]);

  const isLoading =
    isLoadingAccounts ||
    isLoadingAccountHistory ||
    isLoadingMilestones ||
    isLoadingFireSettings ||
    isLoadingPortfolioValue;

  const value: PortfolioContextType = {
    accounts: accounts as Account[],
    milestones: milestones as Milestone[],
    fireSettings: fireSettings as FireSettings | null,
    totalPortfolioValue,
    activeSection,
    setActiveSection,
    addAccount,
    updateAccountValue,
    deleteAccount,
    connectAccountApi,
    addMilestone,
    deleteMilestone,
    updateFireSettings,
    createFireSettings,
    isLoading,
    accountsHistory: accountsHistory,
    addAccountHistory,
    updateAccountHistory,
    deleteAccountHistory,
    getAccountHistory,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

// Custom hook to use the portfolio context
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
