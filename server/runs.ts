/**
 * Hall of fame (B7): validates finished runs, ranks them and answers what the endpoints need.
 * Pure module without Express, so the rules can be unit-tested (see runs.test.ts).
 */
import { createMemoryStore, type RunStore } from "./runStore.ts";

/** Same values as START_LIVES and WINS_TO_VICTORY in src/run.ts (a client test keeps them in sync). */
export const START_LIVES = 3;
export const WINS_TO_VICTORY = 5;

export const NAME_MAX_LENGTH = 20;
export const RUN_ID_MAX_LENGTH = 64;
/** How many entries `GET /api/runs` lists. */
export const TOP_COUNT = 10;

/** What a client sends for a finished run (`POST /api/runs`). */
export interface RunSubmission {
  runId: string;
  name: string;
  wins: number;
  lives: number;
  rounds: number;
}

/** A submission after validation; the server works out the outcome itself. */
export interface ValidRun extends RunSubmission {
  outcome: "victory" | "defeat";
}

/** A run as the store keeps it. `order` breaks ties and is never sent to clients. */
export interface StoredRun extends ValidRun {
  submittedAt: string;
  order: number;
}

/** One run as the API returns it. The client imports this type, so both sides agree on the fields. */
export interface HallOfFameEntry extends ValidRun {
  submittedAt: string;
  /** 1-based position in the ranking. */
  rank: number;
}

/** Answer of `GET /api/runs`. */
export interface HallOfFameList {
  entries: HallOfFameEntry[];
  /** How many runs were entered in total. */
  total: number;
}

/** Thrown for a submission the hall of fame won't accept; `status` is the HTTP status to answer with. */
export class RunRejected extends Error {
  status: 400 | 409;

  constructor(status: 400 | 409, message: string) {
    super(message);
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

function reject(message: string): never {
  throw new RunRejected(400, message);
}

/**
 * Checks a submitted run (any JSON) and returns only the checked fields.
 * The server can't replay the battles (it would need the backpack of every round),
 * so it checks that the numbers describe a run that can really end this way.
 */
export function parseRun(body: unknown): ValidRun {
  if (!isRecord(body)) reject("The request body must be a JSON object.");
  const { runId, wins, lives, rounds } = body;

  if (typeof runId !== "string" || runId.length === 0 || runId.length > RUN_ID_MAX_LENGTH) {
    reject(`runId must be a text of 1–${RUN_ID_MAX_LENGTH} characters.`);
  }

  if (typeof body.name !== "string") reject("name must be a text.");
  const name = body.name.trim();
  // Count characters, not UTF-16 units, so an emoji counts as one.
  const length = [...name].length;
  if (length === 0) reject("Please enter a name.");
  if (length > NAME_MAX_LENGTH) reject(`The name can be at most ${NAME_MAX_LENGTH} characters long.`);
  // Control characters (line breaks, tabs, …) would break the list layout.
  if (/\p{Cc}/u.test(name)) reject("The name contains characters that are not allowed.");

  if (!isInt(wins, 0, WINS_TO_VICTORY)) reject(`wins must be a whole number from 0 to ${WINS_TO_VICTORY}.`);
  if (!isInt(lives, 0, START_LIVES)) reject(`lives must be a whole number from 0 to ${START_LIVES}.`);
  if (!isInt(rounds, 1, WINS_TO_VICTORY + START_LIVES)) reject("rounds must be a positive whole number.");

  // A run ends with the 5th win or the last lost life, never both, and never earlier.
  const victory = wins === WINS_TO_VICTORY;
  const defeat = lives === 0;
  if (victory && defeat) reject("A run can't be won and lost at the same time.");
  if (!victory && !defeat) reject("Only finished runs can enter the hall of fame.");
  // Every round is one battle: a win or a lost life.
  if (rounds !== wins + (START_LIVES - lives)) reject("rounds doesn't match wins and lost lives.");

  return { runId, name, wins, lives, rounds, outcome: victory ? "victory" : "defeat" };
}

/**
 * Ranking: more wins first (all victories have 5 wins, so they come first),
 * then more lives left, then whoever entered first.
 * With equal wins, more lives left is the same as fewer rounds (rounds = wins + lost lives).
 */
export function compareRuns(a: StoredRun, b: StoredRun): number {
  return b.wins - a.wins || b.lives - a.lives || a.order - b.order;
}

const sameRun = (a: ValidRun, b: ValidRun) =>
  a.name === b.name && a.wins === b.wins && a.lives === b.lives && a.rounds === b.rounds;

/** What clients get to see of a stored run: no internal counter, plus its rank. */
function toEntry(run: StoredRun, rank: number): HallOfFameEntry {
  const { runId, name, wins, lives, rounds, outcome, submittedAt } = run;
  return { runId, name, wins, lives, rounds, outcome, submittedAt, rank };
}

export interface HallOfFame {
  /**
   * Enters a run. The same `runId` again (e.g. a retry after a lost response) returns the existing entry
   * instead of adding a second one. Throws `RunRejected` for invalid data.
   */
  submit(body: unknown): { created: boolean; entry: HallOfFameEntry };
  /** The best `TOP_COUNT` runs in ranking order. */
  top(): HallOfFameList;
}

/** A hall of fame on top of a store. The server creates one; tests create their own. */
export function createHallOfFame(store: RunStore = createMemoryStore(), now = () => new Date()): HallOfFame {
  const ranked = () => store.all().sort(compareRuns);
  const rankOf = (run: StoredRun) => ranked().indexOf(run) + 1;

  return {
    submit(body) {
      const run = parseRun(body);
      const existing = store.findById(run.runId);
      if (existing) {
        if (!sameRun(existing, run)) throw new RunRejected(409, "This run was already entered with different data.");
        return { created: false, entry: toEntry(existing, rankOf(existing)) };
      }
      const stored: StoredRun = { ...run, submittedAt: now().toISOString(), order: store.all().length };
      store.add(stored);
      return { created: true, entry: toEntry(stored, rankOf(stored)) };
    },

    top() {
      const all = ranked();
      return { entries: all.slice(0, TOP_COUNT).map((run, index) => toEntry(run, index + 1)), total: all.length };
    },
  };
}
