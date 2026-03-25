import { describe, expect, it } from "vitest";

import { InvalidCursorError, decodeOffsetCursor, paginateItems } from "@/lib/pagination";

describe("paginateItems", () => {
  it("returns the requested page with next and previous cursors", () => {
    const page = paginateItems([1, 2, 3, 4, 5], { page: 2, pageSize: 2 });

    expect(page.data).toEqual([3, 4]);
    expect(page.meta.totalCount).toBe(5);
    expect(page.meta.page).toBe(2);
    expect(page.meta.hasPreviousPage).toBe(true);
    expect(page.meta.hasNextPage).toBe(true);
    expect(page.meta.prevCursor).toBeDefined();
    expect(page.meta.nextCursor).toBeDefined();
    expect(decodeOffsetCursor(page.meta.prevCursor)).toBe(0);
    expect(decodeOffsetCursor(page.meta.nextCursor)).toBe(4);
  });

  it("accepts a cursor and clamps offsets beyond the end", () => {
    const firstPage = paginateItems([1, 2, 3], { page: 1, pageSize: 2 });
    const secondPage = paginateItems([1, 2, 3], {
      page: 1,
      pageSize: 2,
      cursor: firstPage.meta.nextCursor,
    });

    expect(secondPage.data).toEqual([3]);
    expect(secondPage.meta.page).toBe(2);
    expect(secondPage.meta.hasNextPage).toBe(false);
  });

  it("throws on malformed cursors", () => {
    expect(() => decodeOffsetCursor("not-a-valid-cursor")).toThrow(InvalidCursorError);
  });
});