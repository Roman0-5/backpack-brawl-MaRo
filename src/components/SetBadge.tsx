import { setHelp } from "../rules";
import { SETS } from "../sets";
import type { SetId } from "../types";

/** Badge colour per set. */
const SET_COLOUR: Record<SetId, string> = {
  fire: "border-burn/60 bg-burn/15 text-burn",
  iron: "border-block/60 bg-block/15 text-block",
};

interface SetBadgeProps {
  set: SetId;
  /** Only the icon, for small spaces like a backpack slot. */
  compact?: boolean;
}

/** Shows which set an item belongs to; the tooltip explains the set bonus. */
export function SetBadge({ set, compact = false }: SetBadgeProps) {
  const { icon, name } = SETS[set];
  return (
    <span
      title={setHelp(set)}
      aria-label={`${name} set`}
      className={`inline-flex cursor-help items-center gap-1 rounded-full border px-1.5 text-xs font-bold leading-5 ${SET_COLOUR[set]}`}
    >
      <span aria-hidden>{icon}</span>
      {!compact && <span aria-hidden>{name}</span>}
    </span>
  );
}
