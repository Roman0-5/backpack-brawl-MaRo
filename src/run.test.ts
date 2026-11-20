import { describe, expect, test } from "vitest";
import { buyBlocker, buyItem, newRun } from "./run";
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
