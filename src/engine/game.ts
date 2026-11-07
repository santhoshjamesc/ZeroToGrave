import { isLifeAction, LifeAction, reduceLife } from './actions';
import { GameContent } from './content';
import { reject, ReduceResult } from './helpers';
import { reduceYear, YearAction } from './yearLoop/reducer';
import { GameState } from './types';

export type GameAction = YearAction | LifeAction;

/**
 * The one entry point the UI dispatches to. Year Loop phases and life actions share one
 * state; an open prompt blocks everything except answering it.
 */
export function reduceGame(state: GameState, action: GameAction, content: GameContent): ReduceResult {
  if (isLifeAction(action)) return reduceLife(state, action, content);
  if (state.prompt) return reject(state, 'Decide first.');
  return reduceYear(state, action, content);
}
