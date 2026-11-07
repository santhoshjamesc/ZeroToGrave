/**
 * Seeded, serializable RNG (mulberry32). The full state is a single uint32 so it can be
 * stored in GameState and an identical stream resumed after save/load.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Weighted pick; items with weight <= 0 are never chosen. Throws if nothing is pickable. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T;
  /** Current internal state, for persistence. */
  state(): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    chance: (p) => next() < p,
    pick: (items) => {
      if (items.length === 0) throw new Error('rng.pick: empty list');
      return items[int(0, items.length - 1)] as (typeof items)[number];
    },
    weighted: (items, weightOf) => {
      const total = items.reduce((sum, it) => sum + Math.max(0, weightOf(it)), 0);
      if (total <= 0) throw new Error('rng.weighted: no item with positive weight');
      let roll = next() * total;
      for (const it of items) {
        const w = Math.max(0, weightOf(it));
        if (w === 0) continue;
        if (roll < w) return it;
        roll -= w;
      }
      return items[items.length - 1] as (typeof items)[number];
    },
    state: () => s,
  };
}
