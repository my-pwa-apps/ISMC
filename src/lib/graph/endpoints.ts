/**
 * Microsoft Graph API endpoint constants.
 *
 * Stable v1.0 endpoints are preferred. Beta endpoints are only used
 * where features are unavailable in v1.0 (e.g., Settings Catalog,
 * Assignment Filters, Group Policy Analytics).
 *
 * Keep all endpoint paths here so they are easy to upgrade when
 * Microsoft promotes beta features to v1.0.
 */

export const GRAPH_STABLE = process.env.GRAPH_STABLE_BASE_URL ?? "https://graph.microsoft.com/v1.0";
export const GRAPH_BETA = process.env.GRAPH_BETA_BASE_URL ?? "https://graph.microsoft.com/beta";

/**
 * Returns the correct base URL for a given endpoint version.
 */
export function graphBase(version: "v1.0" | "beta" = "v1.0"): string {
  return version === "beta" ? GRAPH_BETA : GRAPH_STABLE;
}

// ============================================================
// Device Management — Settings Catalog (BETA ONLY as of 2025)
// ============================================================
export const ENDPOINTS = {
  // Settings Catalog — beta-only
  SETTINGS_CATALOG: {
    list: "/deviceManagement/configurationPolicies",
    get: (id: string) => `/deviceManagement/configurationPolicies/${id}`,
    settings: (id: string) => `/deviceManagement/configurationPolicies/${id}/settings`,
    assignments: (id: string) => `/deviceManagement/configurationPolicies/${id}/assignments`,
    version: "beta",
  },

  // Administrative Templates (Group Policy Configurations) — beta preferred
  ADMIN_TEMPLATES: {
    list: "/deviceManagement/groupPolicyConfigurations",
    get: (id: string) => `/deviceManagement/groupPolicyConfigurations/${id}`,
    definitionValues: (id: string) =>
      `/deviceManagement/groupPolicyConfigurations/${id}/definitionValues`,
    definitionValueById: (policyId: string, valueId: string) =>
      `/deviceManagement/groupPolicyConfigurations/${policyId}/definitionValues/${valueId}`,
    assignments: (id: string) => `/deviceManagement/groupPolicyConfigurations/${id}/assignments`,
    version: "beta",
  },

  // Device Configurations (classic profiles) — v1.0
  DEVICE_CONFIGS: {
    list: "/deviceManagement/deviceConfigurations",
    get: (id: string) => `/deviceManagement/deviceConfigurations/${id}`,
    assignments: (id: string) => `/deviceManagement/deviceConfigurations/${id}/assignments`,
    version: "v1.0",
  },

  // Endpoint Security (Intents — templates-based) — beta-only
  ENDPOINT_SECURITY: {
    list: "/deviceManagement/intents",
    get: (id: string) => `/deviceManagement/intents/${id}`,
    settings: (id: string) => `/deviceManagement/intents/${id}/settings`,
    categories: (id: string) => `/deviceManagement/intents/${id}/categories`,
    assignments: (id: string) => `/deviceManagement/intents/${id}/assignments`,
    templates: "/deviceManagement/templates",
    template: (id: string) => `/deviceManagement/templates/${id}`,
    version: "beta",
  },

  // Compliance Policies — v1.0
  COMPLIANCE: {
    list: "/deviceManagement/deviceCompliancePolicies",
    get: (id: string) => `/deviceManagement/deviceCompliancePolicies/${id}`,
    assignments: (id: string) =>
      `/deviceManagement/deviceCompliancePolicies/${id}/assignments`,
    version: "v1.0",
  },

  // Scripts — beta-only
  SCRIPTS: {
    list: "/deviceManagement/deviceManagementScripts",
    get: (id: string) => `/deviceManagement/deviceManagementScripts/${id}`,
    assignments: (id: string) =>
      `/deviceManagement/deviceManagementScripts/${id}/assignments`,
    version: "beta",
  },

  // Remediations (health scripts) — beta-only
  REMEDIATIONS: {
    list: "/deviceManagement/deviceHealthScripts",
    get: (id: string) => `/deviceManagement/deviceHealthScripts/${id}`,
    assignments: (id: string) =>
      `/deviceManagement/deviceHealthScripts/${id}/assignments`,
    version: "beta",
  },

  // Policy Sets — beta-only
  POLICY_SETS: {
    list: "/deviceAppManagement/policySets",
    get: (id: string) => `/deviceAppManagement/policySets/${id}`,
    items: (id: string) => `/deviceAppManagement/policySets/${id}/items`,
    version: "beta",
  },

  // Assignment Filters — beta-only
  ASSIGNMENT_FILTERS: {
    list: "/deviceManagement/assignmentFilters",
    get: (id: string) => `/deviceManagement/assignmentFilters/${id}`,
    version: "beta",
  },

  // Scope Tags — beta-only
  SCOPE_TAGS: {
    list: "/deviceManagement/roleScopeTags",
    get: (id: string) => `/deviceManagement/roleScopeTags/${id}`,
    version: "beta",
  },

  // Group Policy Analytics (migration) — beta-only
  GPO_ANALYTICS: {
    list: "/deviceManagement/groupPolicyMigrationReports",
    get: (id: string) => `/deviceManagement/groupPolicyMigrationReports/${id}`,
    settings: (id: string) =>
      `/deviceManagement/groupPolicyMigrationReports/${id}/groupPolicySettingMappings`,
    version: "beta",
  },

  // Entra Groups — v1.0
  GROUPS: {
    get: (id: string) => `/groups/${id}`,
    list: "/groups",
    version: "v1.0",
  },

  // Current user — v1.0
  ME: {
    profile: "/me",
    version: "v1.0",
  },

  // Permission/consent check — beta
  PERMISSION_GRANTS: {
    list: "/me/oauth2PermissionGrants",
    version: "v1.0",
  },
} as const;

export type EndpointVersion = "v1.0" | "beta";
