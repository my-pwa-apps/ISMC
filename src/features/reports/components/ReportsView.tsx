"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useReport } from "@/features/reports/hooks";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { type ReportRow } from "@/domain/models";
import { useRouter } from "next/navigation";

const REPORT_LABELS: Record<string, { title: string; description: string }> = {
  "unassigned-policies": {
    title: "Unassigned Policies",
    description: "Policies that are not assigned to any group, user, or device.",
  },
  "missing-scope-tags": {
    title: "Missing Scope Tags",
    description: "Policies without any scope tags assigned.",
  },
  "stale-policies": {
    title: "Stale Policies",
    description: "Policies that have not been modified in over 90 days.",
  },
  "overlapping-assignments": {
    title: "Overlapping Assignments",
    description: "Policies that target the same groups or users.",
  },
  "conflicting-settings": {
    title: "Conflicting Settings",
    description: "Policies that configure the same settings with different values.",
  },
  "duplicate-policies": {
    title: "Duplicate Policies",
    description: "Policies with identical or very similar names.",
  },
  "settings-usage": {
    title: "Settings Usage",
    description: "A breakdown of how many policies configure each setting.",
  },
  "migration-readiness": {
    title: "Migration Readiness",
    description: "Assessment of GPO settings that can be migrated to Intune.",
  },
};

interface ReportsViewProps {
  reportType: string;
}

export function ReportsView({ reportType }: ReportsViewProps) {
  const router = useRouter();
  const { data, isLoading, error } = useReport(reportType);
  const meta = REPORT_LABELS[reportType];

  const columns = useMemo<ColumnDef<ReportRow, unknown>[]>(
    () =>
      (data?.columns ?? []).map((col) => ({
        accessorKey: col.key,
        header: col.label,
        cell: ({ getValue }) => {
          const val = getValue();
          if (val === null || val === undefined) return <span className="text-muted-foreground">—</span>;
          return <span className="text-sm">{String(val)}</span>;
        },
      })),
    [data?.columns]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4">
        {(error as Error).message}
      </div>
    );
  }

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={rows.length > 0 ? "warning" : "success"} className="text-sm px-3 py-1">
          {rows.length} {rows.length === 1 ? "result" : "results"}
        </Badge>
        {meta?.description && (
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        )}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        exportFileName={`report-${reportType}`}
        emptyTitle="No issues found"
        emptyDescription="This report found no policies matching the criteria."
        pageSize={50}
        onRowClick={(row) => {
          const id = row.original.id ?? row.original.policyId;
          if (id) router.push(`/policies/${id}`);
        }}
      />
    </div>
  );
}
