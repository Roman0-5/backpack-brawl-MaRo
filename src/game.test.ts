import { describe, expect, test } from "vitest";
import { fightBlocker, newGame, searchFailed, startBattle, startSearch } from "./game";
import type { GameState, Opponent } from "./types";

/** Neues Spiel mit einem Item im Rucksack, damit die Suche erlaubt ist. */
function readyGame(): GameState {
  const game = newGame(1);
  const backpack = [...game.run.backpack];
  backpack[0] = { uid: "item-1", itemId: "pot-lid" };
  return { ...game, run: { ...game.run, backpack } };
}

/** Gegner, wie ihn die API für eine Runde liefert. */
function opponentFor(round: number): Opponent {
  return { id: "dummy", name: "Training Dummy", icon: "🪵", hp: 10, round, items: ["pot-lid"] };
}

describe("failed search", () => {
  test("returns to a usable shop and shows the message", () => {
    const failed = searchFailed(startSearch(readyGame(), "s1"), "s1", "Arena unavailable.");
    expect(failed.phase).toBe("shop");
    expect(failed.error).toBe("Arena unavailable.");
  });

  test("lets the player try again, which clears the message", () => {
    const failed = searchFailed(startSearch(readyGame(), "s1"), "s1", "Arena unavailable.");
    expect(fightBlocker(failed)).toBeNull();
    const retry = startSearch(failed, "s2");
    expect(retry.phase).toBe("searching");
    expect(retry.error).toBeNull();
  });

  test("outside a search changes nothing", () => {
    const shop = readyGame();
    expect(searchFailed(shop, "s1", "late error")).toBe(shop);
  });
});

describe("running search", () => {
  test("blocks a second search with a reason", () => {
    const searching = startSearch(readyGame(), "s1");
    expect(fightBlocker(searching)).toBe("Search already running");
  });

  test("starting again while searching changes nothing", () => {
    const searching = startSearch(readyGame(), "s1");
    expect(startSearch(searching, "s2")).toBe(searching);
  });
});

describe("search answers", () => {
  test("the answer to the running search starts the battle", () => {
    const battle = startBattle(startSearch(readyGame(), "s1"), opponentFor(1), "s1");
    expect(battle.phase).toBe("battle");
    expect(battle.battle?.opponent.round).toBe(1);
    expect(battle.searchId).toBeNull();
  });

  test("a duplicate answer never restarts the battle", () => {
    const battle = startBattle(startSearch(readyGame(), "s1"), opponentFor(1), "s1");
    expect(startBattle(battle, opponentFor(1), "s1")).toBe(battle);
  });

  test("an answer without a running search never starts a battle", () => {
    const shop = readyGame();
    expect(startBattle(shop, opponentFor(1), "s1")).toBe(shop);
  });

  test("a late answer from an older search is ignored", () => {
    // Suche s1 scheitert, der Spieler startet s2, dann kommt die verspätete Antwort von s1.
    const retry = startSearch(searchFailed(startSearch(readyGame(), "s1"), "s1", "Timeout"), "s2");
    expect(startBattle(retry, opponentFor(1), "s1")).toBe(retry);
  });

  test("a late failure from an older search does not stop the running one", () => {
    const retry = startSearch(searchFailed(startSearch(readyGame(), "s1"), "s1", "Timeout"), "s2");
    expect(searchFailed(retry, "s1", "late error")).toBe(retry);
  });

  test("an opponent for another round ends the search with a message", () => {
    const wrongRound = startBattle(startSearch(readyGame(), "s1"), opponentFor(2), "s1");
    expect(wrongRound.phase).toBe("shop");
    expect(wrongRound.battle).toBeNull();
    expect(wrongRound.error).not.toBeNull();
  });
});
