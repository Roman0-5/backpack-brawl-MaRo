# Backpack Brawl API

The local API is a small Express server in `server/index.ts` (TypeScript, run with `tsx`). It listens on port 4200 (override with the `PORT` environment variable). During Vite development, `/api` is proxied to it, so the frontend uses relative URLs such as `/api/opponents?round=1`. All responses are JSON. The only state on the server is the hall of fame, which lives in memory: restarting the server empties it. Everything else answers the same way every time.

## `GET /api/health`

Always answers immediately with status 200:

```json
{ "ok": true, "service": "backpack-brawl" }
```

## `GET /api/opponents`

Returns the opponent for one round of a run. The opponent table lives in `server/opponents.ts`.

### Query parameters

| Parameter | Required | Meaning |
|---|---|---|
| `round` | yes | The 1-based round number. Must be a positive whole number written in digits (`1`, `2`, …). |
| `latency` | no | Response delay in milliseconds, clamped to 0–5000. Defaults to 1200. A value that is not a number falls back to the default. |
| `fail` | no | `fail=true` forces a 503 response (see below). |

### Success — 200

```json
{
  "id": "mossback-hermit",
  "name": "Mossback Hermit",
  "icon": "🐢",
  "hp": 25,
  "items": ["chipped-dagger", "pot-lid"],
  "round": 1
}
```

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable identifier of the opponent |
| `name` | string | Display name |
| `icon` | string | Emoji shown in the battle view |
| `hp` | number | Maximum (and starting) HP |
| `items` | string[] | Item ids from the catalog in `src/items.ts`; the same id may appear several times |
| `round` | number | The round this opponent was requested for (echoes `round`) |

The response matches the `Opponent` type in `src/types.ts`.

The answer is deterministic: the same `round` always returns the same opponent. There is one hand-built opponent per round for rounds 1–7. Every round past the table returns the last opponent with +6 HP per additional round. The table never needs more than 7 rounds (5 wins + 3 lives − 1), and an opponent never carries more than 6 items, the size of the player's 2×3 backpack.

### Errors

Every error response has the shape:

```json
{ "error": "human-readable explanation" }
```

| Status | When | `error` |
|---|---|---|
| 400 | `round` is missing, not a whole number, or less than 1 | `round must be a positive whole number` |
| 503 | `fail=true`, or the server was started with `API_FAIL=true` | `The arena gates are shut. No challenger answered the call.` |

An invalid `round` is reported as 400 even when failure is forced. All responses from this endpoint, errors included, arrive after the configured delay.

## Hall of fame

Finished runs are entered with `POST /api/runs` and listed with `GET /api/runs`. The routes are in `server/index.ts`; the rules (validation, ranking) are in `server/runs.ts`, and the entries are kept in memory by `server/runStore.ts`. The TypeScript types `RunSubmission`, `HallOfFameEntry` and `HallOfFameList` in `server/runs.ts` describe the request and response bodies below.

Both endpoints accept the same query parameters as `/api/opponents` for trying out loading and error states:

| Parameter | Meaning |
|---|---|
| `latency` | Response delay in milliseconds, clamped to 0–5000. Defaults to 400. |
| `fail` | `fail=true` forces a 503 response. |

### Ranking

1. More wins first. A victory always has 5 wins, so every victory comes before every defeat.
2. With equal wins, more lives left. Every round is one battle (a win or a lost life), so this is the same as fewer rounds.
3. With equal wins and lives, whoever entered first.

`rank` is the 1-based position in this order.

### Entry

| Field | Type | Meaning |
|---|---|---|
| `runId` | string | Id the client gave the run when it started (1–64 characters) |
| `name` | string | Player name, trimmed, 1–20 characters |
| `wins` | number | Battles won, 0–5 |
| `lives` | number | Lives left, 0–3 |
| `rounds` | number | Battles fought |
| `outcome` | `"victory"` or `"defeat"` | Worked out by the server from `wins` and `lives` |
| `submittedAt` | string | ISO 8601 time the run was entered |
| `rank` | number | Position in the ranking |

### `GET /api/runs`

Returns the best 10 runs in ranking order and how many runs were entered in total.

```json
{
  "entries": [
    { "runId": "4f1c…", "name": "Roman", "wins": 5, "lives": 2, "rounds": 6, "outcome": "victory", "submittedAt": "2026-11-22T14:10:58.685Z", "rank": 1 }
  ],
  "total": 1
}
```

An empty hall of fame answers `{ "entries": [], "total": 0 }`.

### `POST /api/runs`

Enters a finished run. Body (JSON, `Content-Type: application/json`):

```json
{ "runId": "4f1c…", "name": "Roman", "wins": 5, "lives": 2, "rounds": 6 }
```

Other fields are ignored. The answer is the stored entry (see above), including its `rank`.

| Status | When |
|---|---|
| 201 | The run was entered. |
| 200 | A run with this `runId` and the same data was already entered. Nothing is added; the existing entry is returned. A client can therefore safely retry a submission whose answer got lost. |
| 400 | The body is not valid JSON, or the run is invalid or implausible (see below). |
| 409 | A run with this `runId` was already entered with different data. |
| 503 | `fail=true`, or the server was started with `API_FAIL=true`. |

### Validation

The server can't replay the battles: it would need the backpack of every round. It checks that the numbers describe a run that can really end this way:

- `runId` is a text of 1–64 characters.
- `name` is a text that, after trimming, has 1–20 characters (an emoji counts as one) and no control characters such as line breaks.
- `wins` is a whole number 0–5, `lives` 0–3, `rounds` 1–8.
- The run is finished: 5 wins or 0 lives, but not both.
- `rounds` equals `wins` plus lost lives (`3 − lives`).

### Errors

Errors use the usual shape `{ "error": "…" }`; the text can be shown to the player as it is. Examples:

| Status | `error` |
|---|---|
| 400 | `The request body must be valid JSON.` |
| 400 | `The request body must be a JSON object.` |
| 400 | `Please enter a name.` |
| 400 | `The name can be at most 20 characters long.` |
| 400 | `Only finished runs can enter the hall of fame.` |
| 400 | `rounds doesn't match wins and lost lives.` |
| 409 | `This run was already entered with different data.` |
| 503 | `The hall of fame is closed right now.` |

## Environment variables

| Variable | Effect |
|---|---|
| `PORT` | Port to listen on (default 4200). The Vite proxy expects 4200. |
| `API_LATENCY` | Delay in milliseconds for requests without a `latency` parameter (all endpoints except `/api/health`). |
| `API_FAIL` | `true` makes every opponent and hall-of-fame request fail with 503. |

Example: `API_FAIL=true pnpm server`.

## Client

`fetchOpponent(round)` in `src/api.ts` performs the request. It resolves with the `Opponent` on success and throws an `Error` carrying the server's `error` text (or a generic message with the status code) for any non-2xx response. When the API is not running, the Vite proxy answers with an error status of its own, which is reported the same way; a network failure rejects as well.
