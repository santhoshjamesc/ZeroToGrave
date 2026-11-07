import { createRng } from '../utils/rng';
import { educationForAge } from './education';
import { focusBudget } from './focus';
import { GameState } from './types';

export const ACTIONS_PER_YEAR = 4;

/** Loose shape of a v1 save. Only what the upgrade reads. */
interface V1State {
  version: 1;
  seed: number;
  rngState: number;
  character: Record<string, unknown> & { age: number; job: { careerId: string; level: number; salary: number } | null };
  yearLoop: Record<string, unknown>;
}

/** v1 → v2: adds education, conditions, crime, debt, prompt, lineage, achievements, action slots. */
export function upgradeV1(old: V1State): GameState {
  const c = old.character;
  const character = {
    ...c,
    job: c.job
      ? { ...c.job, title: 'Employee', yearsInJob: 0, performance: 50 }
      : null,
    retired: false,
    education: educationForAge(c.age),
    conditions: [],
    crime: { record: [], prison: null, heat: 0 },
    debt: 0,
  } as unknown as GameState['character'];
  const rng = createRng(old.seed);
  void rng;
  return {
    version: 2,
    seed: old.seed,
    rngState: old.rngState,
    character,
    yearLoop: {
      ...(old.yearLoop as unknown as GameState['yearLoop']),
      actionsLeft: ACTIONS_PER_YEAR,
      focusBudget: focusBudget(character),
    },
    prompt: null,
    generation: 1,
    lineage: [],
    achievements: [],
  };
}
