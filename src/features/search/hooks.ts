"use client";

import { useQuery } from "@tanstack/react-query";
import { type SearchResult } from "@/domain/models";

interface SearchResponse {
  results: SearchResult[];
  total: number;
  durationMs: number;
}

export function useSearch(query: string, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Search failed");
      }
      return res.json();
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
