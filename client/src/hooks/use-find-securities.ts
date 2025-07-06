import { apiRequest } from "@/lib/queryClient";
import { SecuritySearchResult } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export const useFindSecurities = (query?: string | undefined) => {
  return useQuery<SecuritySearchResult[]>({
    queryKey: ["securities", "search", query],
    queryFn: () => {
      if (!query || query.length < 3) return [];
      return apiRequest<SecuritySearchResult[]>("GET", `/api/securities/search?q=${query}`);
    },
    enabled: !!query,
  })
}
