import { GameState } from '../engine/types';
import { upgradeV1 } from '../engine/migrate';

export const CURRENT_SAVE_VERSION = 2;

/** `migrations[n]` upgrades a version-n state to n+1. Never edit old entries. */
export const migrations: Record<number, (old: unknown) => unknown> = {
  1: (old) => upgradeV1(old as Parameters<typeof upgradeV1>[0]),
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Hand-written sanity check of the fields the game cannot run without. */
export function isValidGameState(s: unknown): s is GameState {
  if (!isObj(s) || s['version'] !== CURRENT_SAVE_VERSION) return false;
  const c = s['character'];
  const y = s['yearLoop'];
  if (typeof s['seed'] !== 'number' || typeof s['rngState'] !== 'number') return false;
  if (!isObj(c) || !isObj(y)) return false;
  if (typeof c['name'] !== 'string' || typeof c['age'] !== 'number') return false;
  if (!isObj(c['stats']) || !isObj(c['identity']) || !isObj(c['education'])) return false;
  if (!Array.isArray(c['log']) || !Array.isArray(c['relationships'])) return false;
  if (!Array.isArray(c['conditions']) || !Array.isArray(c['assets'])) return false;
  if (typeof y['phase'] !== 'string' || typeof y['actionsLeft'] !== 'number') return false;
  return Array.isArray(s['lineage']) && Array.isArray(s['achievements']);
}

export type MigrateResult = { ok: true; state: GameState } | { ok: false; error: string };

/** Run migrations sequentially from `version` up to current, then validate. Never throws. */
export function migrateState(raw: unknown, version: number): MigrateResult {
  try {
    let state = raw;
    for (let v = version; v < CURRENT_SAVE_VERSION; v++) {
      const step = migrations[v];
      if (!step) return { ok: false, error: `No migration from version ${v}` };
      state = step(state);
    }
    if (version > CURRENT_SAVE_VERSION) return { ok: false, error: 'Save is from a newer version' };
    if (!isValidGameState(state)) return { ok: false, error: 'Save data is damaged' };
    return { ok: true, state };
  } catch (e) {
    return { ok: false, error: `Migration failed: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}
