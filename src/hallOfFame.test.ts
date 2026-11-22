import { afterEach, describe, expect, test, vi } from "vitest";
import * as server from "../server/runs.ts";
import { fetchHallOfFame, nameBlocker, NAME_MAX_LENGTH, runSubmission, submitRun, type HallOfFameEntry } from "./hallOfFame";
import { newRun, START_LIVES, WINS_TO_VICTORY } from "./run";
import type { RunState } from "./types";

/** Gewonnener Run: 5 Siege, 1 Leben verloren. */
const wonRun: RunState = { ...newRun(1, "run-1"), wins: WINS_TO_VICTORY, lives: 2, round: 6 };
/** Verlorener Run: 2 Siege, alle Leben verloren. */
const lostRun: RunState = { ...newRun(1, "run-2"), wins: 2, lives: 0, round: 5 };

const entry: HallOfFameEntry = {
  runId: "run-1",
  name: "Roman",
  wins: 5,
  lives: 2,
  rounds: 6,
  outcome: "victory",
  submittedAt: "2026-11-22T12:00:00.000Z",
  rank: 1,
};

/** Ersetzt `fetch` für einen Test durch eine Attrappe und gibt sie zurück. */
function mockFetch(implementation: () => Promise<Response>) {
  const fetch = vi.fn(implementation);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("client and server agree", () => {
  test("same game limits", () => {
    expect(server.START_LIVES).toBe(START_LIVES);
    expect(server.WINS_TO_VICTORY).toBe(WINS_TO_VICTORY);
    expect(server.NAME_MAX_LENGTH).toBe(NAME_MAX_LENGTH);
  });

  test("the server accepts what the client sends for a victory and a defeat", () => {
    expect(server.parseRun(runSubmission(wonRun, "Roman")).outcome).toBe("victory");
    expect(server.parseRun(runSubmission(lostRun, "Matthias")).outcome).toBe("defeat");
  });
});

describe("what gets sent", () => {
  test("rounds are the battles fought, the name is trimmed", () => {
    expect(runSubmission(wonRun, "  Roman ")).toEqual({ runId: "run-1", name: "Roman", wins: 5, lives: 2, rounds: 6 });
  });

  test.each([
    ["", "Enter a name"],
    ["   ", "Enter a name"],
    ["x".repeat(NAME_MAX_LENGTH + 1), `At most ${NAME_MAX_LENGTH} characters`],
    ["Roman", null],
    ["🐢".repeat(NAME_MAX_LENGTH), null],
  ])("name %j → %s", (name, reason) => {
    expect(nameBlocker(name)).toBe(reason);
  });
});

describe("submitRun", () => {
  test("posts the run and returns the entry", async () => {
    const fetch = mockFetch(async () => Response.json(entry, { status: 201 }));
    await expect(submitRun(wonRun, "Roman")).resolves.toEqual(entry);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/runs");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(runSubmission(wonRun, "Roman"));
  });

  test("never sends a run that is still going", async () => {
    const fetch = mockFetch(async () => Response.json(entry));
    await expect(submitRun(newRun(1, "run-1"), "Roman")).rejects.toThrow("Only finished runs");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("passes on the server's reason for rejecting", async () => {
    mockFetch(async () => Response.json({ error: "Please enter a name." }, { status: 400 }));
    await expect(submitRun(wonRun, "Roman")).rejects.toThrow("Please enter a name.");
  });

  test("explains when the server can't be reached", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(submitRun(wonRun, "Roman")).rejects.toThrow("The hall of fame can't be reached. Check your connection.");
  });

  test("explains a timeout", async () => {
    mockFetch(async () => {
      throw new DOMException("signal timed out", "TimeoutError");
    });
    await expect(submitRun(wonRun, "Roman")).rejects.toThrow("The hall of fame took too long to answer.");
  });

  test("rejects an answer that is not an entry", async () => {
    mockFetch(async () => Response.json({ hello: "world" }, { status: 201 }));
    await expect(submitRun(wonRun, "Roman")).rejects.toThrow("don't understand");
  });
});

describe("fetchHallOfFame", () => {
  test("returns the entries", async () => {
    mockFetch(async () => Response.json({ entries: [entry], total: 3 }));
    await expect(fetchHallOfFame()).resolves.toEqual({ entries: [entry], total: 3 });
  });

  test("an empty hall of fame is fine", async () => {
    mockFetch(async () => Response.json({ entries: [], total: 0 }));
    await expect(fetchHallOfFame()).resolves.toEqual({ entries: [], total: 0 });
  });

  test("explains a server error without details", async () => {
    mockFetch(async () => new Response("Bad Gateway", { status: 502 }));
    await expect(fetchHallOfFame()).rejects.toThrow("The hall of fame is unavailable right now.");
  });

  test.each([
    ["no list", { total: 0 }],
    ["broken entry", { entries: [{ ...entry, rank: 0 }], total: 1 }],
    ["unknown outcome", { entries: [{ ...entry, outcome: "draw" }], total: 1 }],
  ])("rejects an answer with %s", async (_, body) => {
    mockFetch(async () => Response.json(body));
    await expect(fetchHallOfFame()).rejects.toThrow("don't understand");
  });
});
