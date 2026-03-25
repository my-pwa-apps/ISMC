"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { type PolicyObject } from "@/domain/models";
import { PolicyType, Platform } from "@/domain/enums";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { AssignmentBadgeList } from "@/components/shared/assignment-badge";
import { formatRelativeDate, getPolicyTypeLabel, getPlatformLabel } from "@/lib/utils";
import { AlertTriangleIcon, GitCompareIcon } from "lucide-react";
import { useComparisonStore } from "@/features/comparison/store";

interface PolicyListProps {
  policies: PolicyObject[] | undefined;
  loading: boolean;
  searchNode?: React.ReactNode;
}

export function PolicyList({ policies, loading, searchNode }: PolicyListProps) {
  const router = useRouter();
  const { selectedIds, addPolicy } = useComparisonStore();

  const columns = useMemo<ColumnDef<PolicyObject, unknown>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Name",
        size: 300,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PolicyTypeIcon type={row.original.policyType} />
            <span className="font-medium truncate max-w-[240px]" title={row.original.displayName}>
              {row.original.displayName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "policyType",
        header: "Type",
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getPolicyTypeLabel(getValue() as PolicyType)}
          </span>
        ),
      },
      {
        accessorKey: "platform",
        header: "Platform",
        size: 130,
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <PlatformIcon platform={row.original.platform} />
            {getPlatformLabel(row.original.platform)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <Badge variant={status === "Active" ? "success" : "outline"} className="text-xs">
              {status}
            </Badge>
          );
        },
      },
      {
        id: "assignments",
        header: "Assignments",
        size: 200,
        cell: ({ row }) => {
          const assignments = row.original.assignments ?? [];
          if (assignments.length === 0) {
            return (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangleIcon className="w-3.5 h-3.5" />
                Not assigned
              </span>
            );
          }
          return <AssignmentBadgeList assignments={assignments} maxVisible={2} />;
        },
      },
      {
        accessorKey: "lastModifiedDateTime",
        header: "Modified",
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue() ? formatRelativeDate(getValue() as string) : "—"}
          </span>
        ),
      },
      {
        id: "compare",
        header: "",
        size: 44,
        cell: ({ row }) => {
          const id = row.original.id;
          const alreadyAdded = selectedIds.includes(id);
          const atMax = selectedIds.length >= 2;
          return (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={alreadyAdded || atMax}
              title={alreadyAdded ? "Already in comparison" : atMax ? "Compare supports 2 policies" : "Add to compare"}
              onClick={(e) => {
                e.stopPropagation();
                addPolicy(id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GitCompareIcon className={`w-3.5 h-3.5 ${alreadyAdded ? "text-brand-600" : ""}`} />
            </Button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds]
  );

  return (
    <DataTable
      data={policies ?? []}
      columns={columns}
      loading={loading}
      filterNode={searchNode}
      emptyTitle="No policies found"
      emptyDescription="Try adjusting your filters or search query."
      exportFileName="intune-policies"
      pageSize={50}
      rowClassName={() => "group"}
      onRowClick={(row) => router.push(`/policies/${row.original.id}`)}
    />
  );
}
