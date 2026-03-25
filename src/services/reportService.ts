/**
 * Report Service
 *
 * Generates structured reports from the policy inventory.
 */

import type { PolicyObject, PolicyReport, ReportRow } from "@/domain/models";
import type { ReportType } from "@/domain/models";
import { isStale, getPolicyTypeLabel, getPlatformLabel, formatAbsoluteDate } from "@/lib/utils";
import { OverlapSeverity } from "@/domain/enums";

export class ReportService {
  async generateReport(
    type: ReportType,
    policies: PolicyObject[],
    tenantId: string
  ): Promise<PolicyReport> {
    switch (type) {
      case "unassigned-policies":
        return this.unassignedPolicies(policies, tenantId);
      case "missing-scope-tags":
        return this.missingScopeTags(policies, tenantId);
      case "stale-policies":
        return this.stalePolicies(policies, tenantId);
      case "overlapping-assignments":
        return this.overlappingAssignments(policies, tenantId);
      case "conflicting-settings":
        return this.conflictingSettings(policies, tenantId);
      case "duplicate-policies":
        return this.duplicatePolicies(policies, tenantId);
      case "settings-usage":
        return this.settingsUsage(policies, tenantId);
      case "migration-readiness":
        return this.migrationReadiness(policies, tenantId);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }

  private unassignedPolicies(policies: PolicyObject[], tenantId: string): PolicyReport {
    const unassigned = policies.filter((p) => p.assignments.length === 0);
    const rows: ReportRow[] = unassigned.map((p) => ({
      policyId: p.id,
      displayName: p.displayName,
      policyType: getPolicyTypeLabel(p.policyType),
      platform: getPlatformLabel(p.platform),
      createdDate: formatAbsoluteDate(p.createdDateTime),
      lastModified: formatAbsoluteDate(p.lastModifiedDateTime),
      scopeTagCount: p.scopeTags.length,
    }));

    return {
      type: "unassigned-policies",
      generatedAt: new Date().toISOString(),
      tenantId,
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Policy Name", type: "string" },
        { key: "policyType", label: "Type", type: "string" },
        { key: "platform", label: "Platform", type: "string" },
        { key: "createdDate", label: "Created", type: "date" },
        { key: "lastModified", label: "Last Modified", type: "date" },
        { key: "scopeTagCount", label: "Scope Tags", type: "number" },
      ],
      rows,
      summary: {
        total: policies.length,
        unassigned: unassigned.length,
        percentage: Math.round((unassigned.length / Math.max(1, policies.length)) * 100),
      },
    };
  }

  private missingScopeTags(policies: PolicyObject[], tenantId: string): PolicyReport {
    const missing = policies.filter((p) => p.scopeTags.length === 0);
    const rows: ReportRow[] = missing.map((p) => ({
      policyId: p.id,
      displayName: p.displayName,
      policyType: getPolicyTypeLabel(p.policyType),
      platform: getPlatformLabel(p.platform),
      assignmentCount: p.assignments.length,
      lastModified: formatAbsoluteDate(p.lastModifiedDateTime),
    }));

    return {
      type: "missing-scope-tags",
      generatedAt: new Date().toISOString(),
      tenantId,
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Policy Name", type: "string" },
        { key: "policyType", label: "Type", type: "string" },
        { key: "platform", label: "Platform", type: "string" },
        { key: "assignmentCount", label: "Assignments", type: "number" },
        { key: "lastModified", label: "Last Modified", type: "date" },
      ],
      rows,
    };
  }

  private stalePolicies(policies: PolicyObject[], tenantId: string): PolicyReport {
    const thresholdDays = 90;
    const stale = policies.filter((p) => isStale(p.lastModifiedDateTime, thresholdDays));
    const rows: ReportRow[] = stale.map((p) => ({
      policyId: p.id,
      displayName: p.displayName,
      policyType: getPolicyTypeLabel(p.policyType),
      platform: getPlatformLabel(p.platform),
      lastModified: formatAbsoluteDate(p.lastModifiedDateTime),
      assignmentCount: p.assignments.length,
      daysSinceModified: Math.floor(
        (Date.now() - new Date(p.lastModifiedDateTime).getTime()) / 86400000
      ),
    }));

    return {
      type: "stale-policies",
      generatedAt: new Date().toISOString(),
      tenantId,
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Policy Name", type: "string" },
        { key: "policyType", label: "Type", type: "string" },
        { key: "platform", label: "Platform", type: "string" },
        { key: "lastModified", label: "Last Modified", type: "date" },
        { key: "daysSinceModified", label: "Days Since Modified", type: "number" },
        { key: "assignmentCount", label: "Assignments", type: "number" },
      ],
      rows,
      summary: { stalePolicies: stale.length, thresholdDays },
    };
  }

  private overlappingAssignments(policies: PolicyObject[], tenantId: string): PolicyReport {
    const overlapping = policies.filter(
      (p) => (p.overlapSeverity ?? OverlapSeverity.None) !== OverlapSeverity.None
    );
    const rows: ReportRow[] = overlapping.map((p) => ({
      policyId: p.id,
      displayName: p.displayName,
      policyType: getPolicyTypeLabel(p.policyType),
      platform: getPlatformLabel(p.platform),
      overlapSeverity: p.overlapSeverity ?? OverlapSeverity.None,
      conflictingPolicies: (p.conflictingPolicyIds ?? []).length,
      assignmentCount: p.assignments.length,
    }));

    return {
      type: "overlapping-assignments",
      tenantId,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Policy Name", type: "string" },
        { key: "policyType", label: "Type", type: "string" },
        { key: "overlapSeverity", label: "Severity", type: "string" },
        { key: "conflictingPolicies", label: "Conflicting Policies", type: "number" },
      ],
      rows,
    };
  }

  private conflictingSettings(policies: PolicyObject[], tenantId: string): PolicyReport {
    // Find settings that appear in more than one policy with different values
    const settingOccurrences = new Map<string, Array<{ policyId: string; displayName: string; value: unknown }>>();

    for (const policy of policies) {
      for (const setting of policy.settings ?? []) {
        const key = setting.id;
        if (!settingOccurrences.has(key)) settingOccurrences.set(key, []);
        settingOccurrences.get(key)!.push({
          policyId: policy.id,
          displayName: policy.displayName,
          value: setting.value,
        });
      }
    }

    const rows: ReportRow[] = [];
    for (const [settingId, occurrences] of settingOccurrences.entries()) {
      if (occurrences.length < 2) continue;
      const values = new Set(occurrences.map((o) => JSON.stringify(o.value)));
      if (values.size > 1) {
        for (const occ of occurrences) {
          rows.push({
            settingId,
            policyId: occ.policyId,
            policyName: occ.displayName,
            value: JSON.stringify(occ.value),
          });
        }
      }
    }

    return {
      type: "conflicting-settings",
      tenantId,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: [
        { key: "settingId", label: "Setting", type: "string" },
        { key: "policyName", label: "Policy", type: "string" },
        { key: "value", label: "Value", type: "string" },
      ],
      rows,
    };
  }

  private duplicatePolicies(policies: PolicyObject[], tenantId: string): PolicyReport {
    // Detect policies with identical names or identical setting counts + same type
    const nameMap = new Map<string, PolicyObject[]>();
    for (const p of policies) {
      const key = `${p.policyType}::${p.displayName.toLowerCase().trim()}`;
      if (!nameMap.has(key)) nameMap.set(key, []);
      nameMap.get(key)!.push(p);
    }

    const rows: ReportRow[] = [];
    for (const [, group] of nameMap.entries()) {
      if (group.length > 1) {
        for (const p of group) {
          rows.push({
            policyId: p.id,
            displayName: p.displayName,
            policyType: getPolicyTypeLabel(p.policyType),
            duplicateGroupSize: group.length,
            lastModified: formatAbsoluteDate(p.lastModifiedDateTime),
          });
        }
      }
    }

    return {
      type: "duplicate-policies",
      tenantId,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Policy Name", type: "string" },
        { key: "policyType", label: "Type", type: "string" },
        { key: "duplicateGroupSize", label: "Duplicates", type: "number" },
        { key: "lastModified", label: "Last Modified", type: "date" },
      ],
      rows,
    };
  }

  private settingsUsage(policies: PolicyObject[], tenantId: string): PolicyReport {
    const settingCount = new Map<string, { displayName: string; count: number; policies: string[] }>();

    for (const policy of policies) {
      for (const setting of policy.settings ?? []) {
        const existing = settingCount.get(setting.id);
        if (existing) {
          existing.count++;
          existing.policies.push(policy.displayName);
        } else {
          settingCount.set(setting.id, {
            displayName: setting.displayName,
            count: 1,
            policies: [policy.displayName],
          });
        }
      }
    }

    const rows: ReportRow[] = [...settingCount.entries()]
      .filter(([, v]) => v.count > 1)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 100)
      .map(([id, v]) => ({
        settingId: id,
        displayName: v.displayName,
        policyCount: v.count,
        policyNames: v.policies.join(", "),
      }));

    return {
      type: "settings-usage",
      tenantId,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: [
        { key: "displayName", label: "Setting Name", type: "string" },
        { key: "policyCount", label: "Used In (policies)", type: "number" },
        { key: "policyNames", label: "Policies", type: "string" },
      ],
      rows,
    };
  }

  private migrationReadiness(policies: PolicyObject[], tenantId: string): PolicyReport {
    // Summarise GPO migration readiness at a high level
    const rows: ReportRow[] = [
      {
        category: "Settings Catalog Policies",
        count: policies.filter((p) => p.policyType === "SettingsCatalog").length,
        notes: "Modern Intune policy format",
      },
      {
        category: "Administrative Templates",
        count: policies.filter((p) => p.policyType === "AdministrativeTemplate").length,
        notes: "ADMX-backed — direct GPO equivalents",
      },
      {
        category: "Device Configuration",
        count: policies.filter((p) => p.policyType === "DeviceConfiguration").length,
        notes: "Classic configuration profiles",
      },
    ];

    return {
      type: "migration-readiness",
      tenantId,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: [
        { key: "category", label: "Category", type: "string" },
        { key: "count", label: "Policy Count", type: "number" },
        { key: "notes", label: "Notes", type: "string" },
      ],
      rows,
    };
  }
}
