import { createRng } from '../utils/rng';
import { educationForAge } from './education';
import { focusBudget, emptyAllocation } from './focus';
import { ACTIONS_PER_YEAR } from './migrate';
import { Character, GameState, Identity, Relationship, Stats } from './types';

export const ESTATE_TAX = 0.3;

/** Living children of the deceased who could carry the family forward. */
export function heirCandidates(g: GameState): Relationship[] {
  if (g.yearLoop.phase !== 'DEAD') return [];
  return g.character.relationships.filter((r) => r.kind === 'child' && !r.deceased);
}

/** Estate the heir would receive: cash after debts and tax, plus every asset. */
export function estateFor(c: Character): { cash: number; assets: number } {
  const cash = Math.max(0, Math.round((c.money - c.debt) * (1 - ESTATE_TAX)));
  return { cash, assets: c.assets.reduce((s, a) => s + a.value, 0) };
}

/**
 * Continue the bloodline as one of the dead character's children. Pure and deterministic:
 * the heir's new stats come from the parent's seed and generation.
 */
export function startHeir(g: GameState, childId: string): GameState | null {
  const parent = g.character;
  const kid = heirCandidates(g).find((r) => r.id === childId);
  if (!kid) return null;
  const generation = g.generation + 1;
  const seed = ((g.seed * 31 + generation * 977) >>> 0) % 2147483646 || 1;
  const rng = createRng(seed);
  const age = kid.age ?? 0;
  const surname = kid.name.split(' ').slice(1).join(' ') || parent.identity.surname;
  const parentLastAge = Math.max(0, parent.age - 1);
  const identity: Identity = {
    ...parent.identity,
    gender: kid.gender ?? 'nonbinary',
    surname,
    appearance: kid.look ?? parent.identity.appearance,
    birthYear: parent.identity.birthYear + Math.max(0, parentLastAge - age),
    zodiac: parent.identity.zodiac,
  };
  const inherit = (v: number): number => Math.round(Math.min(95, Math.max(15, v * 0.4 + rng.int(30, 75) * 0.6)));
  const stats: Stats = {
    health: rng.int(55, 90),
    happiness: 50,
    smarts: inherit(parent.stats.smarts),
    looks: inherit(parent.stats.looks),
    karma: 50,
    energy: 70,
  };
  const { cash } = estateFor(parent);
  const survivingPartner = parent.relationships.find((r) => r.kind === 'partner' && !r.deceased);
  const relationships: Relationship[] = [];
  if (survivingPartner) {
    relationships.push({ ...survivingPartner, kind: 'parent', status: undefined, closeness: 70 });
  }
  for (const r of parent.relationships) {
    if (r.kind === 'child' && !r.deceased && r.id !== kid.id) {
      relationships.push({ ...r, kind: 'sibling', closeness: Math.max(35, r.closeness - 20) });
    }
  }
  const character: Character = {
    id: `c-${seed}`,
    name: kid.name,
    identity,
    age,
    alive: true,
    stats,
    traits: [],
    relationships,
    job: null,
    retired: false,
    education: educationForAge(age),
    conditions: [],
    crime: { record: [], prison: null, heat: 0 },
    assets: parent.assets,
    money: cash,
    debt: 0,
    workXp: 0,
    flags: {},
    log: [
      { age, icon: '🧬', text: `${kid.name} carries on the ${surname} family as generation ${generation}.` },
      { age, icon: '💰', text: `Inherited $${cash.toLocaleString('en-US')} and ${parent.assets.length} asset${parent.assets.length === 1 ? '' : 's'}.` },
    ],
  };
  return {
    version: 2,
    seed,
    rngState: createRng(seed ^ 0x9e3779b9).state(),
    character,
    yearLoop: {
      phase: 'BRIEFING',
      year: 0,
      focusBudget: focusBudget(character),
      actionsLeft: ACTIONS_PER_YEAR,
      allocation: emptyAllocation(),
      pendingEvents: [],
      agingStartedAt: null,
      history: [],
    },
    prompt: null,
    generation,
    lineage: [
      ...g.lineage,
      {
        name: parent.name,
        generation: g.generation,
        bornYear: parent.identity.birthYear,
        diedAtAge: parentLastAge,
        cause: parent.causeDetail ?? parent.causeOfDeath,
      },
    ],
    achievements: g.achievements,
  };
}
