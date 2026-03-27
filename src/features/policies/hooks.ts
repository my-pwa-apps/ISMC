"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type PolicyObject, type PolicySnapshot } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";
import { PolicyType } from "@/domain/enums";

export function usePolicyDetails(id: string) {
  return useQuery<PolicyObject>({
    queryKey: ["policy", id],
    queryFn: async () => fetchApiData<PolicyObject>(`/api/policies/${id}?withSettings=true`),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function usePolicySnapshots(policyId: string) {
  return useQuery<PolicySnapshot[]>({
    queryKey: ["snapshots", policyId],
    queryFn: async () => fetchApiData<PolicySnapshot[]>(`/api/snapshots?policyId=${policyId}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePolicySnapshot(policyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note }: { note?: string }) =>
      fetchApiData<PolicySnapshot>("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId, note }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["snapshots", policyId] });
    },
  });
}

export function useClonePolicy(policyId: string, policyType: PolicyType) {
  return useMutation({
    mutationFn: async ({ newName }: { newName: string }) =>
      fetchApiData<PolicyObject>(`/api/policies/${policyId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName, policyType }),
      }),
  });
}

export function useRestoreSnapshot(snapshotId: string) {
  return useMutation({
    mutationFn: async ({ newName }: { newName: string }) =>
      fetchApiData<PolicyObject>(`/api/snapshots/${snapshotId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      }),
  });
}
