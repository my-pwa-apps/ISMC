"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyObject } from "@/domain/models";

export function usePolicyDetails(id: string) {
  return useQuery<PolicyObject>({
    queryKey: ["policy", id],
    queryFn: async () => {
      const res = await fetch(`/api/policies/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Policy not found");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function usePolicySnapshots(policyId: string) {
  return useQuery({
    queryKey: ["snapshots", policyId],
    queryFn: async () => {
      const res = await fetch(`/api/snapshots?policyId=${policyId}`);
      if (!res.ok) throw new Error("Failed to load snapshots");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
