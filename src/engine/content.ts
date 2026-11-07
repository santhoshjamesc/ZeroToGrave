import type { EventPools } from './events';
import type { IdentityPools } from './identity';
import type {
  AchievementDef,
  AssetKind,
  Condition,
  EducationLevel,
  Effect,
  StatKey,
  TraitDef,
} from './types';

/**
 * Content registries. The engine never imports `@content`; callers inject a `GameContent`.
 * Everything here is plain data (except achievement predicates) so it can be validated.
 */

export interface CareerDef {
  id: string;
  name: string;
  icon: string;
  /** Sector label for the job board. */
  sector: string;
  blurb: string;
  minAge: number;
  minEdu: EducationLevel;
  /** Required degree major id (see MajorDef). */
  major?: string;
  minSmarts?: number;
  minLooks?: number;
  /** Teen-friendly job: does not reduce the focus budget as much. */
  partTime?: boolean;
  /** Criminals are rejected from these. */
  cleanRecord?: boolean;
  /** Entry → top. Salaries are gross per year. */
  ladder: { title: string; salary: number }[];
}

export interface MajorDef {
  id: string;
  name: string;
  icon: string;
  minSmarts: number;
  yearlyCost: number;
}

export interface DiseaseDef {
  id: string;
  name: string;
  icon: string;
  kind: Condition['kind'];
  description: string;
  minAge: number;
  maxAge: number;
  /** Yearly chance at health 60, before modifiers. */
  baseRisk: number;
  chronic: boolean;
  severity: Condition['severity'];
  /** Health lost per year while untreated (halved-ish when treated). */
  healthPenalty: number;
  treatCost: number;
  /** Chance a treatment attempt cures (acute) or stabilises (chronic). */
  treatSuccess: number;
  /** Chance per year an untreated acute case resolves on its own. */
  selfCure?: number;
  /** Extra risk multiplier when these flags are set (e.g. smoking). */
  riskFlags?: Record<string, number>;
  /** Only possible while this lifestyle flag is set (addictions). */
  requiresFlag?: string;
}

export interface Outcome {
  weight: number;
  text: string;
  /** Skill-sensitive: weight is scaled by the activity's `skill` stat. */
  good?: boolean;
  effects: Effect[];
}

export type ActivityCategory = 'mind' | 'body' | 'social' | 'money' | 'fun' | 'crime' | 'prison';

export interface ActivityDef {
  id: string;
  category: ActivityCategory;
  label: string;
  icon: string;
  blurb: string;
  minAge: number;
  maxAge: number;
  cost: number;
  energyCost: number;
  /** Where this can be done. Default 'free' (not in prison). */
  where?: 'free' | 'prison';
  /** Extra requirements. */
  needs?: ('job' | 'noJob' | 'partner' | 'degree')[];
  /** Stat that tilts outcomes toward the `good` ones. */
  skill?: StatKey;
  outcomes: Outcome[];
}

export interface CrimeDef {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  minAge: number;
  /** 0-1 base chance of being caught. */
  catchRisk: number;
  reward: [number, number];
  sentence: [number, number];
  karma: number;
  heat: number;
  winText: string;
  loseText: string;
}

export interface AssetOffer {
  id: string;
  kind: AssetKind;
  name: string;
  icon: string;
  blurb: string;
  price: number;
  minAge: number;
  /** Mean / std-dev of the yearly return (or appreciation) as a fraction. */
  mean: number;
  sd: number;
  /** Yearly running cost as a fraction of value (maintenance, fees). */
  upkeep: number;
  /** Can be bought on credit (20% down, rest becomes debt). */
  financeable?: boolean;
  /** Investments can be topped up in any amount; others are one-off purchases. */
  divisible?: boolean;
  /** Happiness per year from owning it. */
  joy?: number;
  /** Fixed yearly income (rent, dividends) as a fraction of value. */
  yield?: number;
}

export interface GameContent extends EventPools {
  careers: readonly CareerDef[];
  majors: readonly MajorDef[];
  diseases: readonly DiseaseDef[];
  activities: readonly ActivityDef[];
  crimes: readonly CrimeDef[];
  offers: readonly AssetOffer[];
  achievements: readonly AchievementDef[];
  identity: IdentityPools;
  traits: readonly TraitDef[];
}
