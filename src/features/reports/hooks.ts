"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyReport } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

export function useReport(reportType: string | null) {
  return useQuery<PolicyReport>({
    queryKey: ["report", reportType],
    queryFn: async () => fetchApiData<PolicyReport>(`/api/reports/${reportType}`),
    enabled: !!reportType,
    staleTime: 5 * 60 * 1000,
  });
}
