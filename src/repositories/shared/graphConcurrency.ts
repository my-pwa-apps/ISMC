const DEFAULT_GRAPH_LIST_CONCURRENCY = 6;

export function getGraphListConcurrency(): number {
  const configured = Number(process.env.GRAPH_LIST_CONCURRENCY ?? DEFAULT_GRAPH_LIST_CONCURRENCY);

  if (!Number.isFinite(configured) || configured < 1) {
    return DEFAULT_GRAPH_LIST_CONCURRENCY;
  }

  return Math.floor(configured);
}