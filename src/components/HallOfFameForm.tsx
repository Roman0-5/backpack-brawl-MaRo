import { useRef, useState, type FormEvent } from "react";
import { HallOfFameError, nameBlocker, NAME_MAX_LENGTH, submitRun, type HallOfFameEntry } from "../hallOfFame";
import type { RunState } from "../types";

type Submission =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "failed"; message: string }
  | { status: "done"; entry: HallOfFameEntry };

/**
 * Sending state of the hall-of-fame entry (UI state, not saved: decision 4).
 * Only "submitted" is part of the run, so it survives a reload (`onSubmitted`).
 */
function useRunSubmission(run: RunState, onSubmitted: () => void) {
  const [submission, setSubmission] = useState<Submission>({ status: "idle" });
  // A double click can fire twice before React re-renders; the ref blocks the second call right away.
  const sending = useRef(false);

  async function submit(name: string) {
    if (sending.current || run.submitted || nameBlocker(name) !== null) return;
    sending.current = true;
    setSubmission({ status: "sending" });
    try {
      const entry = await submitRun(run, name);
      setSubmission({ status: "done", entry });
      onSubmitted();
    } catch (error) {
      const message = error instanceof HallOfFameError ? error.message : "Something went wrong. Please try again.";
      setSubmission({ status: "failed", message });
    } finally {
      sending.current = false;
    }
  }

  return { submission, submit };
}

export function HallOfFameForm({ run, onSubmitted }: { run: RunState; onSubmitted: () => void }) {
  const { submission, submit } = useRunSubmission(run, onSubmitted);
  // The name stays here after a failed attempt, so a retry needs no retyping.
  const [name, setName] = useState("");

  if (submission.status === "done") {
    const { entry } = submission;
    return (
      <p role="status" className="font-bold text-gold">
        🏆 {entry.name} entered the hall of fame at rank #{entry.rank}.
      </p>
    );
  }
  // After a reload the rank is unknown, but the run must not be sent again.
  if (run.submitted) {
    return (
      <p role="status" className="font-bold text-gold">
        🏆 This run is already in the hall of fame.
      </p>
    );
  }

  const sending = submission.status === "sending";
  const failed = submission.status === "failed";
  const blocker = nameBlocker(name);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(name);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 text-left">
      <fieldset disabled={sending} className="flex flex-col gap-2">
        <label htmlFor="hof-name" className="text-sm text-muted">
          Enter your name for the hall of fame (up to {NAME_MAX_LENGTH} characters)
        </label>
        <div className="flex gap-2">
          <input
            id="hof-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="nickname"
            autoFocus
            className="min-w-0 flex-1 rounded-md border border-panel-edge bg-ink px-3 py-2 text-parchment focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={blocker !== null}
            title={blocker ?? undefined}
            className="shrink-0 rounded-md bg-gold px-4 py-2 font-display font-bold text-ink hover:brightness-110 disabled:bg-panel-edge disabled:text-muted"
          >
            {sending ? "Sending…" : (blocker ?? (failed ? "↻ Retry" : "🏆 Submit"))}
          </button>
        </div>
      </fieldset>
      <div aria-live="polite">
        {failed && (
          <p role="alert" className="text-life">
            ⚠️ {submission.message}
          </p>
        )}
      </div>
    </form>
  );
}
