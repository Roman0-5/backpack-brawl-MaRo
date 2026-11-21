import { describe, expect, test } from "vitest";
import { CATALOG } from "./items";
import { SET_IDS, SETS } from "./sets";
import { rollShop } from "./shop";
import type { ItemEffects, SetId } from "./types";

const withEffect = (effect: keyof ItemEffects) => CATALOG.filter((item) => (item.effects[effect] ?? 0) > 0).map((item) => item.id);
const inSet = (set: SetId) => CATALOG.filter((item) => item.set === set).map((item) => item.id);

/** Alle Items, die in 100 Shop-Würfen hintereinander angeboten werden – wie im Spiel: Jeder Wurf liefert den Seed für den nächsten. */
function offeredInManyShops(): Set<string> {
  const offered = new Set<string>();
  let seed = 1;
  for (let i = 0; i < 100; i++) {
    const roll = rollShop(seed);
    roll.offers.forEach((id) => offered.add(id));
    seed = roll.seed;
  }
  return offered;
}

describe("catalog (B3)", () => {
  test("has at least 3 poison items", () => {
    expect(withEffect("poison").length).toBeGreaterThanOrEqual(3);
  });

  test("has at least 3 heal items", () => {
    expect(withEffect("heal").length).toBeGreaterThanOrEqual(3);
  });

  test("the shop offers every poison and heal item", () => {
    const offered = offeredInManyShops();
    for (const id of [...withEffect("poison"), ...withEffect("heal")]) expect(offered).toContain(id);
  });
});

describe("catalog (B4)", () => {
  test("has at least 2 sets, one of them Fire", () => {
    expect(SET_IDS.length).toBeGreaterThanOrEqual(2);
    expect(SETS.fire).toBeDefined();
  });

  test.each(SET_IDS)("set %s has at least 3 items", (set) => {
    expect(inSet(set).length).toBeGreaterThanOrEqual(3);
  });

  test("the Fire set brings burn: its items apply burn and its bonus boosts it", () => {
    expect(inSet("fire").some((id) => withEffect("burn").includes(id))).toBe(true);
    expect(SETS.fire.bonus.burn).toBeGreaterThan(0);
  });

  test("the shop offers every set item", () => {
    const offered = offeredInManyShops();
    for (const set of SET_IDS) for (const id of inSet(set)) expect(offered).toContain(id);
  });
});
