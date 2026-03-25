/**
 * Microsoft Graph pagination utilities.
 *
 * Graph uses OData @nextLink for server-side paging.
 * This module provides helpers to collect all pages into a single array.
 */

import type { GraphODataCollection } from "./types";
import logger from "@/lib/logger";

export interface PaginationOptions {
  /** Maximum number of items to return across all pages. Default: unlimited */
  maxItems?: number;
  /** Page size hint (appended as $top query param). Default: 100 */
  pageSize?: number;
  /** Abort signal to cancel pagination mid-flight */
  signal?: AbortSignal;
}

/**
 * Collect all pages from a Graph OData collection endpoint.
 *
 * Example:
 *   const allPolicies = await paginate(
 *     (url) => graphClient.get<GraphODataCollection<GraphConfigurationPolicy>>(url),
 *     "/deviceManagement/configurationPolicies?$top=100"
 *   );
 */
export async function paginate<T>(
  fetcher: (url: string) => Promise<GraphODataCollection<T>>,
  initialUrl: string,
  opts: PaginationOptions = {}
): Promise<T[]> {
  const { maxItems = Infinity, signal } = opts;
  const items: T[] = [];
  let nextUrl: string | undefined = initialUrl;
  let pageCount = 0;

  while (nextUrl) {
    if (signal?.aborted) {
      logger.debug({ initialUrl }, "Graph pagination aborted by caller");
      break;
    }

    const page = await fetcher(nextUrl);
    items.push(...page.value);
    pageCount++;

    logger.debug(
      { pageCount, itemsSoFar: items.length, hasNextLink: !!page["@odata.nextLink"] },
      "Graph page received"
    );

    if (items.length >= maxItems) {
      logger.debug({ maxItems }, "Graph pagination max item limit reached");
      break;
    }

    nextUrl = page["@odata.nextLink"];
  }

  return items.slice(0, maxItems);
}

/**
 * Build a Graph query URL with $select, $filter, $top, and $expand params.
 */
export function buildGraphUrl(
  base: string,
  path: string,
  params?: {
    select?: string[];
    filter?: string;
    top?: number;
    expand?: string[];
    orderBy?: string;
    search?: string;
  }
): string {
  const url = new URL(path, base.endsWith("/") ? base : base + "/");
  if (params?.select?.length) url.searchParams.set("$select", params.select.join(","));
  if (params?.filter) url.searchParams.set("$filter", params.filter);
  if (params?.top) url.searchParams.set("$top", String(params.top));
  if (params?.expand?.length) url.searchParams.set("$expand", params.expand.join(","));
  if (params?.orderBy) url.searchParams.set("$orderby", params.orderBy);
  if (params?.search) url.searchParams.set("$search", params.search);
  // Remove the base origin to return just the relative path + query
  return url.pathname + (url.search ? url.search : "");
}
