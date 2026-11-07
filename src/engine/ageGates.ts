import { lifeStage } from './avatar';
import { Character, FocusArea, GameState } from './types';
import type { LifeAction } from './actions';

/**
 * One place that decides what a person of a given age may do.
 * Content (activities, careers, crimes) carries its own `minAge`; this module covers the
 * systems that do not: focus areas, applying to work/school, money, dating, and the UI's
 * "unlocks later" teasers. The engine enforces it, the UI only mirrors it.
 */

/** Earliest age for each system. Single source of truth. */
export const AGE_GATES = {
  jobs: 14,
  fullCareers: 18,
  university: 17,
  postgrad: 21,
  dating: 14,
  friendsSearch: 13,
  money: 18,
  piggyBank: 6,
  crime: 8,
  checkups: 0,
} as const;

/** Earliest age for each yearly Focus area. */
export const FOCUS_MIN_AGE: Record<FocusArea, number> = {
  rest: 0,
  family: 0,
  hobby: 1,
  social: 2,
  fitness: 3,
  study: 5,
  work: 14,
  sideHustle: 14,
};

const NOUN: Record<ReturnType<typeof lifeStage>, string> = {
  baby: 'a baby',
  toddler: 'a toddler',
  child: 'just a kid',
  teen: 'still a teenager',
  adult: 'an adult',
  middle: 'not that young',
  senior: 'a senior',
};

/** Friendly, stage-aware refusal: "You're a baby. Try again at 17." */
export function tooYoung(age: number, minAge: number, what?: string): string {
  const noun = NOUN[lifeStage(age)];
  const years = minAge - age;
  const wait = years === 1 ? 'next year' : `in ${years} years (age ${minAge})`;
  return what
    ? `You're ${noun}: ${what} unlocks ${wait}.`
    : `You're ${noun}. This unlocks ${wait}.`;
}

export const isAgeLocked = (age: number, minAge: number): boolean => age < minAge;

export function focusAreaBlocker(c: Pick<Character, 'age' | 'crime'>, area: FocusArea): string | null {
  const min = FOCUS_MIN_AGE[area];
  if (c.age < min) return tooYoung(c.age, min, area === 'sideHustle' ? 'a side hustle' : area);
  if (c.crime.prison && (area === 'sideHustle' || area === 'work')) return 'Not from behind bars.';
  return null;
}

/** First age at which a focus area is usable, for UI hints. */
export const focusUnlockAge = (area: FocusArea): number => FOCUS_MIN_AGE[area];

/**
 * Blocks life actions that make no sense at this age, before any system sees them.
 * Returns an error message or null. Systems keep their own detailed blockers too.
 */
export function ageBlocker(state: GameState, action: LifeAction): string | null {
  const age = state.character.age;
  switch (action.type) {
    case 'APPLY_JOB':
    case 'ASK_RAISE':
    case 'SEEK_PROMOTION':
      return age < AGE_GATES.jobs ? tooYoung(age, AGE_GATES.jobs, 'working') : null;
    case 'APPLY_STUDY': {
      const min = action.kind === 'university' ? AGE_GATES.university : AGE_GATES.postgrad;
      return age < min ? tooYoung(age, min, action.kind === 'university' ? 'applying to college' : 'postgraduate study') : null;
    }
    case 'MEET_PERSON':
      return action.intent === 'love'
        ? age < AGE_GATES.dating
          ? tooYoung(age, AGE_GATES.dating, 'dating')
          : null
        : age < AGE_GATES.friendsSearch
          ? tooYoung(age, AGE_GATES.friendsSearch, 'meeting people on your own')
          : null;
    case 'BUY':
    case 'INVEST':
      return age < AGE_GATES.money ? tooYoung(age, AGE_GATES.money, 'buying and investing') : null;
    case 'CRIME':
      return age < AGE_GATES.crime ? tooYoung(age, AGE_GATES.crime, 'that') : null;
    default:
      return null;
  }
}
