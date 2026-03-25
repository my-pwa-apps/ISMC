"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyReport } from "@/domain/models";

export function useReport(reportType: string | null) {
  return useQuery<PolicyReport>({
    queryKey: ["report", reportType],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportType}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to load report");
      }
      return res.json();
    },
    enabled: !!reportType,
    staleTime: 5 * 60 * 1000,
  });
}
