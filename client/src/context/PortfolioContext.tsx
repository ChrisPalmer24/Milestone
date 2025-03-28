import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@shared/schema";

interface PortfolioContextType {
  accounts: Account[];
  milestones: Milestone[];
  fireSettings: FireSettings | null;
  totalPortfolioValue: number;
  activeSection: string;
  setActiveSection: (section: string) => void;
  addAccount: (account: {
    provider: string;
    accountType: AccountType;
    currentValue: string;
  }) => Promise<void>;
  updateAccountValue: (id: number, value: number) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  connectAccountApi: (id: number, apiKey: string) => Promise<void>;
  addMilestone: (
    milestone: Omit<Milestone, "id" | "isCompleted">
  ) => Promise<void>;
  deleteMilestone: (id: number) => Promise<void>;
  updateFireSettings: (settings: Partial<FireSettings>) => Promise<void>;
  isLoading: boolean;
  accountHistory: AccountHistoryData;
}

// Create the context
const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

// Provider component
export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [activeSection, setActiveSection] = useState("portfolio");
  const queryClient = useQueryClient();

  // Fetch accounts
  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts/user/1"],
  });

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading: isLoadingMilestones,
    isError: isMilestonesError,
  } = useQuery({
    queryKey: ["/api/milestones"],
  });

  // Fetch FIRE settings
  const {
    data: fireSettings,
    isLoading: isLoadingFireSettings,
    isError: isFireSettingsError,
  } = useQuery({
    queryKey: ["/api/fire-settings"],
  });

  // Fetch total portfolio value
  const { data: portfolioValue, isLoading: isLoadingPortfolioValue } =
    useQuery<PortfolioValue>({
      queryKey: ["/api/portfolio/value"],
    });
  // Fetch account history for all accounts
  const { data: accountHistory = [], isLoading: isLoadingAccountHistory } =
    useQuery<AccountHistoryData>({
      queryKey: ["/api/account-history"],
      queryFn: async () => {
        const data = Promise.all(
          accounts.map(async (account) => {
            const response = await fetch(
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
  const addAccountMutation = useMutation({
    mutationFn: (newAccount: {
      provider: string;
      accountType: AccountType;
      currentValue: string;
      userId: number;
    }) => apiRequest("POST", "/api/accounts", newAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/value"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });

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
    mutationFn: ({ id, value }: { id: number; value: number }) =>
      apiRequest("PATCH", `/api/accounts/${id}/value`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/value"] });
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
    mutationFn: (id: number) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/value"] });
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
    mutationFn: ({ id, apiKey }: { id: number; apiKey: string }) =>
      apiRequest("PATCH", `/api/accounts/${id}/connect-api`, { apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
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

  const connectAccountApi = async (id: number, apiKey: string) => {
    await connectAccountApiMutation.mutateAsync({ id, apiKey });
  };

  const addMilestoneMutation = useMutation({
    mutationFn: (newMilestone: Omit<Milestone, "id" | "isCompleted">) => {
      console.log("Sending milestone data:", JSON.stringify(newMilestone));
      return apiRequest("POST", "/api/milestones", newMilestone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
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
    mutationFn: (id: number) => apiRequest("DELETE", `/api/milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/milestones"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/fire-settings"] });
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

  // Wrapper functions for mutations
  const addAccount = async (account: {
    provider: string;
    accountType: AccountType;
    currentValue: string;
  }) => {
    await addAccountMutation.mutateAsync({
      provider: account.provider,
      accountType: account.accountType,
      currentValue: account.currentValue,
      userId: 1, // Demo user
    });
  };

  const updateAccountValue = async (id: number, value: number) => {
    await updateAccountValueMutation.mutateAsync({ id, value });
  };

  const deleteAccount = async (id: number) => {
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

  const deleteMilestone = async (id: number) => {
    await deleteMilestoneMutation.mutateAsync(id);
  };

  const updateFireSettings = async (settings: Partial<FireSettings>) => {
    await updateFireSettingsMutation.mutateAsync(settings);
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
    isLoading,
    accountHistory,
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
