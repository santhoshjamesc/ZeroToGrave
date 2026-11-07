import { Rng } from '../utils/rng';
import { ActivityDef, GameContent, Outcome } from './content';
import { applyEffects } from './events';
import { tooYoung } from './ageGates';
import { accept, clamp, fmtMoney, logIt, reject, ReduceResult } from './helpers';
import { Character, GameState } from './types';

export function activityBlocker(c: Character, a: ActivityDef): string | null {
  const inPrison = c.crime.prison !== null;
  if ((a.where ?? 'free') === 'prison' && !inPrison) return 'Only available in prison.';
  if ((a.where ?? 'free') === 'free' && inPrison) return 'Not from behind bars.';
  if (c.age < a.minAge) return tooYoung(c.age, a.minAge, a.label.toLowerCase());
  if (c.age > a.maxAge) return 'Too old for this.';
  if (a.cost > 0 && c.money < a.cost) return `Costs ${fmtMoney(a.cost)}.`;
  if (c.stats.energy < a.energyCost) return 'Too tired.';
  for (const need of a.needs ?? []) {
    if (need === 'job' && !c.job) return 'Needs a job.';
    if (need === 'noJob' && c.job) return 'Only without a job.';
    if (need === 'partner' && !c.relationships.some((r) => r.kind === 'partner' && !r.deceased)) return 'Needs a partner.';
    if (need === 'degree' && c.education.level < 3) return 'Needs a degree.';
  }
  return null;
}

/** Good outcomes get likelier with the activity's skill stat, bad ones less so. */
function pickOutcome(a: ActivityDef, c: Character, rng: Rng): Outcome {
  const skill = a.skill ? c.stats[a.skill] / 100 : 0.5;
  return rng.weighted(a.outcomes, (o) => o.weight * (o.good === undefined ? 1 : o.good ? 0.5 + skill : 1.5 - skill));
}

export function doActivity(state: GameState, content: GameContent, id: string, rng: Rng): ReduceResult {
  const c = state.character;
  const a = content.activities.find((x) => x.id === id);
  if (!a) return reject(state, 'Unknown activity');
  const blocker = activityBlocker(c, a);
  if (blocker) return reject(state, blocker);
  const outcome = pickOutcome(a, c, rng);
  let next: Character = {
    ...c,
    money: c.money - a.cost,
    stats: { ...c.stats, energy: clamp(c.stats.energy - a.energyCost, 0, 100) },
  };
  next = applyEffects(next, outcome.effects);
  next = logIt(next, a.icon, outcome.text);
  return accept({ ...state, character: next });
}
