const DEFAULT_GRAPH_FETCH_PAGE_SIZE = 100;

export function getGraphFetchPageSize(): number {
  const configured = Number(
    process.env.GRAPH_FETCH_PAGE_SIZE ?? DEFAULT_GRAPH_FETCH_PAGE_SIZE
  );

  if (!Number.isFinite(configured) || configured < 1) {
    return DEFAULT_GRAPH_FETCH_PAGE_SIZE;
  }

  return Math.min(999, Math.floor(configured));
}