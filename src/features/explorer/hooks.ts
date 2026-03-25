"use client";

import { useQuery } from "@tanstack/react-query";
import { type PolicyObject } from "@/domain/models";
import { fetchApi, fetchApiData } from "@/lib/api/fetcher";
import { type ExplorerFilters } from "./store";

interface PolicyListResponse {
  data: PolicyObject[];
  total: number;
  page: number;
  pageSize: number;
}

export function usePolicies(filters: ExplorerFilters, page = 1, pageSize = 50) {
  const params = new URLSearchParams();
  if (filters.policyType) params.set("policyType", filters.policyType);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.scopeTagId) params.set("scopeTagId", filters.scopeTagId);
  if (filters.search) params.set("search", filters.search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return useQuery<PolicyListResponse>({
    queryKey: ["policies", filters, page, pageSize],
    queryFn: async () => {
      const response = await fetchApi<PolicyObject[], { count: number; page: number; pageSize: number }>(
        `/api/policies?${params.toString()}`
      );

      return {
        data: response.data,
        total: response.meta?.count ?? response.data.length,
        page: response.meta?.page ?? page,
        pageSize: response.meta?.pageSize ?? pageSize,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePolicy(id: string | null) {
  return useQuery<PolicyObject>({
    queryKey: ["policy", id],
    queryFn: async () => fetchApiData<PolicyObject>(`/api/policies/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
