"use client";

import { usePolicySnapshots } from "@/features/policies/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/utils";
import { HistoryIcon, DownloadIcon } from "lucide-react";
import type { PolicySnapshot } from "@/domain/models";

interface VersionHistoryTabProps {
  policyId: string;
}

export function VersionHistoryTab({ policyId }: VersionHistoryTabProps) {
  const { data, isLoading } = usePolicySnapshots(policyId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const snapshots: PolicySnapshot[] = data ?? [];

  if (snapshots.length === 0) {
    return (
      <EmptyState
        title="No snapshots"
        description="Snapshots capture the full policy state at a point in time. Create one to start tracking changes."
        icon={<HistoryIcon className="w-6 h-6 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-2">
      {snapshots.map((snap, idx) => (
        <div
          key={snap.id}
          className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {idx === 0 && <Badge variant="primary" className="text-xs">Latest</Badge>}
              <span className="text-sm font-medium">
                {snap.displayName ?? `Snapshot ${snapshots.length - idx}`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatAbsoluteDate(snap.createdAt)} · {formatRelativeDate(snap.createdAt)}
              {snap.createdByName && ` · by ${snap.createdByName}`}
            </p>
            {snap.note && (
              <p className="text-xs text-muted-foreground italic">{snap.note}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const blob = new Blob([JSON.stringify(snap.snapshotData, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${snap.policyId}-${snap.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              leftIcon={<DownloadIcon className="w-3.5 h-3.5" />}
            >
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
