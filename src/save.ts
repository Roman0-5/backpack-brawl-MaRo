import { isKnownItem, parseOpponent } from "./api";
import { buildOpponentFighter, buildPlayerFighter, simulateBattle } from "./battle";
import { skipReplay } from "./game";
import { runOutcome, START_LIVES, WINS_TO_VICTORY } from "./run";
import { BACKPACK_SIZE, SHOP_SIZE } from "./shop";
import type { Backpack, GameState, Opponent, Phase, RunState, ShopOffers } from "./types";

/**
 * Save and resume (B6). Only what a run needs to continue is stored; battle frames
 * are recomputed from backpack and opponent. Everything read back is checked first.
 */

/** Bump when the stored shape changes; older saves are then discarded as incompatible. */
export const SAVE_VERSION = 1;
export const SAVE_KEY = "backpack-brawl/save";

/** Shown in the fight bar, which adds "Try again." itself. */
export const SEARCH_INTERRUPTED = "Search interrupted by reload.";
export const SAVE_DISCARDED = "Your saved run couldn't be loaded and was discarded.";

export interface SaveData {
  version: typeof SAVE_VERSION;
  phase: Phase;
  run: RunState;
  /** Opponent of the battle being shown; `null` outside a battle. */
  opponent: Opponent | null;
}

/**
 * What gets stored for a game. A battle replay is stored as if it were skipped:
 * the result is fixed once the battle starts, so a reload can't avoid it or apply it twice.
 */
export function toSave(game: GameState): SaveData {
  const settled = game.phase === "battle" ? skipReplay(game) : game;
  return { version: SAVE_VERSION, phase: settled.phase, run: settled.run, opponent: settled.battle?.opponent ?? null };
}

export interface LoadResult {
  /** The run to continue, or `null` (no save, or the save was discarded). */
  game: GameState | null;
  /** Message for the player, e.g. why a save was discarded. */
  notice: string | null;
}

/** Turns the stored text back into a game. Never throws: anything invalid is discarded. */
export function fromSave(raw: string | null): LoadResult {
  if (raw === null) return { game: null, notice: null };
  try {
    return { game: restore(JSON.parse(raw)), notice: null };
  } catch {
    return { game: null, notice: SAVE_DISCARDED };
  }
}

/** Thrown for any save that is malformed, incompatible or describes an impossible run. */
class InvalidSave extends Error {}

function check(condition: boolean, reason: string): asserts condition {
  if (!condition) throw new InvalidSave(reason);
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isInt = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** Battles fought so far: every battle is either a win or a lost life. */
const battlesFought = (run: RunState) => run.wins + (START_LIVES - run.lives);

function restore(data: unknown): GameState {
  check(isRecord(data), "not an object");
  check(data.version === SAVE_VERSION, "incompatible version");
  const run = parseRun(data.run);
  const outcome = runOutcome(run);
  const base = { run, battle: null, error: null, searchId: null };

  switch (data.phase) {
    case "shop":
      check(outcome === null, "shop after the run ended");
      return { ...base, phase: "shop" };
    case "searching":
      // Policy: a reload cancels the search; there was no opponent yet, so nothing is lost or gained.
      check(outcome === null, "search after the run ended");
      return { ...base, phase: "shop", error: SEARCH_INTERRUPTED };
    case "battle": {
      // Policy: the battle already counts (see toSave); show its end so the player sees the outcome.
      const opponent = parseOpponent(data.opponent);
      check(opponent.round === battlesFought(run), "opponent does not match the battle just fought");
      const player = buildPlayerFighter(run.backpack);
      const enemy = buildOpponentFighter(opponent);
      const result = simulateBattle(player, enemy);
      return { ...base, phase: "battle", battle: { opponent, player, enemy, result, frame: result.frames.length - 1 } };
    }
    case "finished":
      check(outcome !== null, "finished but the run is not over");
      return { ...base, phase: "finished" };
    default:
      throw new InvalidSave("unknown phase");
  }
}

function parseRun(value: unknown): RunState {
  check(isRecord(value), "run is not an object");
  const { round, gold, lives, wins, seed, nextUid } = value;
  check(isInt(round, 1), "round");
  check(isInt(gold, 0), "gold");
  check(isInt(lives, 0, START_LIVES), "lives");
  check(isInt(wins, 0, WINS_TO_VICTORY), "wins");
  check(isInt(seed, 0, 2 ** 32 - 1), "seed");
  check(isInt(nextUid, 1), "nextUid");
  const run: RunState = { round, gold, lives, wins, seed, nextUid, shop: parseShop(value.shop), backpack: parseBackpack(value.backpack) };

  // Consistency: the round must match the battles fought. Each battle ends a round,
  // except the last one, which ends the run instead.
  check(!(wins >= WINS_TO_VICTORY && lives <= 0), "won and lost at the same time");
  const expectedRound = battlesFought(run) + (runOutcome(run) ? 0 : 1);
  check(round === expectedRound, "round does not match wins and lives");
  return run;
}

function parseShop(value: unknown): ShopOffers {
  check(Array.isArray(value) && value.length === SHOP_SIZE, "shop size");
  check(value.every((offer) => offer === null || isKnownItem(offer)), "unknown shop item");
  return [...(value as ShopOffers)];
}

function parseBackpack(value: unknown): Backpack {
  check(Array.isArray(value) && value.length === BACKPACK_SIZE, "backpack size");
  const backpack: Backpack = value.map((slot: unknown) => {
    if (slot === null) return null;
    check(isRecord(slot) && typeof slot.uid === "string" && slot.uid !== "" && isKnownItem(slot.itemId), "backpack slot");
    return { uid: slot.uid, itemId: slot.itemId as string };
  });
  const uids = backpack.flatMap((slot) => (slot ? [slot.uid] : []));
  check(new Set(uids).size === uids.length, "duplicate item");
  return backpack;
}
