import { describe, expect, test } from "vitest";
import { fightBlocker, newGame, searchFailed, startSearch } from "./game";
import type { GameState } from "./types";

/** Neues Spiel mit einem Item im Rucksack, damit die Suche erlaubt ist. */
function readyGame(): GameState {
  const game = newGame(1);
  const backpack = [...game.run.backpack];
  backpack[0] = { uid: "item-1", itemId: "pot-lid" };
  return { ...game, run: { ...game.run, backpack } };
}

describe("failed search", () => {
  test("returns to a usable shop and shows the message", () => {
    const failed = searchFailed(startSearch(readyGame()), "Arena unavailable.");
    expect(failed.phase).toBe("shop");
    expect(failed.error).toBe("Arena unavailable.");
  });

  test("lets the player try again, which clears the message", () => {
    const failed = searchFailed(startSearch(readyGame()), "Arena unavailable.");
    expect(fightBlocker(failed)).toBeNull();
    const retry = startSearch(failed);
    expect(retry.phase).toBe("searching");
    expect(retry.error).toBeNull();
  });

  test("outside a search changes nothing", () => {
    const shop = readyGame();
    expect(searchFailed(shop, "late error")).toBe(shop);
  });
});

describe("running search", () => {
  test("blocks a second search with a reason", () => {
    const searching = startSearch(readyGame());
    expect(fightBlocker(searching)).toBe("Search already running");
  });

  test("starting again while searching changes nothing", () => {
    const searching = startSearch(readyGame());
    expect(startSearch(searching)).toBe(searching);
  });
});
