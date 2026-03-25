"use client";

import { useQuery } from "@tanstack/react-query";
import { type SearchResult } from "@/domain/models";
import { fetchApi } from "@/lib/api/fetcher";

interface SearchResponse {
  results: SearchResult[];
  total: number;
  durationMs: number;
  page: number;
  pageSize: number;
  nextCursor?: string;
  prevCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useSearch(query: string, page = 1, pageSize = 25, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: ["search", query, page, pageSize],
    queryFn: async () => {
      const response = await fetchApi<
        SearchResult[],
        {
          count: number;
          totalCount: number;
          durationMs: number;
          page: number;
          pageSize: number;
          nextCursor?: string;
          prevCursor?: string;
          hasNextPage?: boolean;
          hasPreviousPage?: boolean;
        }
      >("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, page, pageSize }),
      });
      return {
        results: response.data,
        total: response.meta?.totalCount ?? response.meta?.count ?? response.data.length,
        durationMs: response.meta?.durationMs ?? 0,
        page: response.meta?.page ?? page,
        pageSize: response.meta?.pageSize ?? pageSize,
        nextCursor: response.meta?.nextCursor,
        prevCursor: response.meta?.prevCursor,
        hasNextPage: response.meta?.hasNextPage ?? false,
        hasPreviousPage: response.meta?.hasPreviousPage ?? page > 1,
      };
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
