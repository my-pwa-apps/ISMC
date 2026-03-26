/**
 * Snapshot Service
 *
 * Creates and manages point-in-time snapshots of policy objects.
 * Snapshots are stored in the local database for offline comparison
 * and rollback guidance.
 */

import db from "@/lib/db/client";
import type { PolicyObject, PolicySnapshot } from "@/domain/models";
import type { PolicyType } from "@/domain/enums";
import logger from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils";

export class SnapshotService {
  /**
   * Create a snapshot of a policy.
   */
  async createSnapshot(
    policy: PolicyObject,
    note?: string,
    userId?: string
  ): Promise<PolicySnapshot> {
    const log = logger.child({ service: "Snapshot", method: "createSnapshot" });

    const record = await db.policySnapshot.create({
      data: {
        policyId: policy.id,
        policyType: policy.policyType,
        displayName: policy.displayName,
        tenantId: policy.tenantId,
        snapshotData: JSON.stringify(policy),
        rawGraphData: policy.rawGraphPayload ? JSON.stringify(policy.rawGraphPayload) : null,
        note,
        createdById: userId ?? null,
      },
    });

    log.info(
      { snapshotId: record.id, policyId: policy.id },
      "Policy snapshot created"
    );

    return toSnapshot(record);
  }

  /**
   * List all snapshots for a policy, newest first.
   */
  async listSnapshots(policyId: string, tenantId: string): Promise<PolicySnapshot[]> {
    const records = await db.policySnapshot.findMany({
      where: { policyId, tenantId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(toSnapshot);
  }

  /**
   * Get a specific snapshot.
   */
  async getSnapshot(snapshotId: string, tenantId: string): Promise<PolicySnapshot> {
    const record = await db.policySnapshot.findFirstOrThrow({
      where: { id: snapshotId, tenantId },
    });
    return toSnapshot(record);
  }

  /**
   * List all snapshots for a tenant, newest first.
   */
  async listTenantSnapshots(tenantId: string, limit = 50): Promise<PolicySnapshot[]> {
    const records = await db.policySnapshot.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return records.map(toSnapshot);
  }

  /**
   * Delete a snapshot.
   */
  async deleteSnapshot(snapshotId: string, tenantId: string): Promise<void> {
    await db.policySnapshot.deleteMany({ where: { id: snapshotId, tenantId } });
  }
}

// ============================================================
// Mapper
// ============================================================

interface SnapshotRecord {
  id: string;
  policyId: string;
  policyType: string;
  displayName: string;
  tenantId: string;
  snapshotData: string;
  note: string | null;
  createdAt: Date;
  createdById: string | null;
  createdBy?: { name: string | null } | null;
}

function toSnapshot(record: SnapshotRecord): PolicySnapshot {
  const snapshotData = safeJsonParse<PolicyObject>(record.snapshotData);

  if (!snapshotData) {
    throw new Error(`Snapshot payload is corrupted: ${record.id}`);
  }

  return {
    id: record.id,
    policyId: record.policyId,
    policyType: record.policyType as PolicyType,
    displayName: record.displayName,
    tenantId: record.tenantId,
    snapshotData,
    note: record.note ?? undefined,
    createdAt: record.createdAt.toISOString(),
    createdById: record.createdById ?? undefined,
    createdByName: record.createdBy?.name ?? undefined,
  };
}
