import { describe, expect, test } from "vitest";
import { isReplayDone, newGame, skipReplay, startBattle, startSearch } from "./game";
import { buyItem, markSubmitted, START_LIVES } from "./run";
import { fromSave, SAVE_DISCARDED, SAVE_VERSION, SEARCH_INTERRUPTED, toSave } from "./save";
import type { GameState, Opponent } from "./types";

/** Spiel im Shop mit einem gekauften Item. */
function shopGame(): GameState {
  const game = newGame(7, "run-7");
  return { ...game, run: buyItem({ ...game.run, gold: 50 }, 0) };
}

const opponent: Opponent = { id: "dummy", name: "Training Dummy", icon: "🪵", hp: 10, round: 1, items: ["pot-lid"] };

/** Spiel mitten im Kampf-Replay (Ergebnis noch nicht angewendet). */
function battleGame(): GameState {
  return startBattle(startSearch(shopGame(), "s1"), opponent, "s1");
}

/** Speichern und Laden wie bei einem Refresh. */
const reload = (game: GameState) => fromSave(JSON.stringify(toSave(game)));

/** Gespeicherter Stand als lose JSON-Daten, die ein Test beliebig verändern darf. */
type RawSave = Record<string, unknown> & {
  run: Record<string, unknown> & { backpack: (Record<string, unknown> | null)[] };
};

/** Gespeicherten Stand gezielt verändern, um kaputte Saves zu simulieren. */
const tampered = (change: (save: RawSave) => void) => {
  const save = JSON.parse(JSON.stringify(toSave(shopGame())));
  change(save);
  return fromSave(JSON.stringify(save));
};

describe("reload in the shop", () => {
  test("continues the run exactly where it was", () => {
    const game = shopGame();
    expect(reload(game)).toEqual({ game, notice: null });
  });

  test("keeps shop offers and seed, so there is no free reroll", () => {
    const loaded = reload(shopGame()).game!;
    expect(loaded.run.shop).toEqual(shopGame().run.shop);
    expect(loaded.run.seed).toBe(shopGame().run.seed);
  });
});

describe("reload during a search", () => {
  test("cancels the search and returns to the shop with a message", () => {
    const { game } = reload(startSearch(shopGame(), "s1"));
    expect(game?.phase).toBe("shop");
    expect(game?.error).toBe(SEARCH_INTERRUPTED);
    expect(game?.searchId).toBeNull();
  });
});

describe("reload during a battle replay", () => {
  test("counts the battle exactly once and shows its end", () => {
    const before = battleGame();
    const { game } = reload(before);
    expect(game?.phase).toBe("battle");
    expect(isReplayDone(game!.battle!)).toBe(true);
    expect(game?.run).toEqual(skipReplay(before).run);
  });

  test("keeps the same opponent and the same result", () => {
    const before = battleGame();
    const { game } = reload(before);
    expect(game?.battle?.opponent).toEqual(opponent);
    expect(game?.battle?.result).toEqual(before.battle?.result);
  });

  test("a second reload doesn't apply the result again", () => {
    const once = reload(battleGame()).game!;
    expect(reload(once).game?.run).toEqual(once.run);
    expect(skipReplay(once)).toBe(once);
  });
});

describe("reload after the run ended", () => {
  /** Beendeter Run: 3 Niederlagen in 3 Runden. */
  const finishedGame = (): GameState => {
    const game = shopGame();
    return { ...game, phase: "finished", run: { ...game.run, lives: 0, round: START_LIVES } };
  };

  test("keeps that the run was entered in the hall of fame, so it isn't sent again", () => {
    const game = finishedGame();
    const submitted = { ...game, run: markSubmitted(game.run) };
    expect(reload(submitted).game?.run.submitted).toBe(true);
  });

  test("keeps the run id", () => {
    expect(reload(finishedGame()).game?.run.runId).toBe("run-7");
  });
});

describe("broken saves fall back to a playable state", () => {
  test("no save: no run, no message", () => {
    expect(fromSave(null)).toEqual({ game: null, notice: null });
  });

  test.each([
    ["not JSON", () => fromSave("{oops")],
    ["other version", () => tampered((s) => (s.version = SAVE_VERSION + 1))],
    ["unknown phase", () => tampered((s) => (s.phase = "cheating"))],
    ["negative gold", () => tampered((s) => (s.run.gold = -5))],
    ["gold as text", () => tampered((s) => (s.run.gold = "999"))],
    ["4 wins in round 1", () => tampered((s) => (s.run.wins = 4))],
    ["lost a life without a round", () => tampered((s) => (s.run.lives = 2))],
    ["unknown item", () => tampered((s) => (s.run.backpack[0]!.itemId = "laser-sword"))],
    ["backpack too small", () => tampered((s) => s.run.backpack.pop())],
    ["duplicated item", () => tampered((s) => (s.run.backpack[1] = s.run.backpack[0]))],
    ["finished without an outcome", () => tampered((s) => (s.phase = "finished"))],
    ["battle without opponent", () => tampered((s) => (s.phase = "battle"))],
    ["missing run id", () => tampered((s) => delete s.run.runId)],
    ["submitted mid-run", () => tampered((s) => (s.run.submitted = true))],
  ])("%s is discarded with a message", (_, load) => {
    expect(load()).toEqual({ game: null, notice: SAVE_DISCARDED });
  });
});
