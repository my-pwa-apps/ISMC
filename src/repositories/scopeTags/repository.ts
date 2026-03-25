/**
 * Scope Tag repository.
 * Fetches from: /beta/deviceManagement/roleScopeTags
 */

import type { ScopeTagRepository } from "@/repositories/interfaces";
import type { ScopeTag } from "@/domain/models";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphRoleScopeTag } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";

export class ScopeTagRepo implements ScopeTagRepository {
  constructor(private readonly client: GraphClient) {}

  async listScopeTags(): Promise<ScopeTag[]> {
    const raw = await this.client.getAll<GraphRoleScopeTag>(
      ENDPOINTS.SCOPE_TAGS.list,
      "beta"
    );
    return raw.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      description: r.description,
    }));
  }

  async getScopeTag(id: string): Promise<ScopeTag> {
    const raw = await this.client.get<GraphRoleScopeTag>(
      ENDPOINTS.SCOPE_TAGS.get(id),
      "beta"
    );
    return { id: raw.id, displayName: raw.displayName, description: raw.description };
  }
}
