import { useEffect, useState } from "react";
import { TICK_SECONDS } from "../battle";
import { describeEffects, getItem } from "../items";
import { moveBlocker, sellPrice } from "../run";
import { BACKPACK_COLS } from "../shop";
import type { ItemDef, RunState } from "../types";

/** Hover text for a backpack slot: name, effects and cooldown. */
const tooltip = (item: ItemDef) =>
  [item.name, ...describeEffects(item.effects).map(({ label }) => label), `⏱️ every ${item.cooldown * TICK_SECONDS}s`].join("\n");

interface BackpackProps {
  run: RunState;
  /** Called with the slot index when the player sells that item. */
  onSell: (slotIndex: number) => void;
  /** Called when the player moves the item in `from` to `to` (swaps if `to` is occupied). */
  onMove: (from: number, to: number) => void;
}

export function Backpack({ run, onSell, onMove }: BackpackProps) {
  // Which slot is selected for moving. Pure UI state: not part of the run, not saved.
  const [selected, setSelected] = useState<number | null>(null);
  // A selection only counts while its slot still holds an item (e.g. not after selling it).
  const active = selected !== null && run.backpack[selected] ? selected : null;
  const activeItem = active !== null ? getItem(run.backpack[active]!.itemId) : null;

  // Esc cancels the selection.
  useEffect(() => {
    if (active === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  function handleSlotClick(index: number) {
    if (active === null) {
      if (run.backpack[index]) setSelected(index);
      return;
    }
    // Clicking the selected item again cancels; clicking a possible target moves there.
    if (moveBlocker(run, active, index) === null) onMove(active, index);
    setSelected(null);
  }

  return (
    <section className="rounded-lg border border-panel-edge bg-panel p-4">
      <h2 className="font-display text-xl font-bold">🎒 Backpack</h2>
      <p className="mb-3 min-h-10 text-sm text-muted" aria-live="polite">
        {activeItem
          ? `Moving ${activeItem.name}: click a highlighted slot. Click it again or press Esc to cancel.`
          : "Click an item to move it. Hover for its stats."}
      </p>
      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${BACKPACK_COLS}, minmax(0, 1fr))` }}>
        {run.backpack.map((slot, index) => {
          const item = slot ? getItem(slot.itemId) : null;
          const isSelected = index === active;
          const isTarget = active !== null && moveBlocker(run, active, index) === null;

          let label: string;
          if (isSelected) label = `Cancel moving ${item!.name}`;
          else if (isTarget) label = item ? `Swap ${activeItem!.name} with ${item.name}` : `Move ${activeItem!.name} to slot ${index + 1}`;
          else label = item ? `Select ${item.name}` : `Empty slot ${index + 1}`;

          let look: string;
          if (isSelected) look = "border-gold bg-gold/20 ring-2 ring-gold";
          else if (isTarget) look = "border-dashed border-gold bg-gold/5 hover:bg-gold/15";
          else if (item) look = "border-gold/40 bg-ink/40 hover:border-gold";
          else look = "border-dashed border-panel-edge";

          return (
            <li key={slot?.uid ?? `empty-${index}`} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSlotClick(index)}
                disabled={!item && !isTarget}
                aria-pressed={item ? isSelected : undefined}
                aria-label={label}
                title={item ? tooltip(item) : undefined}
                className={["flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 p-1", look].join(" ")}
              >
                {item && (
                  <>
                    <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="text-center text-xs leading-tight">{item.name}</span>
                  </>
                )}
                {isTarget && <span className="text-xs font-bold text-gold">{item ? "⇄ Swap" : "Move here"}</span>}
              </button>
              {item && (
                <button
                  type="button"
                  onClick={() => onSell(index)}
                  aria-label={`Sell ${item.name} for ${sellPrice(item.id)} gold`}
                  className="rounded bg-gold px-1.5 text-xs font-bold text-ink hover:brightness-110 disabled:bg-panel-edge disabled:text-muted"
                >
                  Sell {sellPrice(item.id)} 🪙
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
