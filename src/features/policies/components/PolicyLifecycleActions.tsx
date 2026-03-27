"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangleIcon, CopyPlusIcon, HistoryIcon, ShieldAlertIcon } from "lucide-react";
import type { PolicyObject } from "@/domain/models";
import { PolicyType } from "@/domain/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTenantDiagnostics } from "@/features/diagnostics/hooks";
import { useClonePolicy, useCreatePolicySnapshot } from "@/features/policies/hooks";

interface PolicyLifecycleActionsProps {
  policy: PolicyObject;
}

export function PolicyLifecycleActions({ policy }: PolicyLifecycleActionsProps) {
  const router = useRouter();
  const { data: diagnostics } = useTenantDiagnostics();
  const createSnapshot = useCreatePolicySnapshot(policy.id);
  const clonePolicy = useClonePolicy(policy.id, policy.policyType);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [snapshotNote, setSnapshotNote] = useState("");
  const [cloneName, setCloneName] = useState(`${policy.displayName} Copy`);

  const writesEnabled = diagnostics?.writeOperationsEnabled ?? false;
  const cloneSupported = policy.policyType === PolicyType.SettingsCatalog;
  const writeScopeGranted = diagnostics?.graphPermissions.some(
    (permission) => permission.scope === "DeviceManagementConfiguration.ReadWrite.All" && permission.granted
  );

  const status = useMemo(() => {
    if (!diagnostics) {
      return { label: "Checking write access", variant: "default" as const };
    }

    if (writesEnabled && writeScopeGranted) {
      return { label: "Write mode enabled", variant: "primary" as const };
    }

    return { label: "Read-only mode", variant: "default" as const };
  }, [diagnostics, writeScopeGranted, writesEnabled]);

  async function handleCreateSnapshot() {
    try {
      await createSnapshot.mutateAsync({ note: snapshotNote.trim() || undefined });
      toast.success("Snapshot captured.");
      setSnapshotDialogOpen(false);
      setSnapshotNote("");
    } catch (err) {
      toast.error((err as Error).message || "Failed to capture snapshot.");
    }
  }

  async function handleClonePolicy() {
    try {
      const cloned = await clonePolicy.mutateAsync({ newName: cloneName.trim() });
      toast.success("Policy copy created.");
      setCloneDialogOpen(false);
      router.push(`/policies/${cloned.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create policy copy.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
        {!writesEnabled && (
          <Badge variant="default" className="text-xs">Snapshots only</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<HistoryIcon className="w-3.5 h-3.5" />}
          onClick={() => setSnapshotDialogOpen(true)}
        >
          Capture Version
        </Button>
        {cloneSupported && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CopyPlusIcon className="w-3.5 h-3.5" />}
            onClick={() => setCloneDialogOpen(true)}
            disabled={!writesEnabled || !writeScopeGranted}
            title={!writesEnabled || !writeScopeGranted ? "Enable write access in diagnostics first" : "Create a new policy from this one"}
          >
            Create Copy
          </Button>
        )}
      </div>

      {(!writesEnabled || !writeScopeGranted) && (
        <div className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">Write actions are off.</p>
              <p className="mt-1 text-amber-800">
                Enable <span className="font-medium">ENABLE_WRITE_OPERATIONS=true</span> and grant
                <span className="font-medium"> DeviceManagementConfiguration.ReadWrite.All</span> to create or restore policies.
              </p>
              <Link href="/diagnostics" className="mt-1 inline-flex text-amber-900 underline underline-offset-2">
                Open tenant diagnostics
              </Link>
            </div>
          </div>
        </div>
      )}

      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture Policy Version</DialogTitle>
            <DialogDescription>
              Save the current policy state before making changes so you can restore it as a new copy later.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <label htmlFor="snapshot-note" className="mb-1 block text-sm font-medium text-foreground">
              Note
            </label>
            <textarea
              id="snapshot-note"
              value={snapshotNote}
              onChange={(event) => setSnapshotNote(event.target.value)}
              placeholder="What is changing in this version?"
              rows={4}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSnapshotDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSnapshot} loading={createSnapshot.isPending}>
              Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Policy Copy</DialogTitle>
            <DialogDescription>
              This creates a new Settings Catalog policy from the current policy definition. It does not overwrite the source policy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 pb-2">
            <Input
              id="clone-name"
              label="New policy name"
              value={cloneName}
              onChange={(event) => setCloneName(event.target.value)}
              placeholder="Security Baseline vNext"
            />
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Copies are currently supported for Settings Catalog policies. Use snapshots first if you want a safe rollback point.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleClonePolicy}
              loading={clonePolicy.isPending}
              disabled={cloneName.trim().length < 3}
            >
              Create Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}