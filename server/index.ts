import cors from "cors";
import express, { type ErrorRequestHandler, type Request } from "express";
import { opponentForRound, parseRound } from "./opponents.ts";
import { createHallOfFame, RunRejected } from "./runs.ts";

const app = express();
const port = Number(process.env.PORT ?? 4200);
const hallOfFame = createHallOfFame();

app.use(cors()); app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "backpack-brawl" }));

/** Response delay for a request: `?latency=` or `API_LATENCY`, clamped to 0–5000 ms. */
function latencyOf(req: Request, fallback: number): number {
  const requested = Number(req.query.latency ?? process.env.API_LATENCY ?? fallback);
  return Number.isFinite(requested) ? Math.max(0, Math.min(5000, requested)) : fallback;
}

/** Whether a failure was forced for testing: `?fail=true` or `API_FAIL=true`. */
const failForced = (req: Request) => req.query.fail === "true" || process.env.API_FAIL === "true";

app.get("/api/opponents", (req, res) => {
  setTimeout(() => {
    const round = parseRound(req.query.round);
    if (round === null) return res.status(400).json({ error: "round must be a positive whole number" });
    if (failForced(req)) {
      return res.status(503).json({ error: "The arena gates are shut. No challenger answered the call." });
    }
    res.json(opponentForRound(round));
  }, latencyOf(req, 1200));
});

const HALL_UNAVAILABLE = "The hall of fame is closed right now.";

app.get("/api/runs", (req, res) => {
  setTimeout(() => {
    if (failForced(req)) return res.status(503).json({ error: HALL_UNAVAILABLE });
    res.json(hallOfFame.top());
  }, latencyOf(req, 400));
});

app.post("/api/runs", (req, res) => {
  setTimeout(() => {
    if (failForced(req)) return res.status(503).json({ error: HALL_UNAVAILABLE });
    try {
      const { created, entry } = hallOfFame.submit(req.body);
      res.status(created ? 201 : 200).json(entry);
    } catch (error) {
      if (error instanceof RunRejected) return res.status(error.status).json({ error: error.message });
      // Inside setTimeout Express can't catch it, so answer here instead of crashing the server.
      console.error(error);
      res.status(500).json({ error: "Something went wrong in the hall of fame." });
    }
  }, latencyOf(req, 400));
});

// Body that isn't valid JSON: answer in the same error format as every other endpoint.
const invalidJson: ErrorRequestHandler = (error, _req, res, next) => {
  if (error?.type === "entity.parse.failed") return res.status(400).json({ error: "The request body must be valid JSON." });
  next(error);
};
app.use(invalidJson);

app.listen(port, () => console.log(`Backpack Brawl API listening on http://localhost:${port}`));
