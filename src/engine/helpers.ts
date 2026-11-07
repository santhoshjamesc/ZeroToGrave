import { createRng, Rng } from '../utils/rng';
import { appendLog } from './lifeLog';
import { Character, EventChoice, GameState, PendingEvent } from './types';

export type ReduceResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string; state: GameState };

export const reject = (state: GameState, error: string): ReduceResult => ({ ok: false, error, state });
export const accept = (state: GameState): ReduceResult => ({ ok: true, state });

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Run `fn` with the game's RNG stream and store the advanced stream back in the state. */
export function withRng(
  state: GameState,
  fn: (rng: Rng) => ReduceResult,
): ReduceResult {
  const rng = createRng(state.rngState);
  const out = fn(rng);
  if (!out.ok) return out;
  return { ok: true, state: { ...out.state, rngState: rng.state() } };
}

export const logIt = (c: Character, icon: string, text: string): Character =>
  appendLog(c, [{ age: c.age, icon, text }]);

let promptCounter = 0;
/** A popup decision. Ids get a counter suffix so each prompt instance is unique. */
export function makePrompt(
  id: string,
  title: string,
  text: string,
  choices: EventChoice[],
): PendingEvent {
  promptCounter += 1;
  return {
    eventId: `${id}#${promptCounter}`,
    resolvedChoiceId: null,
    def: { id, title, text, minAge: 0, maxAge: 130, weight: 1, mandatory: true, choices },
  };
}

export const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;

/** Approx. standard normal from the seeded stream (sum of 6 uniforms). */
export function gaussian(rng: Rng): number {
  let t = 0;
  for (let i = 0; i < 6; i++) t += rng.next();
  return (t - 3) * Math.SQRT2;
}

export const livingPeople = (c: Character) => c.relationships.filter((r) => !r.deceased);
