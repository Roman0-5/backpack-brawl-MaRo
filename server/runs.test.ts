import { describe, expect, test } from "vitest";
import { createMemoryStore } from "./runStore.ts";
import { createHallOfFame, NAME_MAX_LENGTH, parseRun, RunRejected, TOP_COUNT, type RunSubmission } from "./runs.ts";

/** Gültiger Sieg: 5 Siege, 1 Leben verloren, also 6 Runden. */
const victory: RunSubmission = { runId: "run-1", name: "Roman", wins: 5, lives: 2, rounds: 6 };
/** Gültige Niederlage: 2 Siege, alle 3 Leben verloren, also 5 Runden. */
const defeat: RunSubmission = { runId: "run-2", name: "Matthias", wins: 2, lives: 0, rounds: 5 };

/** Fehlermeldung, mit der `parseRun` ablehnt (oder `null`, wenn es akzeptiert). */
function rejection(body: unknown): string | null {
  try {
    parseRun(body);
    return null;
  } catch (error) {
    expect(error).toBeInstanceOf(RunRejected);
    expect((error as RunRejected).status).toBe(400);
    return (error as RunRejected).message;
  }
}

describe("validation", () => {
  test("accepts a victory and a defeat and works out the outcome", () => {
    expect(parseRun(victory)).toEqual({ ...victory, outcome: "victory" });
    expect(parseRun(defeat)).toEqual({ ...defeat, outcome: "defeat" });
  });

  test("trims the name and keeps only known fields", () => {
    expect(parseRun({ ...victory, name: "  Roman  ", admin: true })).toEqual({ ...victory, outcome: "victory" });
  });

  test("a name of exactly the maximum length is fine, emoji count as one character", () => {
    expect(rejection({ ...victory, name: "x".repeat(NAME_MAX_LENGTH) })).toBeNull();
    expect(rejection({ ...victory, name: "🐢".repeat(NAME_MAX_LENGTH) })).toBeNull();
  });

  test.each([
    ["no object", null, "JSON object"],
    ["an array", [], "JSON object"],
    ["missing runId", { ...victory, runId: undefined }, "runId"],
    ["empty runId", { ...victory, runId: "" }, "runId"],
    ["huge runId", { ...victory, runId: "x".repeat(65) }, "runId"],
    ["missing name", { ...victory, name: undefined }, "name"],
    ["blank name", { ...victory, name: "   " }, "enter a name"],
    ["too long name", { ...victory, name: "x".repeat(NAME_MAX_LENGTH + 1) }, "at most"],
    ["line break in name", { ...victory, name: "Ro\nman" }, "not allowed"],
    ["wins as text", { ...victory, wins: "5" }, "wins"],
    ["too many wins", { ...victory, wins: 6, rounds: 7 }, "wins"],
    ["fractional lives", { ...victory, lives: 1.5 }, "lives"],
    ["too many lives", { ...victory, lives: 4 }, "lives"],
    ["zero rounds", { ...victory, rounds: 0 }, "rounds"],
    ["unfinished run", { ...victory, wins: 4, rounds: 5 }, "finished"],
    ["won and lost", { ...victory, lives: 0, rounds: 8 }, "same time"],
    ["rounds don't add up", { ...victory, rounds: 5 }, "doesn't match"],
  ])("rejects %s", (_, body, message) => {
    expect(rejection(body)).toContain(message);
  });
});

describe("hall of fame", () => {
  test("starts empty", () => {
    expect(createHallOfFame().top()).toEqual({ entries: [], total: 0 });
  });

  test("enters a run with its rank and time", () => {
    const hall = createHallOfFame(createMemoryStore(), () => new Date("2026-11-22T12:00:00Z"));
    const { created, entry } = hall.submit(victory);
    expect(created).toBe(true);
    expect(entry).toEqual({ ...victory, outcome: "victory", submittedAt: "2026-11-22T12:00:00.000Z", rank: 1 });
  });

  test("the same run twice is listed once", () => {
    const hall = createHallOfFame();
    const first = hall.submit(victory);
    const again = hall.submit({ ...victory });
    expect(again).toEqual({ created: false, entry: first.entry });
    expect(hall.top().total).toBe(1);
  });

  test("the same run id with different numbers is a conflict", () => {
    const hall = createHallOfFame();
    hall.submit(victory);
    expect(() => hall.submit({ ...victory, name: "Someone else" })).toThrow(expect.objectContaining({ status: 409 }));
    expect(hall.top().total).toBe(1);
  });

  test("an invalid run is not stored", () => {
    const hall = createHallOfFame();
    expect(() => hall.submit({ ...victory, rounds: 99 })).toThrow(RunRejected);
    expect(hall.top().total).toBe(0);
  });

  test("ranks more wins first, then more lives left, then who entered first", () => {
    const hall = createHallOfFame();
    const runs: RunSubmission[] = [
      { runId: "a", name: "few wins", wins: 1, lives: 0, rounds: 4 },
      { runId: "b", name: "close win", wins: 5, lives: 1, rounds: 7 },
      { runId: "c", name: "clean win", wins: 5, lives: 3, rounds: 5 },
      { runId: "d", name: "close win 2", wins: 5, lives: 1, rounds: 7 },
      { runId: "e", name: "almost", wins: 4, lives: 0, rounds: 7 },
    ];
    runs.forEach((run) => hall.submit(run));
    const { entries } = hall.top();
    expect(entries.map((entry) => entry.name)).toEqual(["clean win", "close win", "close win 2", "almost", "few wins"]);
    expect(entries.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  test("the rank of a new entry counts the runs before it", () => {
    const hall = createHallOfFame();
    hall.submit(victory);
    expect(hall.submit(defeat).entry.rank).toBe(2);
  });

  test("never sends the internal tie-break counter", () => {
    const { entry } = createHallOfFame().submit(victory);
    expect(entry).not.toHaveProperty("order");
  });

  test(`lists only the best ${TOP_COUNT}, but counts all`, () => {
    const hall = createHallOfFame();
    for (let i = 0; i < TOP_COUNT + 2; i++) hall.submit({ ...defeat, runId: `run-${i}` });
    const { entries, total } = hall.top();
    expect(entries).toHaveLength(TOP_COUNT);
    expect(total).toBe(TOP_COUNT + 2);
  });

  test("keeps its runs in the given store", () => {
    const store = createMemoryStore();
    createHallOfFame(store).submit(victory);
    expect(store.findById("run-1")?.name).toBe("Roman");
  });
});

describe("memory store", () => {
  test("hands out a copy, so callers can't change the stored list", () => {
    const store = createMemoryStore();
    store.all().push({ ...victory, outcome: "victory", submittedAt: "", order: 0 });
    expect(store.all()).toEqual([]);
  });
});
