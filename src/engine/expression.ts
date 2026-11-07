import { Character, Temperament } from './types';
import type { LifeStage, Mood } from './avatar';

/**
 * Facial micro-expressions. Pure data + pure functions: the Avatar renders a `Face`, this module
 * decides which `Face` to show. A micro-expression is a short flicker (150-900 ms) layered over
 * the resting face; a `Cue` is a reaction to something that just happened (a sequence of micros).
 */

export type MouthKind =
  | 'grin'
  | 'smile'
  | 'flat'
  | 'frown'
  | 'smirkL'
  | 'smirkR'
  | 'pursed'
  | 'o'
  | 'wobble'
  | 'bite'
  | 'tight';

export interface Brow {
  /** Pixels the brow sits above its resting height (negative = lowered). */
  lift: number;
  /** Inner end raised (+, worried) or lowered (-, angry). Pixels. */
  tilt: number;
}

export interface Face {
  browL: Brow;
  browR: Brow;
  /** Gaze offset in -1..1 (pupils slide within the eye). */
  gazeX: number;
  gazeY: number;
  /** Eyelid droop 0 (open) .. 1 (shut). */
  lid: number;
  /** Pupil size multiplier. */
  pupil: number;
  mouth: MouthKind;
  /** Blush strength 0..1. */
  blush: number;
  sweat: boolean;
  tear: boolean;
}

export const NEUTRAL_FACE: Face = {
  browL: { lift: 0, tilt: 0 },
  browR: { lift: 0, tilt: 0 },
  gazeX: 0,
  gazeY: 0,
  lid: 0,
  pupil: 1,
  mouth: 'flat',
  blush: 0,
  sweat: false,
  tear: false,
};

const MOUTH_BY_MOOD: Record<Mood, MouthKind> = {
  ecstatic: 'grin',
  happy: 'smile',
  neutral: 'flat',
  sad: 'frown',
  miserable: 'frown',
};

/** The resting face: mood sets the mouth, temperament colours everything else. */
export function baseFace(mood: Mood, temperament: Temperament | undefined, sickness = 0): Face {
  const face: Face = { ...NEUTRAL_FACE, browL: { ...NEUTRAL_FACE.browL }, browR: { ...NEUTRAL_FACE.browR }, mouth: MOUTH_BY_MOOD[mood] };
  if (mood === 'ecstatic') {
    face.browL = { lift: 3, tilt: -1 };
    face.browR = { lift: 3, tilt: -1 };
    face.blush = 0.35;
  } else if (mood === 'happy') {
    face.blush = 0.25;
  } else if (mood === 'sad') {
    face.browL = { lift: 0, tilt: 3 };
    face.browR = { lift: 0, tilt: 3 };
  } else if (mood === 'miserable') {
    face.browL = { lift: -1, tilt: 5 };
    face.browR = { lift: -1, tilt: 5 };
    face.lid = 0.2;
    face.tear = true;
  }
  const calm = mood === 'neutral' || mood === 'happy';
  switch (temperament) {
    case 'smug':
      if (calm) {
        face.mouth = 'smirkR';
        face.lid = 0.22;
        face.browL = { lift: 2, tilt: 0 };
      }
      break;
    case 'gloomy':
      face.lid = Math.max(face.lid, 0.18);
      if (mood === 'neutral') face.browL = face.browR = { lift: 0, tilt: 2 };
      break;
    case 'anxious':
      face.browL = { lift: 2, tilt: 3 };
      face.browR = { lift: 2, tilt: 3 };
      if (mood === 'neutral') face.mouth = 'tight';
      break;
    case 'fierce':
      face.browL = { lift: -1, tilt: -3 };
      face.browR = { lift: -1, tilt: -3 };
      break;
    case 'dreamy':
      face.gazeX = -0.35;
      face.gazeY = -0.35;
      face.lid = Math.max(face.lid, 0.12);
      break;
    case 'gentle':
      if (mood === 'neutral') face.mouth = 'smile';
      face.browL = { lift: 1, tilt: 2 };
      face.browR = { lift: 1, tilt: 2 };
      break;
    case 'mischievous':
      if (calm) face.mouth = 'smirkL';
      face.browR = { lift: 3, tilt: -1 };
      break;
    case 'sunny':
      if (mood === 'neutral') face.mouth = 'smile';
      face.blush = Math.max(face.blush, 0.3);
      break;
    case 'playful':
      if (mood === 'neutral') face.mouth = 'smile';
      face.browL = { lift: 2, tilt: 0 };
      face.browR = { lift: 1, tilt: 0 };
      break;
    case 'stoic':
    default:
      break;
  }
  if (sickness > 0.6) {
    face.lid = Math.max(face.lid, 0.3);
    face.sweat = true;
    if (face.mouth === 'grin' || face.mouth === 'smile') face.mouth = 'flat';
  }
  return face;
}

// ---------------------------------------------------------------- micro-expressions

export type MicroId =
  | 'browFlash'
  | 'browRaiseL'
  | 'browRaiseR'
  | 'furrow'
  | 'worry'
  | 'dartL'
  | 'dartR'
  | 'glanceDown'
  | 'glanceUp'
  | 'eyeRoll'
  | 'squint'
  | 'wideEyes'
  | 'smirk'
  | 'grinFlash'
  | 'purse'
  | 'bite'
  | 'tightLip'
  | 'blush'
  | 'sweat'
  | 'tearUp'
  | 'sigh'
  | 'wince'
  | 'lipWobble';

export interface MicroDef {
  /** How long the flicker lasts, ms. */
  ms: number;
  /** Overrides applied on top of the resting face. */
  face: Partial<Face>;
}

export const MICROS: Record<MicroId, MicroDef> = {
  browFlash: { ms: 320, face: { browL: { lift: 7, tilt: 0 }, browR: { lift: 7, tilt: 0 } } },
  browRaiseL: { ms: 650, face: { browL: { lift: 8, tilt: -1 } } },
  browRaiseR: { ms: 650, face: { browR: { lift: 8, tilt: -1 } } },
  furrow: { ms: 600, face: { browL: { lift: -2, tilt: -5 }, browR: { lift: -2, tilt: -5 }, lid: 0.15 } },
  worry: { ms: 700, face: { browL: { lift: 3, tilt: 6 }, browR: { lift: 3, tilt: 6 } } },
  dartL: { ms: 420, face: { gazeX: -1, gazeY: 0 } },
  dartR: { ms: 420, face: { gazeX: 1, gazeY: 0 } },
  glanceDown: { ms: 650, face: { gazeY: 1, lid: 0.3 } },
  glanceUp: { ms: 700, face: { gazeY: -1, gazeX: -0.3 } },
  eyeRoll: { ms: 800, face: { gazeY: -1, gazeX: 0.8, lid: 0.25, browL: { lift: 2, tilt: 0 }, browR: { lift: 2, tilt: 0 } } },
  squint: { ms: 550, face: { lid: 0.5, browL: { lift: -2, tilt: -3 }, browR: { lift: -2, tilt: -3 } } },
  wideEyes: { ms: 500, face: { pupil: 0.8, lid: -0.2, browL: { lift: 6, tilt: 1 }, browR: { lift: 6, tilt: 1 }, mouth: 'o' } },
  smirk: { ms: 900, face: { mouth: 'smirkR', browL: { lift: 3, tilt: 0 }, lid: 0.15 } },
  grinFlash: { ms: 520, face: { mouth: 'grin', blush: 0.5, browL: { lift: 3, tilt: -1 }, browR: { lift: 3, tilt: -1 } } },
  purse: { ms: 650, face: { mouth: 'pursed' } },
  bite: { ms: 750, face: { mouth: 'bite', browL: { lift: 2, tilt: 3 }, browR: { lift: 2, tilt: 3 }, gazeY: 0.6 } },
  tightLip: { ms: 800, face: { mouth: 'tight', browL: { lift: 0, tilt: 3 }, browR: { lift: 0, tilt: 3 } } },
  blush: { ms: 1100, face: { blush: 1, gazeY: 0.8, gazeX: -0.5 } },
  sweat: { ms: 1300, face: { sweat: true, browL: { lift: 2, tilt: 4 }, browR: { lift: 2, tilt: 4 }, mouth: 'tight' } },
  tearUp: { ms: 1500, face: { tear: true, mouth: 'wobble', browL: { lift: 0, tilt: 6 }, browR: { lift: 0, tilt: 6 }, lid: 0.12 } },
  sigh: { ms: 900, face: { mouth: 'o', gazeY: 0.7, lid: 0.45 } },
  wince: { ms: 520, face: { lid: 0.7, mouth: 'tight', browL: { lift: -1, tilt: 5 }, browR: { lift: -1, tilt: 5 } } },
  lipWobble: { ms: 700, face: { mouth: 'wobble', browL: { lift: 1, tilt: 5 }, browR: { lift: 1, tilt: 5 } } },
};

/** Layer a micro-expression over a resting face. */
export function applyMicro(base: Face, id: MicroId): Face {
  return { ...base, ...MICROS[id].face };
}

type Weighted<T> = { id: T; w: number }[];

const TEMPERAMENT_MICROS: Record<Temperament, Weighted<MicroId>> = {
  sunny: [{ id: 'grinFlash', w: 4 }, { id: 'browFlash', w: 3 }, { id: 'blush', w: 1 }, { id: 'dartL', w: 1 }],
  gloomy: [{ id: 'sigh', w: 4 }, { id: 'glanceDown', w: 4 }, { id: 'eyeRoll', w: 2 }, { id: 'tightLip', w: 2 }],
  anxious: [{ id: 'dartL', w: 4 }, { id: 'dartR', w: 4 }, { id: 'worry', w: 3 }, { id: 'bite', w: 3 }, { id: 'sweat', w: 1.5 }],
  smug: [{ id: 'smirk', w: 5 }, { id: 'browRaiseL', w: 3 }, { id: 'eyeRoll', w: 2 }, { id: 'squint', w: 1 }],
  dreamy: [{ id: 'glanceUp', w: 5 }, { id: 'sigh', w: 2 }, { id: 'blush', w: 1.5 }, { id: 'dartR', w: 1 }],
  fierce: [{ id: 'furrow', w: 4 }, { id: 'squint', w: 3 }, { id: 'tightLip', w: 2 }, { id: 'browRaiseR', w: 1 }],
  gentle: [{ id: 'blush', w: 3 }, { id: 'worry', w: 2 }, { id: 'glanceDown', w: 3 }, { id: 'grinFlash', w: 2 }],
  mischievous: [{ id: 'smirk', w: 4 }, { id: 'browRaiseR', w: 4 }, { id: 'dartR', w: 2 }, { id: 'purse', w: 2 }, { id: 'grinFlash', w: 2 }],
  stoic: [{ id: 'squint', w: 2 }, { id: 'browFlash', w: 1 }, { id: 'tightLip', w: 2 }, { id: 'glanceDown', w: 1 }],
  playful: [{ id: 'browFlash', w: 3 }, { id: 'grinFlash', w: 3 }, { id: 'dartL', w: 2 }, { id: 'purse', w: 2 }, { id: 'wideEyes', w: 1 }],
};

const MOOD_MICROS: Partial<Record<Mood, Weighted<MicroId>>> = {
  ecstatic: [{ id: 'grinFlash', w: 3 }, { id: 'blush', w: 2 }],
  sad: [{ id: 'glanceDown', w: 3 }, { id: 'sigh', w: 3 }, { id: 'lipWobble', w: 1 }],
  miserable: [{ id: 'tearUp', w: 3 }, { id: 'lipWobble', w: 3 }, { id: 'sigh', w: 2 }],
};

/** What flickers across this face while idle. Blends temperaments, mood and life stage. */
export function microPool(
  temperaments: readonly (Temperament | undefined)[],
  mood: Mood,
  stage: LifeStage,
): Weighted<MicroId> {
  const pool = new Map<MicroId, number>();
  const add = (list: Weighted<MicroId> | undefined, k = 1) => {
    for (const { id, w } of list ?? []) pool.set(id, (pool.get(id) ?? 0) + w * k);
  };
  const known = temperaments.filter((t): t is Temperament => t !== undefined);
  if (known.length === 0) add([{ id: 'browFlash', w: 2 }, { id: 'dartL', w: 2 }, { id: 'glanceDown', w: 2 }, { id: 'purse', w: 1 }]);
  known.forEach((t, i) => add(TEMPERAMENT_MICROS[t], i === 0 ? 1 : 0.6));
  add(MOOD_MICROS[mood], 1.2);
  if (stage === 'baby' || stage === 'toddler') {
    add([{ id: 'wideEyes', w: 5 }, { id: 'grinFlash', w: 4 }, { id: 'lipWobble', w: 1 }, { id: 'purse', w: 3 }], 1.4);
  } else if (stage === 'teen') {
    add([{ id: 'eyeRoll', w: 3 }, { id: 'blush', w: 2 }], 1);
  } else if (stage === 'senior') {
    add([{ id: 'squint', w: 2 }, { id: 'sigh', w: 2 }, { id: 'browRaiseL', w: 1 }], 1);
  }
  return [...pool.entries()].map(([id, w]) => ({ id, w }));
}

/** Pick from a weighted pool with a unit random number (0..1). Deterministic given `u`. */
export function pickMicro(pool: Weighted<MicroId>, u: number): MicroId | null {
  const total = pool.reduce((s, p) => s + p.w, 0);
  if (total <= 0) return null;
  let roll = u * total;
  for (const p of pool) {
    if (roll < p.w) return p.id;
    roll -= p.w;
  }
  return pool[pool.length - 1]?.id ?? null;
}

// ---------------------------------------------------------------- reactions

export type Cue =
  | 'delight'
  | 'pride'
  | 'relief'
  | 'love'
  | 'embarrassed'
  | 'nervous'
  | 'wince'
  | 'shock'
  | 'sad'
  | 'grief'
  | 'confused'
  | 'smug';

export interface CueStep {
  micro: MicroId;
  /** Gap before the next step, ms (the micro's own duration applies first). */
  gap: number;
}

const CUES: Record<Cue, CueStep[]> = {
  delight: [{ micro: 'wideEyes', gap: 60 }, { micro: 'grinFlash', gap: 0 }],
  pride: [{ micro: 'browRaiseL', gap: 80 }, { micro: 'smirk', gap: 0 }],
  relief: [{ micro: 'sigh', gap: 100 }, { micro: 'grinFlash', gap: 0 }],
  love: [{ micro: 'blush', gap: 120 }, { micro: 'bite', gap: 60 }, { micro: 'grinFlash', gap: 0 }],
  embarrassed: [{ micro: 'glanceDown', gap: 40 }, { micro: 'blush', gap: 0 }],
  nervous: [{ micro: 'dartL', gap: 60 }, { micro: 'dartR', gap: 60 }, { micro: 'sweat', gap: 0 }],
  wince: [{ micro: 'wince', gap: 80 }, { micro: 'tightLip', gap: 0 }],
  shock: [{ micro: 'browFlash', gap: 30 }, { micro: 'wideEyes', gap: 200 }, { micro: 'worry', gap: 0 }],
  sad: [{ micro: 'glanceDown', gap: 100 }, { micro: 'sigh', gap: 100 }, { micro: 'lipWobble', gap: 0 }],
  grief: [{ micro: 'worry', gap: 80 }, { micro: 'tearUp', gap: 0 }],
  confused: [{ micro: 'browRaiseL', gap: 100 }, { micro: 'squint', gap: 80 }, { micro: 'dartR', gap: 0 }],
  smug: [{ micro: 'smirk', gap: 120 }, { micro: 'browRaiseR', gap: 0 }],
};

/**
 * How this temperament plays a reaction. A stoic barely reacts; a smug person turns delight into a
 * smirk; an anxious one adds a nervous dart. Same event, different faces.
 */
export function cueSequence(cue: Cue, temperament?: Temperament): CueStep[] {
  const base = CUES[cue];
  switch (temperament) {
    case 'stoic':
      return base.slice(0, 1).map((s) => ({ ...s, micro: cue === 'delight' || cue === 'pride' ? 'browFlash' : s.micro }));
    case 'smug':
      return cue === 'delight' ? CUES.smug : base;
    case 'anxious':
      return cue === 'delight' || cue === 'relief' ? [...base, { micro: 'dartL', gap: 0 }] : base;
    case 'sunny':
    case 'playful':
      return cue === 'sad' || cue === 'wince' ? base.slice(0, 2) : base;
    case 'gloomy':
      return cue === 'delight' ? [{ micro: 'browFlash', gap: 100 }, { micro: 'purse', gap: 0 }] : base;
    default:
      return base;
  }
}

/** Decide how the character *feels* about what just changed. Pure, so it is testable. */
export function cueFromChange(before: Character, after: Character): Cue | null {
  if (!after.alive && before.alive) return 'grief';
  const dh = after.stats.happiness - before.stats.happiness;
  const dHealth = after.stats.health - before.stats.health;
  const dMoney = after.money - before.money;
  const logs = after.log.slice(before.log.length);
  const icons = logs.map((l) => l.icon).join('');
  const newPeople = after.relationships.length - before.relationships.length;
  if (/[🕯️🪦]/u.test(icons)) return 'grief';
  if (/[💘💍👰🥰💞]/u.test(icons)) return 'love';
  if (/[🚨⛓️🚔]/u.test(icons) || after.crime.heat - before.crime.heat >= 8) return 'nervous';
  if (/[💥]/u.test(icons)) return 'shock';
  if (/[🏆🎓]/u.test(icons)) return 'pride';
  if (/[💔🙅📨📉]/u.test(icons)) return dh <= -3 ? 'sad' : 'wince';
  if (dHealth <= -4) return 'wince';
  if (dh >= 6 || dMoney >= 2000) return 'delight';
  if (dh >= 3 || newPeople > 0) return 'pride';
  if (dh <= -6) return 'sad';
  if (dh <= -3 || dMoney <= -1500) return 'wince';
  if (dHealth >= 3) return 'relief';
  return null;
}
