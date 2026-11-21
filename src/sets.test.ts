import { describe, expect, test } from "vitest";
import { activeSets, SET_THRESHOLD, setCounts, SETS, withSetBonuses } from "./sets";
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

describe("withSetBonuses", () => {
  test("adds the bonus of an active set to the matching effect", () => {
    expect(withSetBonuses({ damage: 2, burn: 3 }, ["fire"])).toEqual({ damage: 2, burn: 3 + SETS.fire.bonus.burn! });
  });

  test("never adds an effect the item doesn't have", () => {
    expect(withSetBonuses({ damage: 5 }, ["fire", "iron"])).toEqual({ damage: 5 });
  });

  test("adds the bonuses of several active sets", () => {
    expect(withSetBonuses({ block: 3, burn: 2 }, ["fire", "iron"])).toEqual({
      block: 3 + SETS.iron.bonus.block!,
      burn: 2 + SETS.fire.bonus.burn!,
    });
  });

  test("without active sets nothing changes, and the input is never modified", () => {
    const effects = { burn: 3 };
    expect(withSetBonuses(effects, [])).toEqual({ burn: 3 });
    withSetBonuses(effects, ["fire"]);
    expect(effects).toEqual({ burn: 3 });
  });
});
