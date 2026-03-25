"use client";

import { useQuery } from "@tanstack/react-query";
import { type SearchResult } from "@/domain/models";
import { fetchApi } from "@/lib/api/fetcher";

interface SearchResponse {
  results: SearchResult[];
  total: number;
  durationMs: number;
}

export function useSearch(query: string, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: ["search", query],
    queryFn: async () => {
      const response = await fetchApi<SearchResult[], { count: number; durationMs: number }>("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      return {
        results: response.data,
        total: response.meta?.count ?? response.data.length,
        durationMs: response.meta?.durationMs ?? 0,
      };
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
