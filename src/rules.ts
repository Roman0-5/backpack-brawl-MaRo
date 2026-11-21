import { BURN_DAMAGE_PER_STACK, BURN_DECAY_SHARE, HERO_BASE_HP, MAX_TICKS, POISON_DAMAGE_PER_STACK, POISON_INTERVAL, TICK_SECONDS } from "./battle";
import { GOLD_PER_ROUND, REROLL_COST, START_GOLD, START_LIVES, WINS_TO_VICTORY } from "./run";
import { CATALOG } from "./items";
import { SET_IDS, SET_THRESHOLD, SETS } from "./sets";
import { BACKPACK_COLS, BACKPACK_ROWS, SHOP_SIZE } from "./shop";
import type { ItemEffects, SetId } from "./types";

/**
 * Player-facing explanations of the rules. Built from the game constants so
 * the texts stay correct when numbers are rebalanced.
 */

const BATTLE_SECONDS = MAX_TICKS * TICK_SECONDS;
const POISON_SECONDS = POISON_INTERVAL * TICK_SECONDS;

/** Tooltip per item effect. */
export const EFFECT_HELP: Record<keyof ItemEffects, string> = {
  damage: "Damage: hits the enemy. Block absorbs it first, the rest is lost from HP.",
  block: "Block: absorbs incoming damage until used up. Unused block stays for the rest of the battle.",
  poison: `Poison: adds stacks to the enemy. Every ${POISON_SECONDS} s a poisoned fighter loses ${POISON_DAMAGE_PER_STACK} HP per stack, ignoring block. Stacks add up and last the whole battle.`,
  heal: "Heal: restores your own HP, never above max HP. A knocked-out fighter can't be healed.",
  burn: `Burn: adds stacks to the enemy. Every ${TICK_SECONDS} s a burning fighter takes ${BURN_DAMAGE_PER_STACK} damage per stack; block absorbs it first. Afterwards ${BURN_DECAY_SHARE * 100} % of the stacks (rounded up) burn out, so burn always wears off.`,
};

export const COOLDOWN_HELP = `Cooldown: the item fires every time this much battle time has passed (1 tick = ${TICK_SECONDS} s).`;

/** Tooltip per fighter status shown in battle. */
export const STATUS_HELP = {
  hp: "HP: reaching 0 is a knockout.",
  block: EFFECT_HELP.block,
  poison: `Poison stacks on this fighter: every ${POISON_SECONDS} s they cost ${POISON_DAMAGE_PER_STACK} HP each, ignoring block. They last the whole battle.`,
  burn: `Burn stacks on this fighter: every ${TICK_SECONDS} s they deal ${BURN_DAMAGE_PER_STACK} damage each, block absorbs it first; then ${BURN_DECAY_SHARE * 100} % of them (rounded up) burn out.`,
  timer: `After ${BATTLE_SECONDS} s the fighter with the higher share of HP wins; a tie counts as your loss.`,
};

/** What a set's bonus does, built from its data, e.g. "every burn item applies +1 burn". */
export function describeSetBonus(set: SetId): string {
  return Object.entries(SETS[set].bonus)
    .map(([effect, extra]) => `every ${effect} item gets +${extra} ${effect}`)
    .join(", ");
}

/** Tooltip per set badge. */
export function setHelp(set: SetId): string {
  const { icon, name } = SETS[set];
  return `${icon} ${name} set: while a backpack holds ${SET_THRESHOLD} or more different ${name} items, ${describeSetBonus(set)}. Works for opponents too.`;
}

export interface RuleSection {
  title: string;
  rules: string[];
}

export const RULES: RuleSection[] = [
  {
    title: "🏆 The run",
    rules: [
      `Reach ${WINS_TO_VICTORY} wins before you lose all ${START_LIVES} lives.`,
      `Each battle is one round: a win gives +1 win, a loss costs 1 life.`,
      `Opponents get tougher every round.`,
    ],
  },
  {
    title: "🏪 Shop & backpack",
    rules: [
      `You start with ${START_GOLD} 🪙 and earn ${GOLD_PER_ROUND} 🪙 at the start of every new round. Unspent gold carries over.`,
      `The shop offers ${SHOP_SIZE} new items every round. Reroll all offers for ${REROLL_COST} 🪙 while shopping.`,
      `Bought items go to the first free slot of your ${BACKPACK_COLS}×${BACKPACK_ROWS} backpack. Sell an item for half its price (rounded down) to free its slot.`,
      `Click an item, then another slot to move it there. On an occupied slot the two items swap. Moving is free.`,
      `Only items in your backpack fight. Their position doesn't matter.`,
    ],
  },
  {
    title: "⚔️ Battle",
    rules: [
      `Battles run on their own. Your hero has ${HERO_BASE_HP} HP; every item fires whenever its cooldown is up.`,
      `Damage hits block first; only the rest is lost from HP. Unused block stays for the rest of the battle.`,
      `Knock the enemy out to win. ${STATUS_HELP.timer} If both fall at once, you lose.`,
    ],
  },
  {
    title: "🧪 Status effects",
    rules: [
      `☠️ Poison adds stacks to the enemy. Every ${POISON_SECONDS} s a poisoned fighter loses ${POISON_DAMAGE_PER_STACK} HP per stack. Block doesn't help, and stacks keep adding up until the battle ends.`,
      `💚 Heal restores your own HP, never above your max HP. A fighter who is already knocked out can't be healed.`,
      `🔥 Burn adds stacks to the enemy too, but works differently: every ${TICK_SECONDS} s a burning fighter takes ${BURN_DAMAGE_PER_STACK} damage per stack, and block absorbs it first. Afterwards ${BURN_DECAY_SHARE * 100} % of the stacks (rounded up) burn out, so burn always wears off.`,
      `Poison or burn? Burn hits hard and fast but fades and is stopped by block; poison is slow but ignores block and never fades.`,
      `Order within a moment: items fire first, then poison and burn hurt both fighters at the same time, then knockouts are checked.`,
    ],
  },
  {
    title: "🧩 Sets",
    rules: [
      `Some items belong to a set (see the badge on the item). With ${SET_THRESHOLD} or more different items of one set in a backpack, its bonus is active. Copies of the same item count once.`,
      ...SET_IDS.map((set) => {
        const { icon, name } = SETS[set];
        const items = CATALOG.filter((item) => item.set === set).map((item) => item.name);
        return `${icon} ${name} (${items.join(", ")}): ${describeSetBonus(set)}.`;
      }),
      `Set bonuses work the same for opponents. Your backpack shows how close you are to each bonus; in battle the active bonuses of both fighters are shown.`,
    ],
  },
];
