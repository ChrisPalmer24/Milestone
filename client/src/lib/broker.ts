import { BrokerProvider } from "@/context/PortfolioContext";

export const getProviderName = (
  providerId: string,
  brokerProviders: BrokerProvider[]
) => {
  const provider = brokerProviders?.find((p) => p.id === providerId);
  return provider ? provider.name : "Unknown";
};
