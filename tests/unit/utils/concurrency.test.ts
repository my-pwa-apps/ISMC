import { describe, expect, it } from "vitest";

import { mapWithConcurrency } from "@/lib/utils";

describe("mapWithConcurrency", () => {
  it("preserves input order while limiting concurrency", async () => {
    const items = [0, 1, 2, 3, 4, 5];
    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency(items, 2, async (item) => {
      active++;
      maxActive = Math.max(maxActive, active);

      await new Promise((resolve) => setTimeout(resolve, item % 2 === 0 ? 20 : 5));

      active--;
      return item * 10;
    });

    expect(results).toEqual([0, 10, 20, 30, 40, 50]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("treats invalid concurrency values as serial execution", async () => {
    const calls: number[] = [];

    const results = await mapWithConcurrency([1, 2, 3], 0, async (item) => {
      calls.push(item);
      return item;
    });

    expect(results).toEqual([1, 2, 3]);
    expect(calls).toEqual([1, 2, 3]);
  });
});