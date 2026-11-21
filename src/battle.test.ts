import { describe, expect, test } from "vitest";
import { MAX_TICKS, simulateBattle } from "./battle";
import type { Fighter, FighterItem, ItemEffects } from "./types";

/**
 * Eigene Test-Items statt Katalog-Items: Die Tests prüfen die Kampfregeln
 * und brechen nicht, wenn Items im Katalog neu balanciert werden.
 */
function item(effects: ItemEffects, cooldown = 1): FighterItem {
  return { itemId: "test-item", name: "Test item", icon: "🧪", cooldown, effects };
}

function fighter(maxHp: number, items: FighterItem[] = [], name = "Fighter"): Fighter {
  return { name, maxHp, items };
}

describe("damage", () => {
  test("is lost from the enemy's HP", () => {
    const result = simulateBattle(fighter(40, [item({ damage: 3 })]), fighter(10));
    expect(result.frames[1].opponent.hp).toBe(7);
  });

  test("knocks the enemy out at 0 HP; shown HP never drops below 0", () => {
    const result = simulateBattle(fighter(40, [item({ damage: 3 })]), fighter(10));
    expect(result.winner).toBe("player");
    expect(result.reason).toBe("knockout");
    expect(result.frames).toHaveLength(5); // Start + 4 Ticks: 10 → 7 → 4 → 1 → −2
    expect(result.frames[4].opponent.hp).toBe(0);
  });
});

describe("cooldown", () => {
  test("an item fires every `cooldown` ticks", () => {
    const result = simulateBattle(fighter(40, [item({ damage: 1 }, 4)]), fighter(100));
    expect(result.events.slice(0, 3).map((e) => e.tick)).toEqual([4, 8, 12]);
  });
});

describe("block", () => {
  test("absorbs damage first, only the rest is lost from HP", () => {
    // Spieler wird vor dem Gegner aufgelöst: erst 4 Block, dann trifft der Gegner mit 6.
    const result = simulateBattle(fighter(40, [item({ block: 4 })]), fighter(40, [item({ damage: 6 }, 1)]));
    expect(result.frames[1].player).toEqual({ hp: 38, maxHp: 40, block: 0, poison: 0 });
    expect(result.events[1].message).toContain("(4 blocked)");
  });

  test("stays for the rest of the battle and adds up", () => {
    const result = simulateBattle(fighter(40, [item({ block: 5 })]), fighter(40));
    expect(result.frames[2].player.block).toBe(10);
  });
});

describe("poison stacks", () => {
  test("are added to the enemy, not to the fighter itself", () => {
    const result = simulateBattle(fighter(40, [item({ poison: 2 }, 3)]), fighter(40));
    expect(result.frames[2].opponent.poison).toBe(0); // vor dem ersten Feuern
    expect(result.frames[3].opponent.poison).toBe(2);
    expect(result.frames[3].player.poison).toBe(0);
  });

  test("add up", () => {
    const result = simulateBattle(fighter(40, [item({ poison: 2 }, 3), item({ poison: 1 }, 3)]), fighter(40));
    expect(result.frames[3].opponent.poison).toBe(3);
    expect(result.frames[6].opponent.poison).toBe(6);
  });

  test("are shown in the combat log with the new total", () => {
    const result = simulateBattle(fighter(40, [item({ poison: 2 }, 3)]), fighter(40));
    const second = result.events.filter((e) => e.kind === "poison")[1];
    expect(second).toMatchObject({ source: "player", target: "opponent", amount: 2 });
    expect(second.message).toContain("4 stacks");
  });
});

describe("heal", () => {
  test("restores the fighter's own HP", () => {
    // Tick 1: Gegner trifft (40 → 35). Tick 2: Heal +3 (→ 38), dann Treffer (→ 33).
    const result = simulateBattle(fighter(40, [item({ heal: 3 }, 2)]), fighter(40, [item({ damage: 5 })]));
    const heal = result.events.find((e) => e.kind === "heal");
    expect(heal).toMatchObject({ tick: 2, source: "player", target: "player", amount: 3 });
    expect(result.frames[2].player.hp).toBe(33);
  });

  test("never goes above max HP; the log shows the HP actually restored", () => {
    // Tick 2: 4 HP fehlen, Heal 10 stellt nur 4 wieder her.
    const result = simulateBattle(fighter(40, [item({ heal: 10 }, 2)]), fighter(40, [item({ damage: 4 })]));
    const heal = result.events.find((e) => e.kind === "heal");
    expect(heal?.amount).toBe(4);
    expect(heal?.message).toContain("(max HP)");
  });

  test("restores nothing at full HP", () => {
    const result = simulateBattle(fighter(40, [item({ heal: 5 })]), fighter(40));
    expect(result.frames[1].player.hp).toBe(40);
    expect(result.events[0]).toMatchObject({ kind: "heal", amount: 0 });
  });

  test("can't undo a knockout in the same tick", () => {
    // Spieler wird zuerst aufgelöst und schlägt den Gegner k.o.; dessen Heal danach wirkt nicht mehr.
    const result = simulateBattle(fighter(40, [item({ damage: 10 })]), fighter(10, [item({ heal: 5 })]));
    expect(result.winner).toBe("player");
    expect(result.reason).toBe("knockout");
    expect(result.events.some((e) => e.kind === "heal")).toBe(false);
  });
});

describe("end of battle", () => {
  test("if both fighters fall in the same tick, the player loses", () => {
    const result = simulateBattle(fighter(10, [item({ damage: 10 })]), fighter(10, [item({ damage: 10 })]));
    expect(result.winner).toBe("opponent");
    expect(result.reason).toBe("knockout");
    expect(result.frames).toHaveLength(2);
  });

  test("after MAX_TICKS the higher share of HP wins", () => {
    const result = simulateBattle(fighter(40, [item({ damage: 1 }, 10)]), fighter(100));
    expect(result.winner).toBe("player");
    expect(result.reason).toBe("timeout");
    expect(result.frames).toHaveLength(MAX_TICKS + 1);
  });

  test("a tie on timeout counts as the player's loss", () => {
    const result = simulateBattle(fighter(40), fighter(40));
    expect(result.winner).toBe("opponent");
    expect(result.reason).toBe("timeout");
  });
});

describe("determinism", () => {
  test("the same fighters always give the same result", () => {
    const player = fighter(40, [item({ damage: 3 }, 4), item({ block: 2 }, 3)]);
    const opponent = fighter(30, [item({ damage: 5 }, 4)]);
    expect(simulateBattle(player, opponent)).toEqual(simulateBattle(player, opponent));
  });
});
