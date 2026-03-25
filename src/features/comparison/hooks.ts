"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { type PolicyComparisonResult } from "@/domain/models";

export function useComparison(policyIds: string[]) {
  return useQuery<PolicyComparisonResult>({
    queryKey: ["compare", policyIds],
    queryFn: async () => {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyIds }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Comparison failed");
      }
      return res.json();
    },
    enabled: policyIds.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
