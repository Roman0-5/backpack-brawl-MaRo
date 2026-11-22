import type { HallOfFameEntry, HallOfFameList, RunSubmission } from "../server/runs.ts";
import { runOutcome, START_LIVES } from "./run";
import type { RunState } from "./types";

// Types only: the contract is defined once, next to the server rules, and erased from the bundle.
export type { HallOfFameEntry, HallOfFameList };

/** How long a hall-of-fame request may take before the player gets an error. */
export const HALL_TIMEOUT_MS = 8000;
/** Same limit as on the server (a test keeps them in sync). */
export const NAME_MAX_LENGTH = 20;

/** A failed hall-of-fame request; `message` is written for the player. */
export class HallOfFameError extends Error {}

/** What gets sent for a finished run. `rounds` is the number of battles: wins plus lost lives. */
export function runSubmission(run: RunState, name: string): RunSubmission {
  return { runId: run.runId, name: name.trim(), wins: run.wins, lives: run.lives, rounds: run.wins + (START_LIVES - run.lives) };
}

/** Why the name can't be sent yet, or `null` if it can. The server checks the same rules again. */
export function nameBlocker(name: string): string | null {
  const length = [...name.trim()].length;
  if (length === 0) return "Enter a name";
  if (length > NAME_MAX_LENGTH) return `At most ${NAME_MAX_LENGTH} characters`;
  return null;
}

/** Enters a finished run. Sending the same run again returns the existing entry, so a retry is always safe. */
export async function submitRun(run: RunState, name: string): Promise<HallOfFameEntry> {
  if (!runOutcome(run)) throw new HallOfFameError("Only finished runs can enter the hall of fame.");
  const body = await request("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runSubmission(run, name)),
  });
  if (!isEntry(body)) throw new HallOfFameError(NOT_UNDERSTOOD);
  return body;
}

/** Loads the best runs. */
export async function fetchHallOfFame(): Promise<HallOfFameList> {
  const body = (await request("/api/runs")) as Partial<HallOfFameList> | null;
  if (!Array.isArray(body?.entries) || !body.entries.every(isEntry) || !isCount(body.total)) {
    throw new HallOfFameError(NOT_UNDERSTOOD);
  }
  return { entries: body.entries, total: body.total };
}

const NOT_UNDERSTOOD = "The hall of fame sent an answer we don't understand.";

/** Sends a request and returns the JSON body; any failure becomes a `HallOfFameError` with a readable message. */
async function request(url: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(HALL_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HallOfFameError("The hall of fame took too long to answer.");
    }
    throw new HallOfFameError("The hall of fame can't be reached. Check your connection.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: unknown } | null)?.error;
    if (typeof error === "string") throw new HallOfFameError(error);
    throw new HallOfFameError(
      response.status >= 500 ? "The hall of fame is unavailable right now." : `The hall of fame rejected the request (${response.status}).`,
    );
  }
  return body;
}

const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

/**
 * Checks that an API answer really is an entry before the page shows it.
 * The shared type only holds at compile time; at runtime the answer is just JSON (decision 7).
 */
function isEntry(value: unknown): value is HallOfFameEntry {
  const e = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  return (
    typeof e.runId === "string" &&
    typeof e.name === "string" &&
    isCount(e.wins) &&
    isCount(e.lives) &&
    isCount(e.rounds) &&
    (e.outcome === "victory" || e.outcome === "defeat") &&
    typeof e.submittedAt === "string" &&
    isCount(e.rank) &&
    e.rank >= 1
  );
}
