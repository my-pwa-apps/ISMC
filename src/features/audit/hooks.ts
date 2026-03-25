"use client";

import { useQuery } from "@tanstack/react-query";

interface AuditResponse {
  data: AuditRecord[];
  total: number;
}

interface AuditRecord {
  id: string;
  action: string;
  entityId: string;
  entityType: string;
  actorId: string;
  actorDisplayName: string | null;
  timestamp: string;
  details: Record<string, unknown> | null;
}

export function useAuditLog(page = 1, pageSize = 50) {
  return useQuery<AuditResponse>({
    queryKey: ["audit", page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/audit?page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to load audit log");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}
