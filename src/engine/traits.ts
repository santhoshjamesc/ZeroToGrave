import { Rng } from '../utils/rng';
import { Character, FOCUS_AREAS, FocusArea, Stats, StatKey, STAT_KEYS, Trait, TraitDef } from './types';

/** Resolve a character's (or NPC's) trait list against the trait definitions. */
export function traitDefs(traits: readonly Trait[] | undefined, defs: readonly TraitDef[]): TraitDef[] {
  if (!traits) return [];
  return traits.flatMap((t) => defs.filter((d) => d.id === t.id));
}

export const toTrait = (d: TraitDef): Trait => ({ id: d.id, label: d.label, icon: d.icon, temperament: d.temperament });

export function hasTrait(c: Pick<Character, 'traits'>, id: string): boolean {
  return c.traits.some((t) => t.id === id);
}

/** All yearly nudges a character's traits add up to. Pure. */
export interface TraitMods {
  focus: Record<FocusArea, number>;
  drift: Partial<Stats>;
  healthRisk: number;
  hire: number;
  romance: number;
  /** Multiplier on an event's weight given its tags. */
  eventWeight: (tags: readonly string[] | undefined) => number;
}

export function traitMods(c: Pick<Character, 'traits'>, defs: readonly TraitDef[] | undefined): TraitMods {
  const owned = traitDefs(c.traits, defs ?? []);
  const focus = Object.fromEntries(FOCUS_AREAS.map((a) => [a, 1])) as Record<FocusArea, number>;
  const drift: Partial<Stats> = {};
  let healthRisk = 1;
  let hire = 0;
  let romance = 0;
  for (const d of owned) {
    for (const a of FOCUS_AREAS) focus[a] *= d.focus?.[a] ?? 1;
    for (const k of STAT_KEYS) if (d.drift?.[k]) drift[k] = (drift[k] ?? 0) + (d.drift[k] ?? 0);
    healthRisk *= d.healthRisk ?? 1;
    hire += d.hire ?? 0;
    romance += d.romance ?? 0;
  }
  const eventWeight = (tags: readonly string[] | undefined): number => {
    if (!tags || tags.length === 0) return 1;
    let w = 1;
    for (const d of owned) for (const t of tags) w *= d.eventBias?.[t] ?? 1;
    return Math.min(4, Math.max(0.25, w));
  };
  return { focus, drift, healthRisk, hire, romance, eventWeight };
}

/** Roll `count` distinct, non-conflicting traits, weighted by rarity. Acquired traits never roll at birth. */
export function rollTraits(rng: Rng, defs: readonly TraitDef[], count: number): TraitDef[] {
  const picked: TraitDef[] = [];
  let pool = defs.filter((d) => !d.acquired);
  while (picked.length < count && pool.length > 0) {
    const t = rng.weighted(pool, (d) => d.rarity);
    picked.push(t);
    pool = pool.filter(
      (d) => d.id !== t.id && !(t.conflicts ?? []).includes(d.id) && !(d.conflicts ?? []).includes(t.id),
    );
  }
  return picked;
}

/** Apply one-off birth shifts from traits to starting stats. */
export function applyBirthTraits(stats: Stats, picked: readonly TraitDef[]): Stats {
  const out = { ...stats };
  for (const d of picked) {
    for (const k of STAT_KEYS as readonly StatKey[]) {
      const delta = d.birth?.[k];
      if (delta) out[k] = Math.min(100, Math.max(0, out[k] + delta));
    }
  }
  return out;
}

/** How much the family has. Shapes pocket money, inheritance and which events appear. */
export type FamilyWealth = 'struggling' | 'modest' | 'comfortable' | 'wealthy';

export const FAMILY_WEALTH: Record<FamilyWealth, { label: string; icon: string; pocket: number; weight: number; inheritance: number; blurb: string }> = {
  struggling: { label: 'Struggling family', icon: '🥫', pocket: 40, weight: 22, inheritance: 0.2, blurb: 'Money is always tight. You learn the price of everything early.' },
  modest: { label: 'Modest family', icon: '🏘️', pocket: 150, weight: 40, inheritance: 0.6, blurb: 'Enough to get by, never enough to waste.' },
  comfortable: { label: 'Comfortable family', icon: '🏡', pocket: 400, weight: 28, inheritance: 1.2, blurb: 'A nice home, holidays, and a few things you take for granted.' },
  wealthy: { label: 'Wealthy family', icon: '🏰', pocket: 900, weight: 10, inheritance: 3, blurb: 'Doors open before you knock. Expectations come with the keys.' },
};

export function rollFamilyWealth(rng: Rng): FamilyWealth {
  const keys = Object.keys(FAMILY_WEALTH) as FamilyWealth[];
  return rng.weighted(keys, (k) => FAMILY_WEALTH[k].weight);
}

export const wealthFlags = (w: FamilyWealth): Record<string, boolean | string> => ({
  family_wealth: w,
  [`family_${w}`]: true,
});

export function familyWealthOf(c: Pick<Character, 'flags'>): FamilyWealth {
  const w = c.flags.family_wealth;
  return typeof w === 'string' && w in FAMILY_WEALTH ? (w as FamilyWealth) : 'modest';
}

/** Yearly pocket money for kids 6-17 (unlocks the piggy bank). */
export function pocketMoney(c: Character): number {
  if (c.age < 6 || c.age >= 18) return 0;
  return Math.round(FAMILY_WEALTH[familyWealthOf(c)].pocket * (c.age < 12 ? 0.5 : 1));
}
