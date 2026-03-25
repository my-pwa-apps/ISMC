"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyComparisonResult } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

export function useComparison(policyIds: string[]) {
  return useQuery<PolicyComparisonResult>({
    queryKey: ["compare", policyIds],
    queryFn: async () => {
      return fetchApiData<PolicyComparisonResult>("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyIds }),
      });
    },
    enabled: policyIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
