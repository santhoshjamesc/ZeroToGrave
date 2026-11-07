/** Core engine types. Pure data, JSON-serializable (this is the save format's shape). */

export const STAT_KEYS = ['health', 'happiness', 'smarts', 'looks', 'karma', 'energy'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const FOCUS_AREAS = [
  'study',
  'work',
  'fitness',
  'social',
  'hobby',
  'rest',
  'family',
  'sideHustle',
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];
export type FocusAllocation = Record<FocusArea, number>;

export type Phase = 'BRIEFING' | 'FOCUS' | 'DECISIONS' | 'COMMIT' | 'AGING' | 'DEAD';

export type FlagValue = boolean | number | string;

/** Resting emotional "flavour". Drives idle micro-expressions and the neutral face. */
export type Temperament =
  | 'sunny'
  | 'gloomy'
  | 'anxious'
  | 'smug'
  | 'dreamy'
  | 'fierce'
  | 'gentle'
  | 'mischievous'
  | 'stoic'
  | 'playful';

export interface Trait {
  id: string;
  label: string;
  icon?: string;
  /** Copied from the trait's content definition so avatars need no content lookup. */
  temperament?: Temperament;
}

/**
 * Data definition of a personality trait (lives in `src/content/traits.ts`).
 * Everything is a small nudge: no trait is strictly good or bad.
 */
export interface TraitDef {
  id: string;
  label: string;
  icon: string;
  /** Second-person description shown on the Me screen. */
  blurb: string;
  /** One-line third-person version used for NPCs ("Always late, always forgiven."). */
  npc: string;
  /** Relative frequency when rolling at birth. */
  rarity: number;
  temperament: Temperament;
  /** Traits that cannot co-exist with this one. */
  conflicts?: readonly string[];
  /** Gained through life (events) rather than rolled at birth. */
  acquired?: boolean;
  /** One-off shift to starting stats. */
  birth?: Partial<Record<StatKey, number>>;
  /** Multiplier on effective Focus units per area (1 = normal). */
  focus?: Partial<Record<FocusArea, number>>;
  /** Stat drift applied every year. */
  drift?: Partial<Record<StatKey, number>>;
  /** Event weight multipliers by event tag. */
  eventBias?: Record<string, number>;
  /** Multiplier on yearly illness risk. */
  healthRisk?: number;
  /** Additive hiring chance. */
  hire?: number;
  /** Additive chance of a romantic spark. */
  romance?: number;
}

export type Gender = 'male' | 'female' | 'nonbinary';

export type HairStyle = 'short' | 'long' | 'curly' | 'bun' | 'buzz' | 'bald';

/** Inherent look, chosen at birth. Colors are hex strings from content palettes. */
export interface Appearance {
  skinTone: string;
  hairColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  freckles: boolean;
}

/** Who the character is. Randomised at birth; never changes. */
export interface Identity {
  gender: Gender;
  surname: string;
  countryId: string;
  country: string;
  flag: string;
  city: string;
  /** Calendar year of birth (cosmetic/era flavour). */
  birthYear: number;
  zodiac: string;
  appearance: Appearance;
}

export interface LifeLogEntry {
  age: number;
  text: string;
  /** Small icon for the timeline. */
  icon: string;
}

export interface Relationship {
  id: string;
  name: string;
  /** Age of this person right now. */
  age?: number;
  gender?: Gender;
  look?: Appearance;
  kind: 'parent' | 'sibling' | 'friend' | 'partner' | 'child' | 'coworker' | 'rival' | 'ex';
  /** 0-100 */
  closeness: number;
  /** Romance state for `partner`/`ex` kinds. */
  status?: 'dating' | 'engaged' | 'married' | 'divorced' | 'exes';
  /** True once this person has died (kept for the story and the family tree). */
  deceased?: boolean;
  /** One-line personality blurb shown on the People screen. */
  blurb?: string;
  /** Personality traits (also drive this person's face and micro-expressions). */
  traits?: Trait[];
}

export interface Job {
  careerId: string;
  title: string;
  /** Index into the career ladder. */
  level: number;
  salary: number;
  yearsInJob: number;
  /** 0-100. Drives raises, promotions and firing. */
  performance: number;
}

export type AssetKind = 'home' | 'vehicle' | 'investment' | 'business';

export interface Asset {
  id: string;
  /** Content offer this was bought from (stable key, e.g. `inv.index-fund`). */
  offerId: string;
  name: string;
  icon: string;
  kind: AssetKind;
  value: number;
  /** Total paid in so far (cost basis). */
  cost: number;
  boughtAge: number;
}

/** 0 = none, 1 = primary, 2 = secondary (high school), 3 = bachelor, 4 = master, 5 = doctorate. */
export type EducationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface Enrollment {
  kind: 'primary' | 'secondary' | 'university' | 'masters' | 'doctorate';
  yearsLeft: number;
  major?: string;
}

export interface Education {
  /** Highest level completed. */
  level: EducationLevel;
  enrolled: Enrollment | null;
  /** 0-100 current performance. */
  grades: number;
  degrees: string[];
}

export interface Condition {
  id: string;
  name: string;
  icon: string;
  kind: 'illness' | 'injury' | 'mental' | 'addiction';
  /** 1 mild, 2 moderate, 3 severe, 4 critical. */
  severity: 1 | 2 | 3 | 4;
  sinceAge: number;
  chronic: boolean;
  /** Treatment in progress / managed. Lowers penalties and death risk. */
  treated: boolean;
  /** Undiagnosed conditions are hidden from the player until a check-up or severe symptoms. */
  diagnosed: boolean;
}

export interface CrimeRecord {
  age: number;
  crime: string;
  sentenceYears: number;
}

export interface CrimeState {
  record: CrimeRecord[];
  prison: { yearsLeft: number; crime: string } | null;
  /** 0-100 police attention. Decays yearly, raises odds of getting caught. */
  heat: number;
}

export type CauseOfDeath = 'old age' | 'illness' | 'accident' | 'violence';

export interface Character {
  id: string;
  name: string;
  identity: Identity;
  age: number;
  alive: boolean;
  stats: Stats;
  traits: Trait[];
  relationships: Relationship[];
  job: Job | null;
  retired: boolean;
  education: Education;
  conditions: Condition[];
  crime: CrimeState;
  assets: Asset[];
  money: number;
  /** Money owed (student loans, mortgages, overdrafts). Accrues interest yearly. */
  debt: number;
  workXp: number;
  /** Long-term memory of past choices (drives cascades). */
  flags: Record<string, FlagValue>;
  /** Life timeline, oldest first. */
  log: LifeLogEntry[];
  causeOfDeath?: CauseOfDeath;
  /** Human-readable cause, e.g. the disease name. */
  causeDetail?: string;
}

// ---- Events (content-facing schema; richer conditions arrive with T1.5) ----

export type Effect =
  | { type: 'stat'; stat: StatKey; delta: number }
  | { type: 'money'; delta: number }
  | { type: 'flag'; key: string; value: FlagValue }
  | { type: 'addPerson'; person: Relationship }
  | { type: 'closeness'; id: string; delta: number }
  | { type: 'setStatus'; id: string; status: NonNullable<Relationship['status']>; kind?: Relationship['kind'] }
  | { type: 'addCondition'; condition: Condition }
  | { type: 'setJob'; job: Job }
  | { type: 'enroll'; enrollment: Enrollment }
  | { type: 'debt'; delta: number }
  /** New sentence, or (if already inside) adds `years` to the current one. */
  | { type: 'jail'; years: number; crime: string }
  | { type: 'release' }
  | { type: 'heat'; delta: number }
  | { type: 'log'; icon: string; text: string }
  /** Gain a personality trait (e.g. after a formative event). Ignored if already held. */
  | { type: 'addTrait'; trait: Trait }
  | { type: 'removeTrait'; id: string };

export interface EventChoice {
  id: string;
  label: string;
  /** Qualitative hint only, never exact odds. Hidden in Hardcore mode. */
  riskHint?: 'safe' | 'risky' | 'gamble';
  /** Always applied. */
  effects: Effect[];
  /** Optional coin-flip resolved by the engine's seeded RNG (never pre-rolled into the UI). */
  gamble?: { p: number; win: Effect[]; lose: Effect[]; winText: string; loseText: string };
}

/** Situational requirement for an event. */
export type EventNeed =
  | 'job'
  | 'noJob'
  | 'partner'
  | 'single'
  | 'student'
  | 'child'
  | 'degree'
  | 'parent'
  | 'wealthy'
  | 'broke'
  | 'inDebt'
  | 'sick';

export interface EventDef {
  id: string;
  title: string;
  text: string;
  minAge: number;
  maxAge: number;
  weight: number;
  mandatory: boolean;
  /** Event is only eligible if every listed flag is truthy. */
  requiresFlags?: string[];
  /** Event is blocked if any listed flag is truthy. */
  forbidsFlags?: string[];
  /** Eligible only if the character holds at least one of these traits. */
  requiresTraits?: string[];
  /** Situational requirements (all must hold). */
  needs?: EventNeed[];
  /** Theme tags (`family`, `school`, `money`, `crime`, `love`, `health`…). Traits bias by tag. */
  tags?: string[];
  /** Happens at most once per life. */
  once?: boolean;
  /** Minimum years before it can repeat (default 6). */
  cooldown?: number;
  /** Dark or heavy theme (non-graphic). */
  sensitive?: boolean;
  /** Stat gates, e.g. `{ smarts: 60 }` means smarts >= 60. */
  minStat?: Partial<Record<StatKey, number>>;
  maxStat?: Partial<Record<StatKey, number>>;
  choices: EventChoice[];
}

export interface PendingEvent {
  eventId: string;
  /** Snapshot so saves survive content changes. */
  def: EventDef;
  resolvedChoiceId: string | null;
}

export interface YearSummary {
  age: number;
  statDeltas: Partial<Stats>;
  choices: { eventId: string; choiceId: string }[];
  allocation: FocusAllocation;
  /** Money in/out for the year (after tax). */
  cashflow?: { income: number; expenses: number; net: number };
  /** Short bullet points about what changed (promotions, illness, breakups…). */
  notes?: string[];
}

export interface YearLoopState {
  phase: Phase;
  /** Years lived in this game (== character.age at start of each year). */
  year: number;
  focusBudget: number;
  /** Activity slots left this year (activities, interactions, job hunts, doctor visits). */
  actionsLeft: number;
  allocation: FocusAllocation;
  pendingEvents: PendingEvent[];
  /** Game-clock ms at which AGING began (injected by caller, never Date.now()). */
  agingStartedAt: number | null;
  history: YearSummary[];
}

export interface LineageEntry {
  name: string;
  generation: number;
  bornYear: number;
  diedAtAge: number;
  cause?: string;
}

export interface GameState {
  /** Save-format version. Bump + migrate on any shape change (see `src/store/migrations.ts`). */
  version: 2;
  seed: number;
  rngState: number;
  character: Character;
  yearLoop: YearLoopState;
  /** A popup decision created by an action (date, job offer, court case…). Blocks everything else. */
  prompt: PendingEvent | null;
  /** 1 for the first life, +1 for each heir. */
  generation: number;
  lineage: LineageEntry[];
  /** Achievement ids unlocked in this bloodline's current life. */
  achievements: string[];
}

// ---- Cross-life data (stored outside the save slots) ----

export interface GraveEntry {
  /** `${seed}:${generation}:${characterId}`, used to avoid burying the same life twice. */
  id: string;
  name: string;
  flag: string;
  generation: number;
  bornYear: number;
  diedAtAge: number;
  cause: string;
  netWorth: number;
  jobTitle: string | null;
  children: number;
  achievements: number;
  epitaph: string;
}

export interface MetaState {
  version: 1;
  /** Every achievement ever unlocked, by id → life number it happened in. */
  achievements: Record<string, number>;
  graveyard: GraveEntry[];
  livesStarted: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Pure predicate over the full game state. */
  check: (g: GameState) => boolean;
}
