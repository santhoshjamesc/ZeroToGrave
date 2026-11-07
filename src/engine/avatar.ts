import { Appearance, Character, Gender, HairStyle, Relationship, Temperament, Trait } from './types';

/** Life stages drive body proportions and wardrobe in the avatar renderer. */
export type LifeStage = 'baby' | 'toddler' | 'child' | 'teen' | 'adult' | 'middle' | 'senior';

export function lifeStage(age: number): LifeStage {
  if (age < 2) return 'baby';
  if (age < 6) return 'toddler';
  if (age < 13) return 'child';
  if (age < 20) return 'teen';
  if (age < 40) return 'adult';
  if (age < 65) return 'middle';
  return 'senior';
}

export type Mood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'miserable';

export function moodFor(happiness: number): Mood {
  if (happiness >= 85) return 'ecstatic';
  if (happiness >= 60) return 'happy';
  if (happiness >= 35) return 'neutral';
  if (happiness >= 15) return 'sad';
  return 'miserable';
}

/** Per-person face geometry, derived from the id so everyone looks distinct. */
export interface FaceFeatures {
  /** Horizontal face scale 0.9-1.1. */
  faceW: number;
  jaw: 'round' | 'soft' | 'square';
  eyeSize: number;
  /** Extra px between the eyes (-2..3). */
  eyeGap: number;
  browThick: number;
  nose: 'button' | 'long' | 'wide';
  lipThick: number;
  mouthW: number;
  dimples: boolean;
  mole: { x: number; y: number } | null;
  earrings: boolean;
  headwear: 'none' | 'cap' | 'beanie' | 'headband';
  pattern: 'plain' | 'stripes' | 'dots' | 'collar';
  earSize: number;
}

/** Deterministic 0..1 number from an id and a salt. */
export function unit(id: string, salt: string): number {
  return (hash(`${id}:${salt}`) % 10000) / 10000;
}

export function faceFeatures(id: string, age: number, gender: Gender): FaceFeatures {
  const u = (s: string) => unit(id, s);
  const pickOf = <T,>(s: string, items: readonly T[]): T => items[Math.floor(u(s) * items.length)] as T;
  const young = age < 6;
  return {
    faceW: 0.92 + u('fw') * 0.18,
    jaw: pickOf('jaw', ['round', 'soft', 'square'] as const),
    eyeSize: 0.88 + u('es') * 0.26,
    eyeGap: Math.round(-2 + u('eg') * 5),
    browThick: 2.4 + u('bt') * 2.2,
    nose: pickOf('nose', ['button', 'long', 'wide'] as const),
    lipThick: 2.6 + u('lt') * 1.8,
    mouthW: 0.85 + u('mw') * 0.3,
    dimples: u('dm') < 0.22,
    mole: u('mo') < 0.18 ? { x: 70 + Math.round(u('mx') * 60), y: 100 + Math.round(u('my') * 14) } : null,
    earrings: !young && (gender === 'female' ? u('er') < 0.4 : u('er') < 0.1),
    headwear: age < 3 || age > 70 ? 'none' : u('hw') < 0.1 ? 'cap' : u('hw') < 0.17 ? 'beanie' : u('hw') < 0.22 ? 'headband' : 'none',
    pattern: pickOf('pat', ['plain', 'plain', 'stripes', 'dots', 'collar'] as const),
    earSize: 0.8 + u('ear') * 0.45,
  };
}

/** Everything the renderer needs. Pure function of the character: same input, same picture. */
export interface AvatarSpec {
  stage: LifeStage;
  /** Head radius relative to body: babies have huge heads. 0.6-1. */
  bodyScale: number;
  headScale: number;
  skinTone: string;
  hairColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  freckles: boolean;
  mood: Mood;
  /** 0 (healthy glow) to 1 (visibly unwell). */
  sickness: number;
  /** 0-3 wrinkle levels. */
  wrinkles: 0 | 1 | 2 | 3;
  /** Hair greying amount 0-1. */
  grey: number;
  glasses: boolean;
  beard: boolean;
  /** Clothing colors by stage/wealth. */
  shirt: string;
  pants: string;
  accessory: 'none' | 'backpack' | 'tie' | 'cane' | 'pacifier';
  gender: 'male' | 'female' | 'nonbinary';
  alive: boolean;
  features: FaceFeatures;
  /** Personality flavours, strongest first. Drive the resting face and micro-expressions. */
  temperaments: Temperament[];
  /** Stable id for seeding idle behaviour. */
  id: string;
}

const SHIRTS = ['#E5675F', '#4FA3D1', '#F2C14E', '#7BC47F', '#B58AE0', '#F28C4E', '#4DB6AC'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

interface SpecInput {
  id: string;
  age: number;
  gender: Gender;
  look: Appearance;
  happiness: number;
  health: number;
  money: number;
  salary: number;
  alive: boolean;
  traits?: readonly Trait[];
}

function buildSpec(c: SpecInput): AvatarSpec {
  const stage = lifeStage(c.age);
  const a = c.look;
  const h = hash(c.id);
  const grey = c.age < 35 ? 0 : Math.min(1, (c.age - 35) / 40);
  const wrinkles = c.age < 35 ? 0 : c.age < 55 ? 1 : c.age < 72 ? 2 : 3;
  const wealthy = c.money > 250_000;
  const businessy = c.salary > 60_000;
  const shirt = businessy ? '#2D3E5C' : (SHIRTS[(h + Math.floor(c.age / 5)) % SHIRTS.length] ?? '#4FA3D1');
  const accessory: AvatarSpec['accessory'] =
    stage === 'baby'
      ? 'pacifier'
      : stage === 'child' || stage === 'teen'
        ? 'backpack'
        : stage === 'senior'
          ? 'cane'
          : businessy || wealthy
            ? 'tie'
            : 'none';
  const hairStyle: HairStyle =
    stage === 'baby' ? 'buzz' : c.age > 60 && a.hairStyle === 'short' && c.gender === 'male' && h % 3 === 0 ? 'bald' : a.hairStyle;
  return {
    stage,
    bodyScale: { baby: 0.45, toddler: 0.6, child: 0.75, teen: 0.92, adult: 1, middle: 1, senior: 0.94 }[stage],
    headScale: { baby: 1.5, toddler: 1.3, child: 1.15, teen: 1.05, adult: 1, middle: 1, senior: 1 }[stage],
    skinTone: a.skinTone,
    hairColor: a.hairColor,
    hairStyle,
    eyeColor: a.eyeColor,
    freckles: a.freckles && c.age < 45,
    mood: moodFor(c.happiness),
    sickness: Math.max(0, Math.min(1, (55 - c.health) / 55)),
    wrinkles,
    grey,
    glasses: (h % 4 === 0 && c.age > 8) || c.age > 62,
    beard: c.gender === 'male' && c.age > 24 && h % 3 === 1,
    shirt,
    pants: '#34425C',
    accessory,
    gender: c.gender,
    alive: c.alive,
    features: faceFeatures(c.id, c.age, c.gender),
    temperaments: (c.traits ?? []).flatMap((t) => (t.temperament ? [t.temperament] : [])),
    id: c.id,
  };
}

export function avatarSpec(c: Character): AvatarSpec {
  return buildSpec({
    id: c.id,
    age: c.age,
    gender: c.identity.gender,
    look: c.identity.appearance,
    happiness: c.stats.happiness,
    health: c.stats.health,
    money: c.money,
    salary: c.job?.salary ?? 0,
    alive: c.alive,
    traits: c.traits,
  });
}

/** Relatives and friends get an avatar too; mood follows how close you are. */
export function personSpec(r: Relationship, fallback: Appearance): AvatarSpec {
  return buildSpec({
    id: r.id,
    age: r.age ?? 30,
    gender: r.gender ?? 'nonbinary',
    look: r.look ?? fallback,
    happiness: 30 + r.closeness * 0.7,
    health: 80 - Math.max(0, ((r.age ?? 30) - 55) * 1.2),
    money: 0,
    salary: 0,
    alive: true,
    traits: r.traits,
  });
}
