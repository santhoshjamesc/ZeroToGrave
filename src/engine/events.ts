import { Rng } from '../utils/rng';
import { Character, Effect, EventChoice, EventDef, PendingEvent } from './types';
import { appendLog } from './lifeLog';
import { applyStatDeltas, clampStat } from './stats';

/**
 * Minimal event engine (T1.5 will add conditions, cooldowns, cascades).
 * Guarantees at least one mandatory decision per year via the fallback pool.
 */
export interface EventPools {
  events: readonly EventDef[];
  /** Always-eligible generic events; guarantees >= 1 decision per year. */
  fallback: readonly EventDef[];
}

export const MAX_EVENTS_PER_YEAR = 3;

export function isEligible(def: EventDef, c: Character): boolean {
  if (c.age < def.minAge || c.age > def.maxAge) return false;
  if (def.weight <= 0) return false;
  return (def.requiresFlags ?? []).every((f) => Boolean(c.flags[f]));
}

export function drawEvents(c: Character, pools: EventPools, rng: Rng): PendingEvent[] {
  const chosen: EventDef[] = [];
  const eligible = pools.events.filter((e) => isEligible(e, c));
  const count = rng.int(1, MAX_EVENTS_PER_YEAR);
  const remaining = [...eligible];
  while (chosen.length < count && remaining.length > 0) {
    const pick = rng.weighted(remaining, (e) => e.weight);
    chosen.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  if (chosen.length === 0) {
    const fb = pools.fallback.filter((e) => isEligible(e, c));
    if (fb.length === 0) throw new Error(`No fallback event eligible at age ${c.age}`);
    chosen.push(rng.weighted(fb, (e) => e.weight));
  }
  // The first drawn event is always mandatory so every year has a meaningful decision.
  return chosen.map((def, i) => ({
    eventId: def.id,
    def: i === 0 ? { ...def, mandatory: true } : def,
    resolvedChoiceId: null,
  }));
}

/** Money never silently goes negative: a shortfall becomes debt. */
function addMoney(c: Character, delta: number): Character {
  const total = c.money + delta;
  if (total >= 0) return { ...c, money: Math.round(total) };
  return { ...c, money: 0, debt: Math.round(c.debt - total) };
}

export function applyEffects(c: Character, effects: readonly Effect[]): Character {
  let next = c;
  for (const e of effects) {
    switch (e.type) {
      case 'stat':
        next = { ...next, stats: applyStatDeltas(next.stats, { [e.stat]: e.delta }) };
        break;
      case 'money':
        next = addMoney(next, e.delta);
        break;
      case 'flag':
        next = { ...next, flags: { ...next.flags, [e.key]: e.value } };
        break;
      case 'addPerson':
        if (!next.relationships.some((r) => r.id === e.person.id)) {
          next = { ...next, relationships: [...next.relationships, e.person] };
        }
        break;
      case 'closeness':
        next = {
          ...next,
          relationships: next.relationships.map((r) =>
            r.id === e.id ? { ...r, closeness: clampStat(r.closeness + e.delta) } : r,
          ),
        };
        break;
      case 'setStatus':
        next = {
          ...next,
          relationships: next.relationships.map((r) =>
            r.id === e.id ? { ...r, status: e.status, kind: e.kind ?? r.kind } : r,
          ),
        };
        break;
      case 'addCondition':
        if (!next.conditions.some((x) => x.id === e.condition.id)) {
          next = { ...next, conditions: [...next.conditions, e.condition] };
        }
        break;
      case 'setJob':
        next = { ...next, job: e.job, retired: false };
        break;
      case 'enroll':
        next = { ...next, education: { ...next.education, enrolled: e.enrollment } };
        break;
      case 'debt':
        next = { ...next, debt: Math.max(0, Math.round(next.debt + e.delta)) };
        break;
      case 'heat':
        next = { ...next, crime: { ...next.crime, heat: clampStat(next.crime.heat + e.delta) } };
        break;
      case 'release':
        next = { ...next, crime: { ...next.crime, prison: null } };
        break;
      case 'jail':
        if (next.crime.prison) {
          next = {
            ...next,
            crime: {
              ...next.crime,
              prison: {
                ...next.crime.prison,
                yearsLeft: Math.max(1, next.crime.prison.yearsLeft + e.years),
              },
            },
          };
          break;
        }
        next = {
          ...next,
          job: null,
          crime: {
            ...next.crime,
            prison: { yearsLeft: e.years, crime: e.crime },
            record: [...next.crime.record, { age: next.age, crime: e.crime, sentenceYears: e.years }],
          },
        };
        break;
      case 'log':
        next = appendLog(next, [{ age: next.age, icon: e.icon, text: e.text }]);
        break;
    }
  }
  return next;
}

/** Apply a chosen option: sure effects first, then its coin-flip (if any) via the seeded RNG. */
export function resolveChoice(c: Character, choice: EventChoice, rng: Rng): Character {
  let next = applyEffects(c, choice.effects);
  if (choice.gamble) {
    const win = rng.chance(choice.gamble.p);
    next = applyEffects(next, win ? choice.gamble.win : choice.gamble.lose);
    next = appendLog(next, [
      {
        age: next.age,
        icon: win ? '🍀' : '💥',
        text: win ? choice.gamble.winText : choice.gamble.loseText,
      },
    ]);
  }
  return next;
}

export function findChoice(def: EventDef, choiceId: string): EventChoice | undefined {
  return def.choices.find((ch) => ch.id === choiceId);
}
