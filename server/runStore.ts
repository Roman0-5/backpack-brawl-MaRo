import type { StoredRun } from "./runs.ts";

/**
 * Where entered runs are kept. The hall of fame only talks to this interface,
 * so the in-memory store could be swapped for a database without touching the rules.
 */
export interface RunStore {
  add(run: StoredRun): void;
  findById(runId: string): StoredRun | undefined;
  all(): StoredRun[];
}

/** Keeps runs in memory; a server restart empties it (enough for B7, see REQUIREMENTS.md). */
export function createMemoryStore(): RunStore {
  const runs: StoredRun[] = [];
  return {
    add: (run) => void runs.push(run),
    findById: (runId) => runs.find((run) => run.runId === runId),
    all: () => [...runs],
  };
}
