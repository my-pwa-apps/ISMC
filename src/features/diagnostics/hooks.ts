"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantDiagnostics } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

export function useTenantDiagnostics() {
  return useQuery<TenantDiagnostics>({
    queryKey: ["diagnostics"],
    queryFn: async () => fetchApiData<TenantDiagnostics>("/api/diagnostics"),
    staleTime: 60 * 1000,
  });
}