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

    // Enforce retention limits asynchronously (non-blocking)
    this.enforceRetention(policy.id, policy.tenantId).catch((err) => {
      log.warn({ err, policyId: policy.id }, "Failed to enforce snapshot retention");
    });

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
    return toSnapshotsSafe(records);
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
    return toSnapshotsSafe(records);
  }

  /**
   * Delete a snapshot.
   */
  async deleteSnapshot(snapshotId: string, tenantId: string): Promise<void> {
    await db.policySnapshot.deleteMany({ where: { id: snapshotId, tenantId } });
  }

  // ============================================================
  // Retention
  // ============================================================

  /**
   * Enforce snapshot retention limits per policy.
   *
   * Deletes the oldest snapshots when a policy exceeds the configured
   * maximum. Called automatically after creating a new snapshot.
   *
   * @param policyId - The policy to enforce limits for
   * @param tenantId - Tenant scope
   * @param maxPerPolicy - Maximum snapshots to keep per policy (default: 50)
   */
  async enforceRetention(
    policyId: string,
    tenantId: string,
    maxPerPolicy: number = Number(process.env.SNAPSHOT_MAX_PER_POLICY) || 50
  ): Promise<number> {
    const log = logger.child({ service: "Snapshot", method: "enforceRetention" });

    const count = await db.policySnapshot.count({
      where: { policyId, tenantId },
    });

    if (count <= maxPerPolicy) return 0;

    // Find IDs of snapshots to delete (oldest first, beyond the limit)
    const toDelete = await db.policySnapshot.findMany({
      where: { policyId, tenantId },
      orderBy: { createdAt: "desc" },
      skip: maxPerPolicy,
      select: { id: true },
    });

    if (toDelete.length === 0) return 0;

    const deleteResult = await db.policySnapshot.deleteMany({
      where: {
        id: { in: toDelete.map((s) => s.id) },
        tenantId,
      },
    });

    log.info(
      { policyId, tenantId, deleted: deleteResult.count, maxPerPolicy },
      "Snapshot retention enforced"
    );

    return deleteResult.count;
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
    logger.error({ snapshotId: record.id, policyId: record.policyId }, "Snapshot payload is corrupted — skipping");
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

/**
 * Safely map an array of snapshot records, skipping corrupted entries
 * instead of crashing the entire list operation.
 */
function toSnapshotsSafe(records: SnapshotRecord[]): PolicySnapshot[] {
  const snapshots: PolicySnapshot[] = [];
  for (const record of records) {
    try {
      snapshots.push(toSnapshot(record));
    } catch {
      // Logged inside toSnapshot — skip this record
    }
  }
  return snapshots;
}
