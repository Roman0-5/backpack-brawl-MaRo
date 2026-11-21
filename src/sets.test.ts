import { describe, expect, test } from "vitest";
import { activeSets, SET_THRESHOLD, setCounts } from "./sets";
import type { SetId } from "./types";

/** Eigene Test-Items statt Katalog-Items, wie in battle.test.ts. */
const member = (id: string, set?: SetId) => ({ id, set });

describe("setCounts", () => {
  test("counts different items per set; items without a set are ignored", () => {
    const counts = setCounts([member("a", "fire"), member("b", "fire"), member("c", "iron"), member("d")]);
    expect(counts).toEqual({ fire: 2, iron: 1 });
  });

  test("copies of the same item count once", () => {
    expect(setCounts([member("a", "fire"), member("a", "fire"), member("a", "fire")]).fire).toBe(1);
  });
});

describe("activeSets", () => {
  test(`a set is active with ${SET_THRESHOLD} different items`, () => {
    expect(activeSets([member("a", "fire"), member("b", "fire")])).toEqual(["fire"]);
  });

  test("one item of a set is not enough, not even twice", () => {
    expect(activeSets([member("a", "fire")])).toEqual([]);
    expect(activeSets([member("a", "fire"), member("a", "fire")])).toEqual([]);
  });

  test("several sets can be active at once, always in the same order", () => {
    const items = [member("c", "iron"), member("a", "fire"), member("d", "iron"), member("b", "fire")];
    expect(activeSets(items)).toEqual(["fire", "iron"]);
  });

  test("no items, no sets", () => {
    expect(activeSets([])).toEqual([]);
  });
});
