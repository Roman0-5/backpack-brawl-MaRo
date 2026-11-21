import type { ItemDef, ItemEffects, SetId } from "./types";

/** A set's bonus is active while a backpack holds at least this many different items of it. */
export const SET_THRESHOLD = 2;

export interface SetDef {
  id: SetId;
  name: string;
  icon: string;
  /**
   * Added to every item of the fighter that already has this effect
   * (e.g. `{ burn: 1 }`: each burn item applies one more stack).
   */
  bonus: ItemEffects;
}

export const SETS: Record<SetId, SetDef> = {
  fire: { id: "fire", name: "Fire", icon: "🔥", bonus: { burn: 1 } },
  iron: { id: "iron", name: "Iron", icon: "🛡️", bonus: { block: 2 } },
};

/** All set ids in a fixed order, so lists of sets are always shown the same way. */
export const SET_IDS = Object.keys(SETS) as SetId[];

type SetMember = Pick<ItemDef, "id" | "set">;

/** Number of different items per set; copies of the same item count once. */
export function setCounts(items: SetMember[]): Record<SetId, number> {
  const counts = Object.fromEntries(SET_IDS.map((id) => [id, 0])) as Record<SetId, number>;
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.set || seen.has(item.id)) continue;
    seen.add(item.id);
    counts[item.set] += 1;
  }
  return counts;
}

/** Sets whose bonus is active for these items, in `SET_IDS` order. */
export function activeSets(items: SetMember[]): SetId[] {
  const counts = setCounts(items);
  return SET_IDS.filter((id) => counts[id] >= SET_THRESHOLD);
}
