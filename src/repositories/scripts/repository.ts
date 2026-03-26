/**
 * Script / Remediation repository.
 * Fetches from:
 *   /beta/deviceManagement/deviceManagementScripts (PowerShell scripts)
 *   /beta/deviceManagement/deviceHealthScripts (Proactive Remediations)
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphAssignment } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { Platform, PolicyStatus, PolicyType, TargetingModel } from "@/domain/enums";
import { mapWithConcurrency } from "@/lib/utils";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphListConcurrency } from "../shared/graphConcurrency";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";

interface GraphScript {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  roleScopeTagIds?: string[];
  runAsAccount?: string;
  enforcementMode?: string;
  fileName?: string;
  [key: string]: unknown;
}

function mapScript(
  raw: GraphScript,
  tenantId: string,
  assignments: GraphAssignment[],
  policyType: PolicyType
): PolicyObject {
  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType,
    platform: Platform.Windows, // Scripts are currently Windows/macOS; expand as needed
    odataType: `#microsoft.graph.${policyType === PolicyType.Script ? "deviceManagementScript" : "deviceHealthScript"}`,
    status: PolicyStatus.Active,
    createdDateTime: raw.createdDateTime,
    lastModifiedDateTime: raw.lastModifiedDateTime,
    settingCount: 1, // A script is effectively one "setting"
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Device,
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

export class ScriptRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string,
    private readonly mode: "scripts" | "remediations" = "scripts"
  ) {}

  private get listPath(): string {
    return this.mode === "remediations"
      ? ENDPOINTS.REMEDIATIONS.list
      : ENDPOINTS.SCRIPTS.list;
  }

  private assignmentsPath(id: string): string {
    return this.mode === "remediations"
      ? ENDPOINTS.REMEDIATIONS.assignments(id)
      : ENDPOINTS.SCRIPTS.assignments(id);
  }

  private get policyType(): PolicyType {
    return this.mode === "remediations" ? PolicyType.Remediation : PolicyType.Script;
  }

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const params = new URLSearchParams({ $top: String(getGraphFetchPageSize()) });
    const path = `${this.listPath}?${params}`;
    const raw = await this.client.getAll<GraphScript>(path, "beta");
    const policies = await mapWithConcurrency(raw, getGraphListConcurrency(), async (p) => {
        const assignments = await this.client
          .getAll<GraphAssignment>(this.assignmentsPath(p.id), "beta")
          .catch(() => []);
        return mapScript(p, this.tenantId, assignments, this.policyType);
      });
    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const getPath = this.mode === "remediations"
      ? ENDPOINTS.REMEDIATIONS.get(id)
      : `${ENDPOINTS.SCRIPTS.list}/${id}`;
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphScript>(getPath, "beta"),
      this.client.getAll<GraphAssignment>(this.assignmentsPath(id), "beta"),
    ]);
    return mapScript(raw, this.tenantId, assignments, this.policyType);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    return this.getPolicy(id);
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(this.assignmentsPath(policyId), "beta");
    return mapAssignments(raw);
  }
}
