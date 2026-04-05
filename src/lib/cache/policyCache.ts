/**
 * Simple TTL cache for server-side policy list results.
 *
 * Prevents repeated full-tenant Graph API fetches within a short window.
 * Used by the search service and dashboard to avoid re-fetching the
 * entire policy inventory on every request.
 *
 * Cache is per-tenant and invalidated after the configured TTL.
 */

import type { PolicyObject } from "@/domain/models";
import logger from "@/lib/logger";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  policies: PolicyObject[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get cached policies for a tenant, or undefined if cache is stale/missing.
 */
export function getCachedPolicies(tenantId: string): PolicyObject[] | undefined {
  const entry = cache.get(tenantId);
  if (!entry) return undefined;

  const ttl = Number(process.env.POLICY_CACHE_TTL_MS) || DEFAULT_TTL_MS;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(tenantId);
    return undefined;
  }

  logger.debug({ tenantId, age: Date.now() - entry.timestamp }, "Policy cache hit");
  return entry.policies;
}

/**
 * Store policies in the cache for a tenant.
 */
export function setCachedPolicies(tenantId: string, policies: PolicyObject[]): void {
  cache.set(tenantId, {
    policies,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate the cache for a tenant (e.g., after a write operation).
 */
export function invalidatePolicyCache(tenantId: string): void {
  cache.delete(tenantId);
}

/**
 * Clear all cached entries. Useful for testing.
 */
export function clearPolicyCache(): void {
  cache.clear();
}
