import { createRng } from '../utils/rng';
import { educationForAge } from './education';
import { emptyAllocation, focusBudget } from './focus';
import { ACTIONS_PER_YEAR } from './migrate';
import { generatePerson, IdentityPools } from './identity';
import { Character, GameState, Identity, Relationship, Trait } from './types';

const PLACEHOLDER_IDENTITY: Identity = {
  gender: 'nonbinary',
  surname: '',
  countryId: 'xx',
  country: 'Unknown',
  flag: '🌍',
  city: 'Somewhere',
  birthYear: 2000,
  zodiac: 'Aries',
  appearance: { skinTone: '#EFC09A', hairColor: '#3B2417', hairStyle: 'short', eyeColor: '#5B3B22', freckles: false },
};

export function newCharacter(
  name: string,
  seed: number,
  traits: Trait[] = [],
  identity: Identity = PLACEHOLDER_IDENTITY,
  family: Relationship[] = [],
): Character {
  const rng = createRng(seed);
  return {
    id: `c-${seed}`,
    name,
    identity,
    age: 0,
    alive: true,
    stats: {
      health: rng.int(55, 90),
      happiness: rng.int(50, 80),
      smarts: rng.int(30, 80),
      looks: rng.int(30, 80),
      karma: 50,
      energy: 70,
    },
    traits,
    relationships: family,
    job: null,
    retired: false,
    education: educationForAge(0),
    conditions: [],
    crime: { record: [], prison: null, heat: 0 },
    assets: [],
    money: 0,
    debt: 0,
    workXp: 0,
    flags: {},
    log: [
      {
        age: 0,
        icon: '👶',
        text: `${name} was born in ${identity.city}, ${identity.country}.`,
      },
    ],
  };
}

export function newGame(
  name: string,
  seed: number,
  traits: Trait[] = [],
  identity?: Identity,
  family?: Relationship[],
): GameState {
  // Character generation consumes its own stream; the game stream is seeded separately.
  const character = newCharacter(name, seed, traits, identity, family);
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
    generation: 1,
    lineage: [],
    achievements: [],
  };
}

/** A whole random life: name, gender, country, city, look and family all from the seed. */
export function newRandomGame(seed: number, pools: IdentityPools, currentYear = 2026): GameState {
  const rng = createRng(seed ^ 0x51ed270b);
  const p = generatePerson(rng, pools, { currentYear });
  return newGame(p.name, seed, [], p.identity, p.family);
}
