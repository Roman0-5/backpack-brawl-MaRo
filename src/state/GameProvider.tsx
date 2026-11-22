import { useEffect, useState, type ReactNode } from "react";
import { newGame } from "../game";
import { fromSave, SAVE_KEY, toSave, type LoadResult } from "../save";
import type { GameState } from "../types";
import { GameContext, type GameContextValue } from "./GameContext";

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** Reads the saved run once at startup. Blocked storage counts as "no save". */
function loadSavedGame(): LoadResult {
  try {
    return fromSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return { game: null, notice: null };
  }
}

/**
 * Holds the game state for all routes, so it survives navigating between pages,
 * and keeps it in localStorage, so it survives a reload (B6).
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(loadSavedGame);
  const [game, setGame] = useState<GameState | null>(saved.game);
  const [notice, setNotice] = useState<string | null>(saved.notice);

  // Every change is saved right away; without a run (e.g. a discarded save) the old save is removed.
  useEffect(() => {
    try {
      if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(toSave(game)));
      else localStorage.removeItem(SAVE_KEY);
    } catch {
      // Storage full or blocked: the run still works, it just won't survive a reload.
    }
  }, [game]);

  const value: GameContextValue = {
    game,
    notice,
    startNewRun: () => {
      setNotice(null);
      setGame(newGame(randomSeed(), crypto.randomUUID()));
    },
    update: (transition) => setGame((current) => (current ? transition(current) : current)),
  };

  return <GameContext value={value}>{children}</GameContext>;
}
