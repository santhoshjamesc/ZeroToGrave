import { Character, FOCUS_AREAS, FocusAllocation, FocusArea, Stats } from './types';

export const BASE_FOCUS_POINTS = 10;
export const MIN_FOCUS_POINTS = 4;
/** Each extra point in the same area is worth this much of the previous one. */
export const DIMINISHING_FACTOR = 0.8;

export const emptyAllocation = (): FocusAllocation =>
  Object.fromEntries(FOCUS_AREAS.map((a) => [a, 0])) as FocusAllocation;

export const totalAllocated = (alloc: FocusAllocation): number =>
  FOCUS_AREAS.reduce((sum, a) => sum + alloc[a], 0);

/** Yearly budget, reduced by illness, children and a full-time job. */
export function focusBudget(c: Character): number {
  let budget = BASE_FOCUS_POINTS;
  if (c.stats.health < 30) budget -= 3;
  else if (c.stats.health < 50) budget -= 1;
  const kids = c.relationships.filter((r) => r.kind === 'child' && !r.deceased && (r.age ?? 0) < 18).length;
  budget -= Math.min(3, kids);
  if (c.job) budget -= c.job.salary < 15000 ? 1 : 2;
  if (c.crime.prison) budget -= 3;
  return Math.max(MIN_FOCUS_POINTS, budget);
}

/** Effective units from `points` spent in one area: 1 + f + f^2 + ... */
export function effectiveUnits(points: number): number {
  let total = 0;
  for (let i = 0; i < points; i++) total += DIMINISHING_FACTOR ** i;
  return total;
}

export interface FocusEffect {
  stats: Partial<Stats>;
  money?: number;
  workXp?: number;
}

/** Per effective unit. */
export const FOCUS_EFFECTS: Record<FocusArea, FocusEffect> = {
  study: { stats: { smarts: 1.5, happiness: -0.2, energy: -2 } },
  work: { stats: { happiness: -0.3, energy: -3 }, workXp: 1 },
  fitness: { stats: { health: 1.2, looks: 0.6, energy: -2 } },
  social: { stats: { happiness: 1.0, energy: -1 } },
  hobby: { stats: { happiness: 0.8, smarts: 0.3, energy: -1 } },
  rest: { stats: { energy: 4, health: 0.4 } },
  family: { stats: { happiness: 0.6, karma: 0.5, energy: -1.5 } },
  sideHustle: { stats: { happiness: -0.2, energy: -3 }, money: 500, workXp: 0.3 },
};

export function focusOutcome(alloc: FocusAllocation, mult?: Partial<Record<FocusArea, number>>): {
  stats: Partial<Stats>;
  money: number;
  workXp: number;
} {
  const stats: Partial<Stats> = {};
  let money = 0;
  let workXp = 0;
  for (const area of FOCUS_AREAS) {
    const units = effectiveUnits(alloc[area]) * (mult?.[area] ?? 1);
    if (units === 0) continue;
    const eff = FOCUS_EFFECTS[area];
    for (const [k, v] of Object.entries(eff.stats) as [keyof Stats, number][]) {
      stats[k] = (stats[k] ?? 0) + v * units;
    }
    money += (eff.money ?? 0) * units;
    workXp += (eff.workXp ?? 0) * units;
  }
  return { stats, money: Math.round(money), workXp };
}
