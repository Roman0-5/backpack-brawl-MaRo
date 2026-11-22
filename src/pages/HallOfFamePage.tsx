import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ROUTES } from "../game";
import { fetchHallOfFame, HallOfFameError, type HallOfFameList } from "../hallOfFame";
import { RANKING_RULE } from "../rules";
import { useGame } from "../state/GameContext";

type Loading = { status: "loading" } | { status: "failed"; message: string } | { status: "ready"; list: HallOfFameList };

/** Loads the hall of fame when the page opens; `retry` loads it again after an error. */
function useHallOfFame() {
  const [state, setState] = useState<Loading>({ status: "loading" });
  // Changing this starts a new request (see the effect below).
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // An answer that arrives after leaving the page (or after a newer request started) is ignored.
    let current = true;
    fetchHallOfFame().then(
      (list) => current && setState({ status: "ready", list }),
      (error: unknown) => {
        const message = error instanceof HallOfFameError ? error.message : "Something went wrong. Please try again.";
        if (current) setState({ status: "failed", message });
      },
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((count) => count + 1);
  }

  return { state, retry };
}

export function HallOfFamePage() {
  const { state, retry } = useHallOfFame();
  const { game } = useGame();
  // The player's own run, if it was entered from this browser, is highlighted.
  const ownRunId = game?.run.submitted ? game.run.runId : null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg border-2 border-gold bg-panel p-6">
      <header className="flex flex-col gap-1 text-center">
        <h2 className="font-display text-3xl font-bold">🏆 Hall of Fame</h2>
        <p className="text-sm text-muted">{RANKING_RULE}</p>
      </header>

      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" && <p className="animate-pulse text-center text-gold">📜 Unrolling the scroll of champions…</p>}

        {state.status === "failed" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p role="alert" className="text-life">
              ⚠️ {state.message}
            </p>
            <button type="button" onClick={retry} className="rounded-md bg-gold px-4 py-2 font-display font-bold text-ink hover:brightness-110">
              ↻ Retry
            </button>
          </div>
        )}

        {state.status === "ready" && state.list.entries.length === 0 && (
          <p className="text-center text-muted">
            No runs yet. Finish a run and be the first name on the scroll!
          </p>
        )}

        {state.status === "ready" && state.list.entries.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-panel-edge text-xs tracking-wider text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-2 py-2">#</th>
                    <th scope="col" className="px-2 py-2">Name</th>
                    <th scope="col" className="px-2 py-2">Result</th>
                    <th scope="col" className="px-2 py-2 text-right">Wins</th>
                    <th scope="col" className="px-2 py-2 text-right">Lives left</th>
                    <th scope="col" className="px-2 py-2 text-right">Rounds</th>
                    <th scope="col" className="px-2 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {state.list.entries.map((entry) => {
                    const own = entry.runId === ownRunId;
                    return (
                      <tr key={entry.runId} className={`border-b border-panel-edge/50 ${own ? "bg-gold/15 font-bold" : ""}`}>
                        <td className="px-2 py-2 text-gold">{entry.rank}</td>
                        <td className="px-2 py-2 break-all">
                          {entry.name}
                          {own && <span className="ml-2 text-xs text-gold">(you)</span>}
                        </td>
                        <td className="px-2 py-2">{entry.outcome === "victory" ? "👑 Victory" : "🪦 Defeat"}</td>
                        <td className="px-2 py-2 text-right">{entry.wins}</td>
                        <td className="px-2 py-2 text-right">{entry.lives}</td>
                        <td className="px-2 py-2 text-right">{entry.rounds}</td>
                        <td className="px-2 py-2 text-right text-muted">{new Date(entry.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-center text-xs text-muted">
              Showing the best {state.list.entries.length} of {state.list.total} {state.list.total === 1 ? "run" : "runs"}.
            </p>
          </>
        )}
      </div>

      <Link to={ROUTES.start} className="self-center text-sm text-gold underline-offset-4 hover:underline">
        ← Back to the start
      </Link>
    </section>
  );
}
