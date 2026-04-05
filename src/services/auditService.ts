/**
 * Audit Service
 *
 * Records and retrieves audit entries for all user actions in the app.
 */

import db from "@/lib/db/client";
import type { AuditRecord } from "@/domain/models";
import type { AuditAction } from "@/domain/enums";
import { safeJsonParse } from "@/lib/utils";

export interface LogAuditParams {
  tenantId: string;
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(params: LogAuditParams): Promise<void> {
    await db.auditEntry.create({
      data: {
        tenantId: params.tenantId,
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName ?? null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }

  async list(
    tenantId: string,
    opts: {
      entityId?: string;
      actorId?: string;
      action?: AuditAction;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ records: AuditRecord[]; total: number }> {
    const where = {
      tenantId,
      ...(opts.entityId ? { entityId: opts.entityId } : {}),
      ...(opts.actorId ? { actorId: opts.actorId } : {}),
      ...(opts.action ? { action: opts.action } : {}),
    };

    const [records, total] = await Promise.all([
      db.auditEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 50,
        skip: opts.offset ?? 0,
        include: { actor: true },
      }),
      db.auditEntry.count({ where }),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        actorId: r.actorId ?? undefined,
        actorName: r.actor?.name ?? undefined,
        action: r.action as AuditAction,
        entityType: r.entityType,
        entityId: r.entityId,
        entityName: r.entityName ?? undefined,
        details: r.details ? safeJsonParse<Record<string, unknown>>(r.details) ?? undefined : undefined,
        ipAddress: r.ipAddress ?? undefined,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    };
  }
}
