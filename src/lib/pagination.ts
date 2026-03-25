export class InvalidCursorError extends Error {
  constructor(message = "Invalid cursor") {
    super(message);
    this.name = "InvalidCursorError";
  }
}

export interface CursorPageMeta {
  count: number;
  totalCount: number;
  page: number;
  pageSize: number;
  nextCursor?: string;
  prevCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPage<T> {
  data: T[];
  meta: CursorPageMeta;
}

export function encodeOffsetCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), "utf8").toString("base64url");
}

export function decodeOffsetCursor(cursor?: string): number {
  if (!cursor) return 0;

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      offset?: unknown;
    };

    if (typeof decoded.offset !== "number" || decoded.offset < 0 || !Number.isInteger(decoded.offset)) {
      throw new InvalidCursorError();
    }

    return decoded.offset;
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      throw error;
    }
    throw new InvalidCursorError();
  }
}

export function paginateItems<T>(
  items: T[],
  options: { page: number; pageSize: number; cursor?: string }
): CursorPage<T> {
  const totalCount = items.length;
  const requestedOffset = options.cursor
    ? decodeOffsetCursor(options.cursor)
    : Math.max(0, (options.page - 1) * options.pageSize);
  const safeOffset = Math.min(requestedOffset, totalCount);
  const page = Math.floor(safeOffset / options.pageSize) + 1;
  const pageItems = items.slice(safeOffset, safeOffset + options.pageSize);
  const nextOffset = safeOffset + options.pageSize;
  const prevOffset = Math.max(0, safeOffset - options.pageSize);

  return {
    data: pageItems,
    meta: {
      count: pageItems.length,
      totalCount,
      page,
      pageSize: options.pageSize,
      nextCursor: nextOffset < totalCount ? encodeOffsetCursor(nextOffset) : undefined,
      prevCursor: safeOffset > 0 ? encodeOffsetCursor(prevOffset) : undefined,
      hasNextPage: nextOffset < totalCount,
      hasPreviousPage: safeOffset > 0,
    },
  };
}