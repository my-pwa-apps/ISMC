"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { usePolicySnapshots } from "@/features/policies/hooks";
import { useRestoreSnapshot } from "@/features/policies/hooks";
import { useTenantDiagnostics } from "@/features/diagnostics/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/utils";
import { HistoryIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";
import type { PolicySnapshot } from "@/domain/models";
import { PolicyType } from "@/domain/enums";

interface VersionHistoryTabProps {
  policyId: string;
}

export function VersionHistoryTab({ policyId }: VersionHistoryTabProps) {
  const router = useRouter();
  const { data, isLoading } = usePolicySnapshots(policyId);
  const { data: diagnostics } = useTenantDiagnostics();
  const [selectedSnapshot, setSelectedSnapshot] = useState<PolicySnapshot | null>(null);
  const [restoreName, setRestoreName] = useState("");
  const restoreSnapshot = useRestoreSnapshot(selectedSnapshot?.id ?? "");

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
  const writesEnabled = diagnostics?.writeOperationsEnabled ?? false;
  const writeScopeGranted = diagnostics?.graphPermissions.some(
    (permission) => permission.scope === "DeviceManagementConfiguration.ReadWrite.All" && permission.granted
  );

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
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Capture a version before editing. Restoring a version creates a new policy copy so rollback stays fast and low risk.
      </div>
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
            {snap.policyType === PolicyType.SettingsCatalog && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcwIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedSnapshot(snap);
                  setRestoreName(`${snap.displayName} Restored`);
                }}
                disabled={!writesEnabled || !writeScopeGranted}
                title={!writesEnabled || !writeScopeGranted ? "Enable write access to restore" : "Restore this snapshot as a new policy copy"}
              >
                Restore as Copy
              </Button>
            )}
          </div>
        </div>
      ))}

      <Dialog
        open={Boolean(selectedSnapshot)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSnapshot(null);
            setRestoreName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Snapshot as New Policy</DialogTitle>
            <DialogDescription>
              This creates a new Settings Catalog policy from the captured version. The current live policy is left unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 pb-2">
            <Input
              id="restore-name"
              label="New policy name"
              value={restoreName}
              onChange={(event) => setRestoreName(event.target.value)}
              placeholder="Baseline Restored"
            />
            {(!writesEnabled || !writeScopeGranted) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Restore requires <span className="font-medium">ENABLE_WRITE_OPERATIONS=true</span> and the
                <span className="font-medium"> DeviceManagementConfiguration.ReadWrite.All</span> delegated permission.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedSnapshot(null)}>Cancel</Button>
            <Button
              variant="primary"
              loading={restoreSnapshot.isPending}
              disabled={!selectedSnapshot || restoreName.trim().length < 3 || !writesEnabled || !writeScopeGranted}
              onClick={async () => {
                if (!selectedSnapshot) {
                  return;
                }

                try {
                  const restored = await restoreSnapshot.mutateAsync({ newName: restoreName.trim() });
                  toast.success("Snapshot restored as a new policy copy.");
                  setSelectedSnapshot(null);
                  setRestoreName("");
                  router.push(`/policies/${restored.id}`);
                } catch (err) {
                  toast.error((err as Error).message || "Failed to restore snapshot.");
                }
              }}
            >
              Restore Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
