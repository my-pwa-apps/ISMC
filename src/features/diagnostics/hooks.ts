"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TenantDiagnostics } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

export function useTenantDiagnostics() {
  return useQuery<TenantDiagnostics>({
    queryKey: ["diagnostics"],
    queryFn: async () => fetchApiData<TenantDiagnostics>("/api/diagnostics"),
    staleTime: 60 * 1000,
  });
}

export function useUpdateWriteMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) =>
      fetchApiData<{ enabled: boolean }>("/api/diagnostics/write-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
    },
  });
}