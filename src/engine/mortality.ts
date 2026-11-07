import { Rng } from '../utils/rng';
import { CauseOfDeath, Character } from './types';

/** Gompertz curve: q = A * exp(B * age). */
const GOMPERTZ_A = 0.00006;
const GOMPERTZ_B = 0.085;

export interface DeathRisk {
  natural: number;
  accident: number;
  illness: number;
  violence: number;
  total: number;
}

/** Yearly death chance added by a condition of each severity (1-4). */
const CONDITION_LETHALITY = [0, 0.002, 0.01, 0.05, 0.18] as const;

export function conditionRisk(c: Character): number {
  return c.conditions.reduce(
    (sum, k) => sum + CONDITION_LETHALITY[k.severity] * (k.treated ? 0.3 : 1),
    0,
  );
}

/** The most dangerous current condition, used to name the cause of death. */
export function worstCondition(c: Character): Character['conditions'][number] | undefined {
  return [...c.conditions].sort((a, b) => b.severity - a.severity)[0];
}

export function deathRisk(c: Character): DeathRisk {
  const age = c.age;
  let natural = GOMPERTZ_A * Math.exp(GOMPERTZ_B * age);
  if (age === 0) natural += 0.005; // infant mortality
  const accident = age >= 15 && age <= 35 ? 0.0008 : age < 15 ? 0.0003 : 0.0004;
  const h = c.stats.health;
  const healthMult = h < 20 ? 4 : h < 40 ? 2 : h > 80 ? 0.7 : 1;
  const illness =
    (natural + 0.0005) * (healthMult - 1 > 0 ? healthMult - 1 : 0) + conditionRisk(c);
  const adjustedNatural = natural * Math.min(1, healthMult);
  const violence = c.crime.prison ? 0.004 : 0;
  const total = Math.min(0.95, adjustedNatural + accident + illness + violence);
  return { natural: adjustedNatural, accident, illness, violence, total };
}

export function rollDeath(c: Character, rng: Rng): CauseOfDeath | null {
  const risk = deathRisk(c);
  if (!rng.chance(risk.total)) return null;
  const sum = risk.natural + risk.accident + risk.illness + risk.violence;
  const roll = rng.next() * sum;
  if (roll < risk.accident) return 'accident';
  if (roll < risk.accident + risk.illness) return 'illness';
  if (roll < risk.accident + risk.illness + risk.violence) return 'violence';
  return c.age >= 70 ? 'old age' : 'illness';
}
