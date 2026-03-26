/**
 * Repository factory.
 *
 * Creates either real Graph-backed repositories (production)
 * or mock repositories (development / testing).
 *
 * Usage:
 *   const registry = createRepositoryRegistry(accessToken, tenantId);
 *   const policies = await registry.settingsCatalog.listPolicies();
 */

import type { RepositoryRegistry } from "./interfaces";
import { getMockRegistry } from "./mock";
import { SettingsCatalogRepository } from "./settingsCatalog/repository";
import { AdminTemplatesRepository } from "./adminTemplates/repository";
import { DeviceConfigRepository } from "./deviceConfig/repository";
import { EndpointSecurityRepository } from "./endpointSecurity/repository";
import { ComplianceRepository } from "./compliance/repository";
import { AssignmentFilterRepo } from "./assignmentFilters/repository";
import { ScopeTagRepo } from "./scopeTags/repository";
import { ScriptRepository } from "./scripts/repository";
import { createGraphClient } from "@/lib/graph/client";

/**
 * Create a full registry of repositories.
 *
 * In mock mode: returns in-memory mock repositories (no network calls).
 * In production mode: creates real Graph-backed repositories.
 *
 * @param accessToken - The user's Graph access token (server-side only)
 * @param tenantId - The Entra tenant ID
 * @param correlationId - Optional request correlation ID for tracing
 */
export function createRepositoryRegistry(
  accessToken: string,
  tenantId: string,
  correlationId?: string,
  useMockRegistry = false
): RepositoryRegistry {
  if (useMockRegistry) {
    return getMockRegistry();
  }

  const client = createGraphClient(accessToken, correlationId);

  return {
    settingsCatalog: new SettingsCatalogRepository(client, tenantId),
    adminTemplates: new AdminTemplatesRepository(client, tenantId),
    deviceConfig: new DeviceConfigRepository(client, tenantId),
    endpointSecurity: new EndpointSecurityRepository(client, tenantId, "endpoint-security"),
    securityBaseline: new EndpointSecurityRepository(client, tenantId, "security-baseline"),
    compliance: new ComplianceRepository(client, tenantId),
    scripts: new ScriptRepository(client, tenantId),
    remediations: new ScriptRepository(client, tenantId, "remediations"),
    assignmentFilters: new AssignmentFilterRepo(client),
    scopeTags: new ScopeTagRepo(client),
  };
}
