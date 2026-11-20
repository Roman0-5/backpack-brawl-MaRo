import { describe, expect, test } from "vitest";
import { buyBlocker, buyItem, newRun, rerollBlocker, rerollShop, REROLL_COST, sellBlocker, sellItem, sellPrice } from "./run";
import { rollShop } from "./shop";
import type { RunState } from "./types";

/** Run mit vollem Rucksack und genug Gold – nur der freie Platz fehlt. */
function fullBackpackRun(): RunState {
  const run = newRun(1);
  return {
    ...run,
    gold: 100,
    shop: ["pot-lid", "pot-lid", "pot-lid", "pot-lid"],
    backpack: run.backpack.map((_, i) => ({ uid: `item-${i}`, itemId: "pot-lid" })),
  };
}

describe("buy with a full backpack", () => {
  test("is blocked with a reason the UI can show", () => {
    expect(buyBlocker(fullBackpackRun(), 0)).toBe("Backpack full");
  });

  test("changes nothing", () => {
    const run = fullBackpackRun();
    expect(buyItem(run, 0)).toBe(run);
  });
});

/** Run mit den angegebenen Items im Rucksack (6 Einträge, null = leer). */
function runWith(itemIds: (string | null)[], gold = 0): RunState {
  const run = newRun(1);
  return { ...run, gold, backpack: itemIds.map((id, i) => (id ? { uid: `item-${i}`, itemId: id } : null)) };
}

describe("sell", () => {
  test("price is half the buy price, rounded down", () => {
    expect(sellPrice("hunting-bow")).toBe(2); // 4 → 2
    expect(sellPrice("iron-cleaver")).toBe(2); // 5 → 2,5 → 2
    expect(sellPrice("pot-lid")).toBe(1); // 2 → 1
  });

  test("adds the sell price to the gold", () => {
    const run = runWith(["iron-cleaver", null, null, null, null, null], 3);
    expect(sellItem(run, 0).gold).toBe(5);
  });

  test("frees exactly that slot and keeps the others", () => {
    const run = runWith(["pot-lid", "hunting-bow", null, null, null, null]);
    expect(sellItem(run, 1).backpack).toEqual([run.backpack[0], null, null, null, null, null]);
  });

  test.each([2, -1, 99])("slot %i without an item is blocked and changes nothing", (slot) => {
    const run = runWith(["pot-lid", null, null, null, null, null]);
    expect(sellBlocker(run, slot)).toBe("Empty slot");
    expect(sellItem(run, slot)).toBe(run);
  });
});

describe("reroll", () => {
  test("costs REROLL_COST and rolls new offers from the run's seed", () => {
    const run = { ...newRun(1), gold: 5 };
    const expected = rollShop(run.seed);
    const after = rerollShop(run);
    expect(after.gold).toBe(5 - REROLL_COST);
    expect(after.shop).toEqual(expected.offers);
    expect(after.seed).toBe(expected.seed);
  });

  test("is deterministic: same state, same reroll", () => {
    const run = { ...newRun(42), gold: 5 };
    expect(rerollShop(run)).toEqual(rerollShop(run));
  });

  test("works with exactly enough gold and ends at 0", () => {
    const run = { ...newRun(1), gold: REROLL_COST };
    expect(rerollShop(run).gold).toBe(0);
  });

  test("without enough gold is blocked and changes nothing", () => {
    const run = { ...newRun(1), gold: 0 };
    expect(rerollBlocker(run)).toBe("Not enough gold");
    expect(rerollShop(run)).toBe(run);
  });
});
