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
    expect(result.frames[1].player).toEqual({ hp: 38, maxHp: 40, block: 0 });
    expect(result.events[1].message).toContain("(4 blocked)");
  });

  test("stays for the rest of the battle and adds up", () => {
    const result = simulateBattle(fighter(40, [item({ block: 5 })]), fighter(40));
    expect(result.frames[2].player.block).toBe(10);
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
