import { STAT_KEYS, Stats, StatKey } from './types';

export const clampStat = (v: number): number => Math.min(100, Math.max(0, v));
const round1 = (v: number): number => Math.round(v * 10) / 10;

export function applyStatDeltas(stats: Stats, deltas: Partial<Stats>): Stats {
  const out = { ...stats };
  for (const k of STAT_KEYS) out[k] = round1(clampStat(stats[k] + (deltas[k] ?? 0)));
  return out;
}

/** Natural yearly drift caused purely by getting older. */
export function agingDrift(age: number): Partial<Stats> {
  const health = age < 30 ? 0 : age < 50 ? -0.5 : age < 70 ? -1.5 : -3;
  const looks = age < 25 ? 0.3 : age < 40 ? 0 : age < 60 ? -0.4 : -0.8;
  const smarts = age < 22 ? 0.5 : age < 65 ? 0 : -0.5;
  return { health, looks, smarts };
}

/** Energy recovers halfway toward its baseline each new year before focus is spent. */
export const ENERGY_BASELINE = 70;
export function energyRecovery(energy: number): number {
  return (ENERGY_BASELINE - energy) * 0.5;
}

export function diffStats(before: Stats, after: Stats): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const d = round1(after[k] - before[k]);
    if (d !== 0) out[k as StatKey] = d;
  }
  return out;
}
