import { emptyMeta, mergeMeta } from '../engine/meta';
import { GameState, MetaState } from '../engine/types';
import { getKV } from './kv';

const KEY = 'ztg:meta';

export function loadMeta(): MetaState {
  try {
    const raw = getKV().getString(KEY);
    if (!raw) return emptyMeta();
    const m = JSON.parse(raw) as MetaState;
    if (m?.version !== 1 || !Array.isArray(m.graveyard) || typeof m.achievements !== 'object') {
      return emptyMeta();
    }
    return m;
  } catch {
    return emptyMeta();
  }
}

export function saveMeta(m: MetaState): void {
  try {
    getKV().set(KEY, JSON.stringify(m));
  } catch {
    /* storage unavailable: progress simply is not persisted */
  }
}

/** Fold a state into the meta (achievements, graveyard). Only writes when something changed. */
export function recordProgress(g: GameState): MetaState {
  const before = loadMeta();
  const after = mergeMeta(before, g);
  if (after !== before) saveMeta(after);
  return after;
}

export function beginLife(): MetaState {
  const m = loadMeta();
  const next = { ...m, livesStarted: m.livesStarted + 1 };
  saveMeta(next);
  return next;
}

export function resetMeta(): void {
  getKV().remove(KEY);
}
