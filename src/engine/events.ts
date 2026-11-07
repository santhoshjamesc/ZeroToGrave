import { Rng } from '../utils/rng';
import { Character, Effect, EventChoice, EventDef, EventNeed, PendingEvent, StatKey, TraitDef } from './types';
import { traitMods } from './traits';
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
  /** Trait definitions, used to bias which events a character sees. */
  traits?: readonly TraitDef[];
}

export const DEFAULT_COOLDOWN = 6;

const needMet: Record<EventNeed, (c: Character) => boolean> = {
  job: (c) => c.job !== null,
  noJob: (c) => c.job === null && !c.retired,
  partner: (c) => c.relationships.some((r) => r.kind === 'partner' && !r.deceased),
  single: (c) => !c.relationships.some((r) => r.kind === 'partner' && !r.deceased),
  student: (c) => c.education.enrolled !== null,
  child: (c) => c.relationships.some((r) => r.kind === 'child' && !r.deceased),
  parent: (c) => c.relationships.some((r) => r.kind === 'parent' && !r.deceased),
  degree: (c) => c.education.level >= 3,
  wealthy: (c) => c.money >= 150_000,
  broke: (c) => c.money < 500,
  inDebt: (c) => c.debt > 2000,
  sick: (c) => c.conditions.length > 0,
};

export const MAX_EVENTS_PER_YEAR = 3;

export function isEligible(def: EventDef, c: Character, ignoreCooldown = false): boolean {
  if (c.age < def.minAge || c.age > def.maxAge) return false;
  if (def.weight <= 0) return false;
  if (!(def.requiresFlags ?? []).every((f) => Boolean(c.flags[f]))) return false;
  if ((def.forbidsFlags ?? []).some((f) => Boolean(c.flags[f]))) return false;
  if (def.requiresTraits?.length && !def.requiresTraits.some((id) => c.traits.some((t) => t.id === id))) return false;
  if (!(def.needs ?? []).every((n) => needMet[n](c))) return false;
  for (const [k, v] of Object.entries(def.minStat ?? {})) if (c.stats[k as StatKey] < (v ?? 0)) return false;
  for (const [k, v] of Object.entries(def.maxStat ?? {})) if (c.stats[k as StatKey] > (v ?? 100)) return false;
  const seen = c.flags[`seen.${def.id}`];
  if (typeof seen === 'number' && !ignoreCooldown) {
    if (def.once) return false;
    if (c.age - seen < (def.cooldown ?? DEFAULT_COOLDOWN)) return false;
  }
  return true;
}

export function drawEvents(c: Character, pools: EventPools, rng: Rng): PendingEvent[] {
  const chosen: EventDef[] = [];
  const eligible = pools.events.filter((e) => isEligible(e, c));
  const count = rng.int(1, MAX_EVENTS_PER_YEAR);
  const remaining = [...eligible];
  const mods = traitMods(c, pools.traits);
  const usedTags = new Set<string>();
  while (chosen.length < count && remaining.length > 0) {
    // Personality tilts the draw; a theme already drawn this year is less likely to repeat.
    const weigh = (e: EventDef): number => {
      const repeat = (e.tags ?? []).some((t) => usedTags.has(t)) ? 0.35 : 1;
      return e.weight * mods.eventWeight(e.tags) * repeat;
    };
    const pick = rng.weighted(remaining, weigh);
    for (const t of pick.tags ?? []) usedTags.add(t);
    chosen.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  if (chosen.length === 0) {
    const fb = pools.fallback.filter((e) => isEligible(e, c, true));
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
      case 'addTrait':
        if (!next.traits.some((t) => t.id === e.trait.id)) {
          next = { ...next, traits: [...next.traits, e.trait].slice(-5) };
        }
        break;
      case 'removeTrait':
        next = { ...next, traits: next.traits.filter((t) => t.id !== e.id) };
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
