/**
 * Search Service
 *
 * Full-text search across policy objects using Fuse.js for fuzzy matching.
 * Supports searching across policy names, descriptions, settings, and assignments.
 */

import Fuse, { type IFuseOptions, type FuseResultMatch } from "fuse.js";
import type { PolicyObject, SearchQuery, SearchResult, SearchHighlight } from "@/domain/models";

interface SearchDocument {
  policyId: string;
  policyName: string;
  policyType: string;
  platform: string;
  description: string;
  settingNames: string;
  settingPaths: string;
  cspPaths: string;
  assignmentGroups: string;
  scopeTagNames: string;
  odataType: string;
  policy: PolicyObject;
}

function buildDocument(policy: PolicyObject): SearchDocument {
  return {
    policyId: policy.id,
    policyName: policy.displayName,
    policyType: policy.policyType,
    platform: policy.platform,
    description: policy.description ?? "",
    settingNames: (policy.settings ?? []).map((s) => s.displayName).join(" | "),
    settingPaths: (policy.settings ?? []).map((s) => s.path ?? "").join(" | "),
    cspPaths: (policy.settings ?? []).map((s) => s.cspPath ?? "").join(" | "),
    assignmentGroups: policy.assignments
      .map((a) => a.target.groupDisplayName ?? a.target.groupId ?? "")
      .join(" | "),
    scopeTagNames: policy.scopeTags.map((t) => t.displayName).join(" | "),
    odataType: policy.odataType ?? "",
    policy,
  };
}

const FUSE_OPTIONS: IFuseOptions<SearchDocument> = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.3,
  keys: [
    { name: "policyName", weight: 3 },
    { name: "description", weight: 2 },
    { name: "settingNames", weight: 2 },
    { name: "settingPaths", weight: 1.5 },
    { name: "cspPaths", weight: 1 },
    { name: "assignmentGroups", weight: 1 },
    { name: "scopeTagNames", weight: 1 },
    { name: "policyType", weight: 0.5 },
    { name: "platform", weight: 0.5 },
  ],
};

export class SearchService {
  search(policies: PolicyObject[], query: SearchQuery): SearchResult[] {
    let filtered = this.preFilter(policies, query);

    if (!query.text.trim()) {
      // No text query — return pre-filtered results sorted by last modified
      return filtered
        .sort(
          (a, b) =>
            new Date(b.lastModifiedDateTime).getTime() -
            new Date(a.lastModifiedDateTime).getTime()
        )
        .map((p) => ({
          policyId: p.id,
          policyName: p.displayName,
          policyType: p.policyType,
          platform: p.platform,
          highlights: [],
          relevanceScore: 1,
        }));
    }

    const documents = filtered.map(buildDocument);
    const fuse = new Fuse(documents, FUSE_OPTIONS);
    const results = fuse.search(query.text);

    return results.map((result) => ({
      policyId: result.item.policyId,
      policyName: result.item.policyName,
      policyType: result.item.policy.policyType,
      platform: result.item.policy.platform,
      highlights: buildHighlights(result.matches ?? []),
      relevanceScore: 1 - (result.score ?? 0),
    }));
  }

  private preFilter(policies: PolicyObject[], query: SearchQuery): PolicyObject[] {
    return policies.filter((p) => {
      if (query.policyTypes?.length && !query.policyTypes.includes(p.policyType)) return false;
      if (query.platforms?.length && !query.platforms.includes(p.platform)) return false;
      if (query.scopeTagIds?.length) {
        const pTagIds = p.scopeTags.map((t) => t.id);
        if (!query.scopeTagIds.some((id) => pTagIds.includes(id))) return false;
      }
      if (query.modifiedAfter) {
        if (new Date(p.lastModifiedDateTime) < new Date(query.modifiedAfter)) return false;
      }
      if (query.modifiedBefore) {
        if (new Date(p.lastModifiedDateTime) > new Date(query.modifiedBefore)) return false;
      }
      return true;
    });
  }
}

function buildHighlights(matches: readonly FuseResultMatch[]): SearchHighlight[] {
  return matches
    .filter((m) => m.value && m.indices.length > 0)
    .slice(0, 3)
    .map((m) => ({
      field: m.key ?? "unknown",
      excerpt: truncateExcerpt(m.value ?? "", m.indices),
      ranges: m.indices.slice(0, 5).map(([start, end]) => ({ start, end })),
    }));
}

function truncateExcerpt(
  text: string,
  indices: ReadonlyArray<[number, number]>
): string {
  if (!indices.length) return text.slice(0, 100);
  const [start] = indices[0];
  const excerptStart = Math.max(0, start - 30);
  return (excerptStart > 0 ? "…" : "") + text.slice(excerptStart, excerptStart + 150);
}
