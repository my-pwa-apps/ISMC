"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api/fetcher";

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
      const limit = pageSize;
      const offset = (page - 1) * pageSize;
      const response = await fetchApi<
        Array<{
          id: string;
          action: string;
          entityId: string;
          entityType: string;
          actorId?: string;
          actorName?: string;
          createdAt: string;
          details?: Record<string, unknown>;
        }>,
        { total: number }
      >(`/api/audit?limit=${limit}&offset=${offset}`);

      return {
        data: response.data.map((record) => ({
          id: record.id,
          action: record.action,
          entityId: record.entityId,
          entityType: record.entityType,
          actorId: record.actorId ?? "unknown",
          actorDisplayName: record.actorName ?? null,
          timestamp: record.createdAt,
          details: record.details ?? null,
        })),
        total: response.meta?.total ?? response.data.length,
      };
    },
    staleTime: 60 * 1000,
  });
}
