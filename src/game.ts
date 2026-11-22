import { buildOpponentFighter, buildPlayerFighter, simulateBattle } from "./battle";
import { applyBattleResult, markSubmitted, newRun, runOutcome } from "./run";
import { itemIdsOf } from "./shop";
import type { BattleReplay, GameState, Opponent, RunState } from "./types";

/**
 * Phase transitions of one run: shop → searching → battle → shop … → finished.
 * Every function is pure, so they can be passed straight to `setState`.
 */

export function newGame(seed: number, runId: string): GameState {
  return { phase: "shop", run: newRun(seed, runId), battle: null, error: null, searchId: null };
}

/** Applies a shop/backpack action; only allowed while shopping. */
export function updateRun(game: GameState, action: (run: RunState) => RunState): GameState {
  if (game.phase !== "shop") return game;
  const run = action(game.run);
  return run === game.run ? game : { ...game, run };
}

/** Why the player can't look for an opponent right now, or `null` if they can. */
export function fightBlocker(game: GameState): string | null {
  if (game.phase === "searching") return "Search already running";
  if (game.phase !== "shop") return "Only possible in the shop";
  if (itemIdsOf(game.run.backpack).length === 0) return "Buy at least one item first";
  return null;
}

/** Starts an opponent search under `searchId`; unchanged state if not allowed. */
export function startSearch(game: GameState, searchId: string): GameState {
  if (fightBlocker(game) !== null) return game;
  return { ...game, phase: "searching", error: null, searchId };
}

/** Whether a response belongs to the search that is running right now. */
const isCurrentSearch = (game: GameState, searchId: string) => game.phase === "searching" && game.searchId === searchId;

/** Ends the search `searchId` with an error: back to a usable shop that shows the message. */
export function searchFailed(game: GameState, searchId: string, error: string): GameState {
  if (!isCurrentSearch(game, searchId)) return game;
  return { ...game, phase: "shop", error, searchId: null };
}

/**
 * Answer of the search `searchId`: simulates the battle and starts its replay.
 * Slow, duplicate or late answers (other search, no search running) change nothing.
 * An opponent for another round ends the search with an error instead of fighting.
 */
export function startBattle(game: GameState, opponent: Opponent, searchId: string): GameState {
  if (!isCurrentSearch(game, searchId)) return game;
  if (opponent.round !== game.run.round) {
    return searchFailed(game, searchId, "The arena sent an opponent for the wrong round.");
  }
  const player = buildPlayerFighter(game.run.backpack);
  const enemy = buildOpponentFighter(opponent);
  const result = simulateBattle(player, enemy);
  return { ...game, phase: "battle", searchId: null, battle: { opponent, player, enemy, result, frame: 0 } };
}

export const isReplayDone = (battle: BattleReplay) => battle.frame >= battle.result.frames.length - 1;

/** Shows the given frame; reaching the last frame applies the battle result to the run (exactly once). */
export function showFrame(game: GameState, frame: number): GameState {
  const { battle } = game;
  if (game.phase !== "battle" || !battle || isReplayDone(battle)) return game;
  const last = battle.result.frames.length - 1;
  const next = { ...battle, frame: Math.min(Math.max(frame, battle.frame), last) };
  if (!isReplayDone(next)) return { ...game, battle: next };
  return { ...game, battle: next, run: applyBattleResult(game.run, battle.result.winner) };
}

export const advanceReplay = (game: GameState) => showFrame(game, (game.battle?.frame ?? 0) + 1);
export const skipReplay = (game: GameState) => showFrame(game, Infinity);

/** Leaves a finished replay: back to the shop, or to the end screen if the run is over. */
export function leaveBattle(game: GameState): GameState {
  if (game.phase !== "battle" || !game.battle || !isReplayDone(game.battle)) return game;
  return { ...game, phase: runOutcome(game.run) ? "finished" : "shop", battle: null };
}

/** Records that the finished run is in the hall of fame, so it is never sent again (also after a reload). */
export function markRunSubmitted(game: GameState): GameState {
  if (game.phase !== "finished") return game;
  const run = markSubmitted(game.run);
  return run === game.run ? game : { ...game, run };
}

/** URL paths of the app's screens. */
export const ROUTES = { start: "/", shop: "/shop", battle: "/battle", result: "/result", hallOfFame: "/hall-of-fame" } as const;
export type GameRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * The screen that matches the game's phase. Shop, battle and result pages
 * redirect here when they don't match, so the URL always follows the phase.
 */
export function routeForGame(game: GameState | null): GameRoute {
  if (!game) return ROUTES.start;
  switch (game.phase) {
    case "shop":
    case "searching":
      return ROUTES.shop;
    case "battle":
      return ROUTES.battle;
    case "finished":
      return ROUTES.result;
  }
}
