import { createRng } from '../utils/rng';
import { doActivity } from './activities';
import { checkAchievements } from './achievements';
import { applyForJob, askForRaise, quitJob, retire, seekPromotion } from './careers';
import { GameContent } from './content';
import { commitCrime } from './crime';
import { applyToStudy, dropOut } from './education';
import { resolveChoice } from './events';
import { buy, invest, repayDebt, sell } from './finance';
import { ageBlocker } from './ageGates';
import { accept, reject, ReduceResult } from './helpers';
import { checkup, treat } from './health';
import { meetPerson, relate, Interaction } from './romance';
import { GameState } from './types';

/** Everything the player can do between "Plan the year" and "Age up". */
export type LifeAction =
  | { type: 'ACTIVITY'; id: string }
  | { type: 'CRIME'; id: string }
  | { type: 'RESOLVE_PROMPT'; choiceId: string }
  | { type: 'APPLY_JOB'; careerId: string }
  | { type: 'ASK_RAISE' }
  | { type: 'SEEK_PROMOTION' }
  | { type: 'QUIT_JOB' }
  | { type: 'RETIRE' }
  | { type: 'APPLY_STUDY'; kind: 'university' | 'masters' | 'doctorate' }
  | { type: 'DROP_OUT' }
  | { type: 'MEET_PERSON'; intent: 'love' | 'friend' }
  | { type: 'RELATE'; personId: string; interaction: Interaction }
  | { type: 'BUY'; offerId: string; financed?: boolean }
  | { type: 'INVEST'; offerId: string; amount: number }
  | { type: 'SELL'; assetId: string; amount?: number }
  | { type: 'REPAY_DEBT'; amount: number }
  | { type: 'CHECKUP' }
  | { type: 'TREAT'; conditionId: string; surgery?: boolean };

export type LifeActionType = LifeAction['type'];

const LIFE_TYPES: readonly LifeActionType[] = [
  'ACTIVITY', 'CRIME', 'RESOLVE_PROMPT', 'APPLY_JOB', 'ASK_RAISE', 'SEEK_PROMOTION', 'QUIT_JOB',
  'RETIRE', 'APPLY_STUDY', 'DROP_OUT', 'MEET_PERSON', 'RELATE', 'BUY', 'INVEST', 'SELL',
  'REPAY_DEBT', 'CHECKUP', 'TREAT',
];

export const isLifeAction = (a: { type: string }): a is LifeAction =>
  (LIFE_TYPES as readonly string[]).includes(a.type);

/** Actions that spend one of the year's activity slots. Money moves are free; time is not. */
const COSTS_SLOT: ReadonlySet<LifeActionType> = new Set<LifeActionType>([
  'ACTIVITY', 'CRIME', 'APPLY_JOB', 'ASK_RAISE', 'SEEK_PROMOTION', 'APPLY_STUDY',
  'MEET_PERSON', 'RELATE', 'CHECKUP', 'TREAT',
]);

export const slotCost = (t: LifeActionType): number => (COSTS_SLOT.has(t) ? 1 : 0);

function dispatchLife(state: GameState, action: LifeAction, content: GameContent): ReduceResult {
  const rng = createRng(state.rngState);
  const finish = (r: ReduceResult): ReduceResult =>
    r.ok ? accept({ ...r.state, rngState: rng.state() }) : r;

  switch (action.type) {
    case 'RESOLVE_PROMPT': {
      const p = state.prompt;
      if (!p) return reject(state, 'Nothing to decide.');
      const choice = p.def.choices.find((c) => c.id === action.choiceId);
      if (!choice) return reject(state, 'Unknown choice');
      const character = resolveChoice(state.character, choice, rng);
      return finish(accept({ ...state, character, prompt: null }));
    }
    case 'ACTIVITY':
      return finish(doActivity(state, content, action.id, rng));
    case 'CRIME':
      return finish(commitCrime(state, content, action.id, rng));
    case 'APPLY_JOB':
      return finish(applyForJob(state, content, action.careerId, rng));
    case 'ASK_RAISE':
      return finish(askForRaise(state, rng));
    case 'SEEK_PROMOTION':
      return finish(seekPromotion(state, content, rng));
    case 'QUIT_JOB':
      return quitJob(state);
    case 'RETIRE':
      return retire(state);
    case 'APPLY_STUDY':
      return applyToStudy(state, content, action.kind);
    case 'DROP_OUT':
      return dropOut(state);
    case 'MEET_PERSON':
      return finish(meetPerson(state, content, action.intent, rng));
    case 'RELATE':
      return finish(relate(state, content, action.personId, action.interaction, rng));
    case 'BUY':
      return buy(state, content, action.offerId, action.financed ?? false);
    case 'INVEST':
      return invest(state, content, action.offerId, action.amount);
    case 'SELL':
      return sell(state, action.assetId, action.amount);
    case 'REPAY_DEBT':
      return repayDebt(state, action.amount);
    case 'CHECKUP':
      return checkup(state, content);
    case 'TREAT':
      return finish(treat(state, content, action.conditionId, action.surgery ?? false, rng));
  }
}

/** Life actions: gated by phase, open prompts and the yearly slot budget. Pure. */
export function reduceLife(state: GameState, action: LifeAction, content: GameContent): ReduceResult {
  const phase = state.yearLoop.phase;
  if (phase === 'DEAD') return reject(state, 'Character is dead');
  if (phase === 'AGING') return reject(state, 'Time is passing');
  if (state.prompt && action.type !== 'RESOLVE_PROMPT') return reject(state, 'Decide first.');
  if (!state.prompt && action.type === 'RESOLVE_PROMPT') return reject(state, 'Nothing to decide.');

  const tooYoungMsg = ageBlocker(state, action);
  if (tooYoungMsg) return reject(state, tooYoungMsg);

  const cost = slotCost(action.type);
  if (cost > state.yearLoop.actionsLeft) return reject(state, 'No time left this year. Age up to get more.');

  const r = dispatchLife(state, action, content);
  if (!r.ok) return r;
  let next = r.state;
  if (cost > 0) {
    next = { ...next, yearLoop: { ...next.yearLoop, actionsLeft: next.yearLoop.actionsLeft - cost } };
  }
  return accept(checkAchievements(next, content));
}
