import { GameAction, GameState } from '@engine/index';

export interface TabProps {
  game: GameState;
  act: (a: GameAction) => void;
  guarded: boolean;
}
