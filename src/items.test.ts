import { describe, expect, test } from "vitest";
import { CATALOG } from "./items";
import { rollShop } from "./shop";
import type { ItemEffects } from "./types";

const withEffect = (effect: keyof ItemEffects) => CATALOG.filter((item) => (item.effects[effect] ?? 0) > 0).map((item) => item.id);

describe("catalog (B3)", () => {
  test("has at least 3 poison items", () => {
    expect(withEffect("poison").length).toBeGreaterThanOrEqual(3);
  });

  test("has at least 3 heal items", () => {
    expect(withEffect("heal").length).toBeGreaterThanOrEqual(3);
  });

  test("the shop offers every poison and heal item", () => {
    // Viele Shop-Würfe hintereinander, wie im Spiel: Jeder Wurf liefert den Seed für den nächsten.
    const offered = new Set<string>();
    let seed = 1;
    for (let i = 0; i < 100; i++) {
      const roll = rollShop(seed);
      roll.offers.forEach((id) => offered.add(id));
      seed = roll.seed;
    }
    for (const id of [...withEffect("poison"), ...withEffect("heal")]) expect(offered).toContain(id);
  });
});
