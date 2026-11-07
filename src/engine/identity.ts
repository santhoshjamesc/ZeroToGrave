import { Rng } from '../utils/rng';
import { Appearance, Gender, HairStyle, Identity, Relationship, Trait, TraitDef } from './types';
import { rollTraits, toTrait } from './traits';

/** Pools are injected (engine never imports content). Mirrors `@content/identityPools`. */
export interface CountryPool {
  id: string;
  name: string;
  flag: string;
  cities: readonly string[];
  male: readonly string[];
  female: readonly string[];
  nonbinary: readonly string[];
  surnames: readonly string[];
  weight: number;
}

export interface IdentityPools {
  countries: readonly CountryPool[];
  skinTones: readonly string[];
  hairColors: readonly string[];
  eyeColors: readonly string[];
  hairStylesByGender: Record<Gender, readonly HairStyle[]>;
  zodiacs: readonly string[];
  /** Optional personality blurbs for generated NPCs. */
  blurbs?: readonly string[];
  /** Personality pool for NPCs and the player. */
  traits?: readonly TraitDef[];
}

const GENDERS: readonly Gender[] = ['male', 'female', 'nonbinary'];

function firstNameFor(c: CountryPool, g: Gender, rng: Rng): string {
  return rng.pick(c[g]);
}

function rollAppearance(g: Gender, pools: IdentityPools, rng: Rng, skinTone?: string): Appearance {
  return {
    skinTone: skinTone ?? rng.pick(pools.skinTones),
    hairColor: rng.pick(pools.hairColors),
    hairStyle: rng.pick(pools.hairStylesByGender[g]),
    eyeColor: rng.pick(pools.eyeColors),
    freckles: rng.chance(0.15),
  };
}

export interface GeneratedPerson {
  name: string;
  identity: Identity;
  /** Starting family: parents (+ maybe siblings) sharing the surname/skin family. */
  family: Relationship[];
}

/** Fully random person: gender, country, city, name, look, birth year, family. */
export function generatePerson(
  rng: Rng,
  pools: IdentityPools,
  opts: { currentYear: number; gender?: Gender; countryId?: string } = { currentYear: 2026 },
): GeneratedPerson {
  const gender = opts.gender ?? rng.pick(GENDERS);
  const country =
    pools.countries.find((c) => c.id === opts.countryId) ??
    rng.weighted(pools.countries, (c) => c.weight);
  const surname = rng.pick(country.surnames);
  const appearance = rollAppearance(gender, pools, rng);
  const city = rng.pick(country.cities);
  const identity: Identity = {
    gender,
    surname,
    countryId: country.id,
    country: country.name,
    flag: country.flag,
    city,
    birthYear: opts.currentYear,
    zodiac: rng.pick(pools.zodiacs),
    appearance,
  };
  const name = `${firstNameFor(country, gender, rng)} ${surname}`;

  // Family shares a skin-tone neighbourhood: child inherits from a parent.
  const parentTones = [appearance.skinTone, rng.pick(pools.skinTones)];
  const mum: Relationship = {
    id: 'rel-mother',
    kind: 'parent',
    name: `${firstNameFor(country, 'female', rng)} ${surname}`,
    age: rng.int(21, 40),
    gender: 'female',
    look: rollAppearance('female', pools, rng, parentTones[0]),
    closeness: rng.int(55, 95),
    ...rollPersonality(rng, pools),
  };
  const dad: Relationship = {
    id: 'rel-father',
    kind: 'parent',
    name: `${firstNameFor(country, 'male', rng)} ${surname}`,
    age: rng.int(22, 44),
    gender: 'male',
    look: rollAppearance('male', pools, rng, parentTones[1]),
    closeness: rng.int(40, 90),
    ...rollPersonality(rng, pools),
  };
  const family = [mum, dad];
  const sibCount = rng.weighted([0, 1, 2, 3], (n) => [4, 5, 3, 1][n] ?? 0);
  for (let i = 0; i < sibCount; i++) {
    const g = rng.pick(GENDERS);
    family.push({
      id: `rel-sib-${i}`,
      kind: 'sibling',
      name: `${firstNameFor(country, g, rng)} ${surname}`,
      age: rng.int(1, 12),
      gender: g,
      look: rollAppearance(g, pools, rng, rng.pick(parentTones)),
      closeness: rng.int(35, 80),
      ...rollPersonality(rng, pools),
    });
  }
  return { name, identity, family };
}

const DEFAULT_BLURBS = [
  'Quick with a joke, slow with a text back.',
  'Reads three books a week and never shuts up about them.',
  'Always has a plan. The plan changes hourly.',
  'Wears the same jacket every day. Somehow it works.',
  'Ambitious, a little anxious, deeply loyal.',
  'Collects vinyl and unsolicited opinions.',
  'Cooks like a chef, parks like a menace.',
  'Calm in a crisis, chaotic in a group chat.',
  'Runs marathons for fun. Yes, really.',
  'Gentle, stubborn, and weirdly good at trivia.',
  'Sings in the shower, and not only there.',
  'Believes every problem can be solved with a road trip.',
];

export interface GeneratedNpc {
  name: string;
  gender: Gender;
  look: Appearance;
  blurb: string;
  traits: Trait[];
}

/** Two traits, and a blurb built from them so no two NPCs read alike. */
function rollPersonality(rng: Rng, pools: IdentityPools): { traits: Trait[]; blurb: string } {
  const defs = pools.traits ?? [];
  if (defs.length < 2) return { traits: [], blurb: rng.pick(pools.blurbs ?? DEFAULT_BLURBS) };
  const picked = rollTraits(rng, defs, 2);
  const blurb = picked.map((d) => d.npc).join(' ');
  return { traits: picked.map(toTrait), blurb };
}

/** A random side character (date, friend, coworker) in the given country. */
export function generateNpc(
  rng: Rng,
  pools: IdentityPools,
  opts: { countryId?: string; gender?: Gender; surname?: string; skinTone?: string },
): GeneratedNpc {
  const gender = opts.gender ?? rng.pick(GENDERS);
  const country =
    pools.countries.find((c) => c.id === opts.countryId) ??
    rng.weighted(pools.countries, (c) => c.weight);
  const surname = opts.surname ?? rng.pick(country.surnames);
  const personality = rollPersonality(rng, pools);
  return {
    name: `${firstNameFor(country, gender, rng)} ${surname}`,
    gender,
    look: rollAppearance(gender, pools, rng, opts.skinTone),
    blurb: personality.blurb,
    traits: personality.traits,
  };
}

export { GENDERS };
