"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyReport } from "@/domain/models";

export function useMigrationReadiness() {
  return useQuery<PolicyReport>({
    queryKey: ["report", "migration-readiness"],
    queryFn: async () => {
      const res = await fetch("/api/reports/migration-readiness");
      if (!res.ok) throw new Error("Failed to load migration report");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
