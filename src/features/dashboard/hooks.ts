"use client";

import { useQuery } from "@tanstack/react-query";
import { type DashboardStats } from "@/domain/models";

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to load dashboard stats");
  const json = await res.json();
  return json.data ?? json;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchStats,
    staleTime: 2 * 60 * 1000,
  });
}
