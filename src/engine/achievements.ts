import { GameContent } from './content';
import { logIt } from './helpers';
import { GameState } from './types';

/** Unlock any achievements whose predicate now holds. Returns the same object if none did. */
export function checkAchievements(state: GameState, content: GameContent): GameState {
  const fresh = content.achievements.filter(
    (a) => !state.achievements.includes(a.id) && a.check(state),
  );
  if (fresh.length === 0) return state;
  let character = state.character;
  for (const a of fresh) character = logIt(character, '🏆', `Achievement unlocked: ${a.name}!`);
  return { ...state, character, achievements: [...state.achievements, ...fresh.map((a) => a.id)] };
}
