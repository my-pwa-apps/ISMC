"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuditLog } from "@/features/audit/hooks";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

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

const actionVariant: Record<string, "success" | "warning" | "error" | "info" | "outline"> = {
  VIEW_POLICY: "info",
  CREATE_SNAPSHOT: "success",
  DELETE_SNAPSHOT: "error",
  ADD_NOTE: "info",
  REMOVE_NOTE: "warning",
};

export function AuditView() {
  const { data, isLoading, error } = useAuditLog();

  const columns = useMemo<ColumnDef<AuditRecord, unknown>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "Time",
        size: 160,
        cell: ({ getValue }) => {
          const ts = getValue() as string;
          return (
            <Tooltip content={formatAbsoluteDate(ts)}>
              <span className="text-xs text-muted-foreground cursor-default">
                {formatRelativeDate(ts)}
              </span>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        size: 160,
        cell: ({ getValue }) => {
          const action = getValue() as string;
          return (
            <Badge variant={actionVariant[action] ?? "outline"} className="text-xs font-mono">
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: "entityType",
        header: "Entity",
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "entityId",
        header: "Entity ID",
        size: 220,
        cell: ({ getValue }) => (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate block max-w-[200px]">
            {getValue() as string}
          </code>
        ),
      },
      {
        accessorKey: "actorDisplayName",
        header: "Actor",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.actorDisplayName ?? row.original.actorId}
          </span>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive p-4">{(error as Error).message}</div>;
  }

  return (
    <DataTable
      data={data?.data ?? []}
      columns={columns}
      exportFileName="audit-log"
      emptyTitle="No audit entries"
      emptyDescription="Actions like viewing policies and creating snapshots will appear here."
      pageSize={50}
    />
  );
}
