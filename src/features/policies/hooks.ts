"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyObject, type PolicySnapshot } from "@/domain/models";
import { fetchApiData } from "@/lib/api/fetcher";

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
