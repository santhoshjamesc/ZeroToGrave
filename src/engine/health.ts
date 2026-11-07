import { Rng } from '../utils/rng';
import { DiseaseDef, GameContent } from './content';
import { traitMods } from './traits';
import { accept, clamp, fmtMoney, logIt, reject, ReduceResult } from './helpers';
import { Character, Condition, GameState } from './types';

export const CHECKUP_COST = 120;

export const diseaseFor = (content: GameContent, id: string): DiseaseDef | undefined =>
  content.diseases.find((d) => d.id === id);

export function toCondition(def: DiseaseDef, age: number, diagnosed: boolean): Condition {
  return {
    id: def.id,
    name: def.name,
    icon: def.icon,
    kind: def.kind,
    severity: def.severity,
    sinceAge: age,
    chronic: def.chronic,
    treated: false,
    diagnosed,
  };
}

/** Yearly onset risk for one disease: age window, poor health, lifestyle flags. */
export function onsetRisk(c: Character, d: DiseaseDef, riskMult = 1): number {
  if (c.age < d.minAge || c.age > d.maxAge) return 0;
  if (c.conditions.some((k) => k.id === d.id)) return 0;
  if (d.requiresFlag && !c.flags[d.requiresFlag]) return 0;
  let p = d.baseRisk * (1 + (60 - c.stats.health) / 40);
  for (const [flag, mult] of Object.entries(d.riskFlags ?? {})) {
    if (c.flags[flag]) p *= mult;
  }
  return clamp(p * riskMult, 0, 0.6);
}

/** Total health lost this year to current conditions. */
export function conditionPenalty(c: Character, content: GameContent): number {
  return c.conditions.reduce((sum, k) => {
    const d = diseaseFor(content, k.id);
    const base = d?.healthPenalty ?? k.severity * 1.5;
    return sum + base * (k.treated ? 0.4 : 1);
  }, 0);
}

/** Year-end health: new illness, progression, recovery, symptoms revealing hidden conditions. */
export function healthYear(c: Character, content: GameContent, rng: Rng, notes: string[]): Character {
  let out = c;
  const mods = traitMods(c, content.traits);
  const kept: Condition[] = [];
  for (const k of c.conditions) {
    const d = diseaseFor(content, k.id);
    let next = k;
    if (!k.chronic) {
      const cure = (d?.selfCure ?? 0.3) + (k.treated ? 0.4 : 0);
      if (rng.chance(cure)) {
        out = logIt(out, '💚', `Recovered from ${k.name.toLowerCase()}.`);
        notes.push(`Recovered: ${k.name}`);
        continue;
      }
      if (!k.treated && k.severity < 4 && rng.chance(0.2)) {
        next = { ...next, severity: (k.severity + 1) as Condition['severity'] };
        notes.push(`${k.name} got worse`);
      }
    } else if (!k.treated && k.severity < 4 && rng.chance(0.08)) {
      next = { ...next, severity: (k.severity + 1) as Condition['severity'] };
    }
    if (!next.diagnosed && (next.severity >= 3 || rng.chance(0.18))) {
      next = { ...next, diagnosed: true };
      out = logIt(out, next.icon, `Symptoms led to a diagnosis: ${next.name}.`);
      notes.push(`Diagnosed: ${next.name}`);
    }
    kept.push(next);
  }
  out = { ...out, conditions: kept };

  for (const d of content.diseases) {
    if (!rng.chance(onsetRisk(out, d, mods.healthRisk))) continue;
    const diagnosed = d.severity >= 3 || d.kind === 'injury';
    out = { ...out, conditions: [...out.conditions, toCondition(d, out.age, diagnosed)] };
    if (diagnosed) {
      out = logIt(out, d.icon, `${d.name}: ${d.description}`);
      notes.push(`Developed ${d.name}`);
    }
  }
  const penalty = conditionPenalty(out, content);
  if (penalty > 0) {
    out = { ...out, stats: { ...out.stats, health: clamp(out.stats.health - penalty, 0, 100) } };
  }
  return out;
}

export const treatmentCost = (d: DiseaseDef | undefined, k: Condition, surgery: boolean): number =>
  Math.round((d?.treatCost ?? 500 * k.severity) * (surgery ? 3 : 1));

export function checkup(state: GameState, content: GameContent): ReduceResult {
  const c = state.character;
  const cost = c.age < 18 ? 0 : CHECKUP_COST;
  if (c.money < cost) return reject(state, `A check-up costs ${fmtMoney(cost)}.`);
  const hidden = c.conditions.filter((k) => !k.diagnosed);
  const next: Character = {
    ...c,
    money: c.money - cost,
    conditions: c.conditions.map((k) => ({ ...k, diagnosed: true })),
    stats: { ...c.stats, health: clamp(c.stats.health + 1, 0, 100) },
  };
  void content;
  const text =
    hidden.length > 0
      ? `Check-up found: ${hidden.map((k) => k.name).join(', ')}.`
      : c.conditions.length > 0
        ? 'Check-up confirmed what you already knew.'
        : 'Clean bill of health.';
  return accept({ ...state, character: logIt(next, '🩺', text) });
}

export function treat(
  state: GameState,
  content: GameContent,
  conditionId: string,
  surgery: boolean,
  rng: Rng,
): ReduceResult {
  const c = state.character;
  const k = c.conditions.find((x) => x.id === conditionId);
  if (!k) return reject(state, 'No such condition');
  if (!k.diagnosed) return reject(state, 'Get a check-up first.');
  if (surgery && k.severity < 3) return reject(state, 'Surgery is only for severe cases.');
  if (!surgery && k.treated && k.chronic) return reject(state, 'Already being managed.');
  const d = diseaseFor(content, k.id);
  const cost = c.age < 18 ? 0 : treatmentCost(d, k, surgery);
  if (c.money < cost) return reject(state, `Treatment costs ${fmtMoney(cost)}.`);
  const p = clamp((d?.treatSuccess ?? 0.6) + (surgery ? 0.2 : 0) - (k.severity - 1) * 0.05, 0.15, 0.97);
  const paid: Character = { ...c, money: c.money - cost };
  if (rng.chance(p)) {
    if (k.chronic && !surgery) {
      return accept({
        ...state,
        character: logIt(
          { ...paid, conditions: paid.conditions.map((x) => (x === k ? { ...x, treated: true } : x)) },
          '💊',
          `${k.name} is now managed with treatment.`,
        ),
      });
    }
    return accept({
      ...state,
      character: logIt(
        {
          ...paid,
          conditions: paid.conditions.filter((x) => x !== k),
          stats: { ...paid.stats, health: clamp(paid.stats.health + (surgery ? 8 : 4), 0, 100) },
        },
        '💚',
        surgery ? `Surgery for ${k.name.toLowerCase()} was a success.` : `Treatment cured your ${k.name.toLowerCase()}.`,
      ),
    });
  }
  return accept({
    ...state,
    character: logIt(
      { ...paid, stats: { ...paid.stats, health: clamp(paid.stats.health - (surgery ? 8 : 2), 0, 100) } },
      '😣',
      surgery ? `Surgery for ${k.name.toLowerCase()} did not go well.` : `The treatment for ${k.name.toLowerCase()} did not take.`,
    ),
  });
}
