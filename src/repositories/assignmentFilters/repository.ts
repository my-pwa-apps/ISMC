/**
 * Assignment Filter repository.
 * Fetches from: /beta/deviceManagement/assignmentFilters
 */

import type { AssignmentFilterRepository } from "@/repositories/interfaces";
import type { AssignmentFilter } from "@/domain/models";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphAssignmentFilter } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { FilterMode, Platform } from "@/domain/enums";

const PLATFORM_MAP: Record<string, Platform> = {
  windows10: Platform.Windows,
  iOS: Platform.iOS,
  macOS: Platform.macOS,
  android: Platform.Android,
  androidForWork: Platform.AndroidEnterprise,
};

function mapFilter(raw: GraphAssignmentFilter): AssignmentFilter {
  const platform = raw.platform
    ? (PLATFORM_MAP[raw.platform] ?? Platform.CrossPlatform)
    : Platform.CrossPlatform;
  return {
    id: raw.id,
    displayName: raw.displayName,
    description: raw.description,
    rule: raw.rule,
    platform,
    mode: FilterMode.Include, // filters are always defined as include; exclude is at assignment level
  };
}

export class AssignmentFilterRepo implements AssignmentFilterRepository {
  constructor(private readonly client: GraphClient) {}

  async listFilters(): Promise<AssignmentFilter[]> {
    const raw = await this.client.getAll<GraphAssignmentFilter>(
      ENDPOINTS.ASSIGNMENT_FILTERS.list,
      "beta"
    );
    return raw.map(mapFilter);
  }

  async getFilter(id: string): Promise<AssignmentFilter> {
    const raw = await this.client.get<GraphAssignmentFilter>(
      ENDPOINTS.ASSIGNMENT_FILTERS.get(id),
      "beta"
    );
    return mapFilter(raw);
  }
}
