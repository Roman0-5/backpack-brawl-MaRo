import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchOpponent, parseOpponent } from "./api";

const validOpponent = { id: "dummy", name: "Training Dummy", icon: "🪵", hp: 10, round: 1, items: ["pot-lid"] };

/** Ersetzt `fetch` für einen Test durch eine Attrappe. */
function mockFetch(implementation: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(implementation));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseOpponent", () => {
  test("accepts a valid opponent", () => {
    expect(parseOpponent(validOpponent)).toEqual(validOpponent);
  });

  test.each([
    ["no object", null],
    ["missing round", { ...validOpponent, round: undefined }],
    ["round 0", { ...validOpponent, round: 0 }],
    ["hp as text", { ...validOpponent, hp: "10" }],
    ["unknown item", { ...validOpponent, items: ["laser-sword"] }],
  ])("rejects %s with a readable message", (_, value) => {
    expect(() => parseOpponent(value)).toThrow("The arena sent an answer we don't understand.");
  });
});

describe("fetchOpponent", () => {
  test("returns the opponent on success", async () => {
    mockFetch(async () => Response.json(validOpponent));
    await expect(fetchOpponent(1)).resolves.toEqual(validOpponent);
  });

  test("explains when the arena can't be reached", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(fetchOpponent(1)).rejects.toThrow("The arena can't be reached. Check your connection.");
  });

  test("explains a timeout", async () => {
    mockFetch(async () => {
      throw new DOMException("signal timed out", "TimeoutError");
    });
    await expect(fetchOpponent(1)).rejects.toThrow("The arena took too long to answer.");
  });

  test("explains a server error without details", async () => {
    mockFetch(async () => new Response("Bad Gateway", { status: 502 }));
    await expect(fetchOpponent(1)).rejects.toThrow("The arena is unavailable right now.");
  });

  test("passes on the server's own error text", async () => {
    mockFetch(async () => Response.json({ error: "round must be a positive whole number" }, { status: 400 }));
    await expect(fetchOpponent(1)).rejects.toThrow("round must be a positive whole number");
  });

  test("rejects an answer that is not an opponent", async () => {
    mockFetch(async () => Response.json({ hello: "world" }));
    await expect(fetchOpponent(1)).rejects.toThrow("The arena sent an answer we don't understand.");
  });
});
