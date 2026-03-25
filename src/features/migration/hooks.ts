"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyReport } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

export function useMigrationReadiness() {
  return useQuery<PolicyReport>({
    queryKey: ["report", "migration-readiness"],
    queryFn: async () => fetchApiData<PolicyReport>("/api/reports/migration-readiness"),
    staleTime: 5 * 60 * 1000,
  });
}
