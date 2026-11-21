import { getItem } from "./items";
import type { Opponent } from "./types";

/** How long the search waits for the arena before giving up. */
export const SEARCH_TIMEOUT_MS = 8000;

/** A failed opponent search; `message` is written for the player. */
export class SearchError extends Error {}

/** Asks the API for this round's opponent; throws a `SearchError` with a player-facing message on failure. */
export async function fetchOpponent(round: number): Promise<Opponent> {
  let response: Response;
  try {
    response = await fetch(`/api/opponents?round=${encodeURIComponent(round)}`, {
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new SearchError("The arena took too long to answer.");
    }
    throw new SearchError("The arena can't be reached. Check your connection.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    if (typeof body?.error === "string") throw new SearchError(body.error);
    throw new SearchError(
      response.status >= 500 ? "The arena is unavailable right now." : `The arena rejected the search (${response.status}).`,
    );
  }

  return parseOpponent(await response.json().catch(() => null));
}

/** Whether `id` names an item of the current catalog. */
export const isKnownItem = (id: unknown) => {
  if (typeof id !== "string") return false;
  try {
    getItem(id);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks that an API answer really is an opponent before the game uses it.
 * An unknown item would otherwise crash the battle simulation.
 */
export function parseOpponent(value: unknown): Opponent {
  const o = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const valid =
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.icon === "string" &&
    typeof o.hp === "number" &&
    Number.isFinite(o.hp) &&
    o.hp > 0 &&
    typeof o.round === "number" &&
    Number.isInteger(o.round) &&
    o.round >= 1 &&
    Array.isArray(o.items) &&
    o.items.every(isKnownItem);
  if (!valid) throw new SearchError("The arena sent an answer we don't understand.");
  return o as unknown as Opponent;
}
