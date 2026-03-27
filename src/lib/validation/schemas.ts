/**
 * Zod validation schemas for API request/response objects.
 */

import { z } from "zod";
import { Platform, PolicyType } from "@/domain/enums";

// ============================================================
// Generic helpers
// ============================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

// ============================================================
// Search query schema
// ============================================================

export const SearchQuerySchema = z.object({
  text: z.string().min(1).max(500),
  policyTypes: z.array(z.nativeEnum(PolicyType)).optional(),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  scopeTagIds: z.array(z.string()).optional(),
  groupIds: z.array(z.string()).optional(),
  modifiedAfter: z.string().datetime().optional(),
  modifiedBefore: z.string().datetime().optional(),
  searchSettings: z.boolean().default(true),
  searchAssignments: z.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

// ============================================================
// Policy list query
// ============================================================

export const PolicyListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  policyType: z.nativeEnum(PolicyType).optional(),
  platform: z.nativeEnum(Platform).optional(),
  scopeTagId: z.string().optional(),
  groupId: z.string().optional(),
  search: z.string().optional(),
  unassignedOnly: z.coerce.boolean().optional(),
  missingTagsOnly: z.coerce.boolean().optional(),
  staleOnly: z.coerce.boolean().optional(),
});

// ============================================================
// Comparison
// ============================================================

export const CompareRequestSchema = z.object({
  policyIds: z.array(z.string().uuid()).min(2).max(2),
});

// ============================================================
// Snapshot
// ============================================================

export const SnapshotCreateSchema = z.object({
  policyId: z.string().uuid(),
  note: z.string().max(1000).optional(),
});

export const SnapshotRestoreSchema = z.object({
  newName: z.string().trim().min(3).max(200),
});

export const PolicyCloneSchema = z.object({
  newName: z.string().trim().min(3).max(200),
  policyType: z.nativeEnum(PolicyType).optional(),
});

export const WriteModeUpdateSchema = z.object({
  enabled: z.boolean(),
});

// ============================================================
// Note
// ============================================================

export const NoteCreateSchema = z.object({
  policyId: z.string(),
  content: z.string().min(1).max(5000),
});

// ============================================================
// Tag
// ============================================================

export const TagUpsertSchema = z.object({
  policyId: z.string(),
  key: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/),
  value: z.string().max(200),
});

// ============================================================
// GPO Import
// ============================================================

export const GpoImportSchema = z.object({
  importName: z.string().min(1).max(200),
  sourceData: z.record(z.unknown()),
});

// ============================================================
// Type exports
// ============================================================

export type PolicyListQuery = z.infer<typeof PolicyListQuerySchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type CompareRequest = z.infer<typeof CompareRequestSchema>;
export type SnapshotCreateInput = z.infer<typeof SnapshotCreateSchema>;
export type SnapshotRestoreInput = z.infer<typeof SnapshotRestoreSchema>;
export type PolicyCloneInput = z.infer<typeof PolicyCloneSchema>;
export type WriteModeUpdateInput = z.infer<typeof WriteModeUpdateSchema>;
export type NoteCreateInput = z.infer<typeof NoteCreateSchema>;
