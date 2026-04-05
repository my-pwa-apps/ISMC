/**
 * Shared helper to enrich raw policy objects with their assignments.
 *
 * This pattern was previously duplicated across 7 repository implementations.
 * Now there's a single function that all repositories delegate to.
 */

import type { GraphClient } from "@/lib/graph/client";
import type { GraphAssignment } from "@/lib/graph/types";
import type { PolicyObject } from "@/domain/models";
import { mapWithConcurrency } from "@/lib/utils";
import { getGraphListConcurrency } from "./graphConcurrency";
import type { EndpointVersion } from "@/lib/graph/endpoints";
import logger from "@/lib/logger";

/**
 * Fetch assignments for each raw policy in parallel (bounded concurrency)
 * and invoke the caller-supplied mapper to produce domain PolicyObjects.
 *
 * If an individual assignment fetch fails, the policy is mapped with an
 * empty assignments array and a warning is logged.
 *
 * NOTE: The mapper receives raw GraphAssignment[] (not domain PolicyAssignment[])
 * because each mapper calls mapAssignments() internally with its own logic.
 *
 * @param client        – The authenticated Graph client
 * @param rawPolicies   – The raw Graph API response objects
 * @param assignmentUrl – Produces the assignments endpoint URL for a given raw policy
 * @param apiVersion    – "v1.0" or "beta"
 * @param mapper        – Transforms (rawPolicy, rawAssignments) → PolicyObject
 * @param logContext    – Context for log entries (e.g., repository name)
 */
export async function enrichPoliciesWithAssignments<TRaw>(
  client: GraphClient,
  rawPolicies: TRaw[],
  assignmentUrl: (raw: TRaw) => string,
  apiVersion: EndpointVersion,
  mapper: (raw: TRaw, assignments: GraphAssignment[]) => PolicyObject,
  logContext: string
): Promise<PolicyObject[]> {
  const log = logger.child({ helper: "enrichPoliciesWithAssignments", context: logContext });

  return mapWithConcurrency(rawPolicies, getGraphListConcurrency(), async (p) => {
    let assignments: GraphAssignment[] = [];
    try {
      assignments = await client.getAll<GraphAssignment>(
        assignmentUrl(p),
        apiVersion
      );
    } catch (err) {
      log.warn({ err }, "Failed to fetch assignments for policy");
    }
    return mapper(p, assignments);
  });
}
