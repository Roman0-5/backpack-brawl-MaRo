import type { ItemDef, ItemEffects } from "./types";

export const CATALOG: ItemDef[] = [
  { id: "chipped-dagger", name: "Chipped Dagger", icon: "🗡️", price: 2, cooldown: 4, effects: { damage: 3 } },
  { id: "hunting-bow", name: "Hunting Bow", icon: "🏹", price: 4, cooldown: 4, effects: { damage: 5 } },
  { id: "iron-cleaver", name: "Iron Cleaver", icon: "🪓", price: 5, cooldown: 8, effects: { damage: 12 } },
  { id: "oak-buckler", name: "Oak Buckler", icon: "🛡️", price: 3, cooldown: 5, effects: { block: 4 } },
  { id: "pot-lid", name: "Pot Lid", icon: "🍳", price: 2, cooldown: 3, effects: { block: 2 } },
  { id: "spiked-shield", name: "Spiked Shield", icon: "⚔️", price: 4, cooldown: 6, effects: { damage: 3, block: 3 } },
  { id: "healing-herb", name: "Healing Herb", icon: "🌿", price: 2, cooldown: 4, effects: { heal: 3 } },
  { id: "troll-blood", name: "Troll Blood", icon: "🩸", price: 4, cooldown: 8, effects: { heal: 8 } },
  { id: "blessed-amulet", name: "Blessed Amulet", icon: "📿", price: 4, cooldown: 5, effects: { heal: 2, block: 2 } },
  { id: "poison-dart", name: "Poison Dart", icon: "🎯", price: 3, cooldown: 6, effects: { damage: 1, poison: 1 } },
  { id: "toxic-vial", name: "Toxic Vial", icon: "🧪", price: 4, cooldown: 10, effects: { poison: 2 } },
  { id: "venom-fang", name: "Venom Fang", icon: "🐍", price: 5, cooldown: 8, effects: { damage: 3, poison: 1 } },
];

const byId = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

const EFFECT_LABELS: [keyof ItemEffects, (n: number) => string][] = [
  ["damage", (n) => `⚔️ ${n} dmg`],
  ["block", (n) => `🛡️ +${n} block`],
  ["poison", (n) => `☠️ +${n} poison`],
  ["heal", (n) => `💚 +${n} heal`],
];

/** Short labels for an item's effects, e.g. `[{ effect: "damage", label: "⚔️ 2 dmg" }, …]`. */
export function describeEffects(effects: ItemEffects): { effect: keyof ItemEffects; label: string }[] {
  return EFFECT_LABELS.flatMap(([effect, label]) => (effects[effect] ? [{ effect, label: label(effects[effect]) }] : []));
}
