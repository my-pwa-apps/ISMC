/**
 * Graph permission definitions and runtime permission checking.
 *
 * Used by the Tenant Diagnostics page and by API routes to guard
 * write operations behind capability checks.
 */

import type { PermissionDiagnostic } from "@/domain/models";

// ============================================================
// Required permission definitions
// ============================================================

export const REQUIRED_PERMISSIONS: PermissionDiagnostic[] = [
  {
    scope: "DeviceManagementConfiguration.Read.All",
    granted: false,
    required: true,
    description: "Read Settings Catalog, Admin Templates, and Device Configuration policies",
  },
  {
    scope: "DeviceManagementManagedDevices.Read.All",
    granted: false,
    required: true,
    description: "Read managed device information for assignment impact analysis",
  },
  {
    scope: "DeviceManagementApps.Read.All",
    granted: false,
    required: true,
    description: "Read app protection and app configuration policies",
  },
  {
    scope: "Group.Read.All",
    granted: false,
    required: true,
    description: "Resolve Entra group names for assignment display",
  },
  {
    scope: "Policy.Read.All",
    granted: false,
    required: true,
    description: "Read conditional access and other Entra policies",
  },
  {
    scope: "RoleManagement.Read.Directory",
    granted: false,
    required: true,
    description: "Read role assignments and scope tag membership",
  },
  {
    scope: "DeviceManagementConfiguration.ReadWrite.All",
    granted: false,
    required: false,
    description: "Create, clone, and update policies (write mode only)",
  },
  {
    scope: "DeviceManagementManagedDevices.ReadWrite.All",
    granted: false,
    required: false,
    description:
      "Modify assignment targets and filters (write mode only)",
  },
];

// ============================================================
// Runtime permission check
// ============================================================

/**
 * Parse scopes from the token and annotate the permission list.
 * The token's `scp` claim contains space-delimited delegated scopes.
 */
export function annotatePermissions(tokenScopes: string): PermissionDiagnostic[] {
  const granted = new Set(tokenScopes.split(" ").map((s) => s.trim().toLowerCase()));

  return REQUIRED_PERMISSIONS.map((p) => ({
    ...p,
    granted: granted.has(p.scope.toLowerCase()),
  }));
}

/**
 * Returns true if the token includes all required read permissions.
 */
export function hasRequiredReadPermissions(tokenScopes: string): boolean {
  const annotated = annotatePermissions(tokenScopes);
  return annotated.filter((p) => p.required).every((p) => p.granted);
}

/**
 * Returns true if the token includes write permissions.
 */
export function hasWritePermissions(tokenScopes: string): boolean {
  const writeScope = "DeviceManagementConfiguration.ReadWrite.All";
  return tokenScopes.toLowerCase().includes(writeScope.toLowerCase());
}
