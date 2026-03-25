"use client";

import { useMigrationReadiness } from "@/features/migration/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MigrationReadiness } from "@/domain/enums";
import { HardDriveIcon } from "lucide-react";

const readinessVariant: Record<
  MigrationReadiness,
  "success" | "warning" | "error" | "outline"
> = {
  [MigrationReadiness.Supported]: "success",
  [MigrationReadiness.PartiallySupported]: "warning",
  [MigrationReadiness.NotSupported]: "error",
  [MigrationReadiness.WorkaroundAvailable]: "warning",
  [MigrationReadiness.Unknown]: "outline",
};

export function MigrationWorkspace() {
  const { data: report, isLoading, error } = useMigrationReadiness();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4">{(error as Error).message}</div>
    );
  }

  const rows = report?.rows ?? [];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No GPO migration data"
        description="Run Group Policy Analytics in Microsoft Intune to import GPO migration data, then return here."
        icon={<HardDriveIcon className="w-6 h-6 text-muted-foreground" />}
      />
    );
  }

  // Count by readiness from row data
  const readinessCounts: Partial<Record<string, number>> = {};
  for (const row of rows) {
    const r = String(row.readiness ?? "Unknown");
    readinessCounts[r] = (readinessCounts[r] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(readinessCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <Badge
                variant={readinessVariant[status as MigrationReadiness] ?? "outline"}
                className="mt-1 text-xs"
              >
                {status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assessment list */}
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {(report?.columns ?? []).map((col) => (
                <th key={col.key} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/30">
                {(report?.columns ?? []).map((col) => (
                  <td key={col.key} className="px-4 py-2.5">
                    {col.key === "readiness" ? (
                      <Badge
                        variant={readinessVariant[String(row[col.key]) as MigrationReadiness] ?? "outline"}
                        className="text-xs"
                      >
                        {String(row[col.key] ?? "—")}
                      </Badge>
                    ) : (
                      String(row[col.key] ?? "—")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
