/**
 * Tenant-scoped Prisma client wrapper.
 *
 * Wraps the base Prisma client to automatically inject `tenantId` into
 * every query for tenant-aware models. This prevents accidental cross-tenant
 * data leakage if a developer forgets a WHERE clause.
 *
 * Usage:
 *   const tenantDb = createTenantDb(tenantId);
 *   const snapshots = await tenantDb.policySnapshot.findMany({});
 *   // ↑ automatically scoped to `WHERE tenantId = <tenantId>`
 */

import db from "@/lib/db/client";

/**
 * Returns a Prisma-like accessor that auto-adds tenantId to queries
 * for tenant-scoped models (PolicySnapshot, AuditEntry).
 */
export function createTenantDb(tenantId: string) {
  return {
    policySnapshot: {
      findMany(args: Parameters<typeof db.policySnapshot.findMany>[0] = {}) {
        return db.policySnapshot.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
      findFirst(args: Parameters<typeof db.policySnapshot.findFirst>[0] = {}) {
        return db.policySnapshot.findFirst({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
      findFirstOrThrow(args: Parameters<typeof db.policySnapshot.findFirstOrThrow>[0] = {}) {
        return db.policySnapshot.findFirstOrThrow({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
      create(args: Parameters<typeof db.policySnapshot.create>[0]) {
        return db.policySnapshot.create({
          ...args,
          data: { ...args.data, tenantId },
        });
      },
      deleteMany(args: Parameters<typeof db.policySnapshot.deleteMany>[0] = {}) {
        return db.policySnapshot.deleteMany({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
      count(args: Parameters<typeof db.policySnapshot.count>[0] = {}) {
        return db.policySnapshot.count({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
    },

    auditEntry: {
      findMany(args: Parameters<typeof db.auditEntry.findMany>[0] = {}) {
        return db.auditEntry.findMany({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
      create(args: Parameters<typeof db.auditEntry.create>[0]) {
        return db.auditEntry.create({
          ...args,
          data: { ...args.data, tenantId },
        });
      },
      count(args: Parameters<typeof db.auditEntry.count>[0] = {}) {
        return db.auditEntry.count({
          ...args,
          where: { ...args?.where, tenantId },
        });
      },
    },
  };
}
