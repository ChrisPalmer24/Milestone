import { BrokerProvider } from "@/context/PortfolioContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export const brokerProvidersQueryKey = ["/api/assets/broker-providers"];

export const useBrokerProviders = () => {
  return useQuery<BrokerProvider[]>({
    queryKey: brokerProvidersQueryKey,
    queryFn: async () =>
      await apiRequest("GET", "/api/assets/broker-providers"),
  });
};
