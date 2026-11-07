import { GameState } from '../engine/types';
import { getKV } from './kv';
import { CURRENT_SAVE_VERSION, migrateState } from './migrations';

export const SLOT_COUNT = 3;

export interface SaveFile {
  version: number;
  slotId: number;
  savedAt: number;
  seed: number;
  state: GameState;
}

export interface SlotInfo {
  slotId: number;
  empty: boolean;
  /** Set when the slot holds data that could not be read. */
  damaged: boolean;
  name: string;
  age: number;
  flag: string;
  generation: number;
  alive: boolean;
  savedAt: number;
  jobTitle: string | null;
}

export type LoadResult = { ok: true; state: GameState } | { ok: false; error: string };

const slotKey = (id: number): string => `ztg:slot:${id}`;
const tmpKey = (id: number): string => `ztg:slot:${id}:tmp`;
const backupKey = (id: number): string => `ztg:backup:${id}`;

const emptyInfo = (slotId: number): SlotInfo => ({
  slotId,
  empty: true,
  damaged: false,
  name: '',
  age: 0,
  flag: '',
  generation: 1,
  alive: true,
  savedAt: 0,
  jobTitle: null,
});

function parseFile(raw: string | undefined): SaveFile | null {
  if (!raw) return null;
  try {
    const f = JSON.parse(raw) as SaveFile;
    return typeof f === 'object' && f !== null && typeof f.version === 'number' ? f : null;
  } catch {
    return null;
  }
}

/** Crash-safe write: tmp key → verify it parses → swap onto the real key. Returns success. */
export function saveSlot(id: number, state: GameState, now: number = Date.now()): boolean {
  const kv = getKV();
  try {
    const file: SaveFile = {
      version: CURRENT_SAVE_VERSION,
      slotId: id,
      savedAt: now,
      seed: state.seed,
      state,
    };
    const json = JSON.stringify(file);
    kv.set(tmpKey(id), json);
    if (!parseFile(kv.getString(tmpKey(id)))) return false;
    kv.set(slotKey(id), json);
    kv.remove(tmpKey(id));
    return true;
  } catch {
    return false;
  }
}

export function loadSlot(id: number): LoadResult {
  const kv = getKV();
  const raw = kv.getString(slotKey(id));
  if (raw === undefined) {
    // A crash between tmp write and swap leaves a good tmp copy: recover it.
    const tmp = kv.getString(tmpKey(id));
    if (!tmp) return { ok: false, error: 'This slot is empty' };
    return loadRaw(id, tmp);
  }
  return loadRaw(id, raw);
}

function loadRaw(id: number, raw: string): LoadResult {
  const file = parseFile(raw);
  if (!file) {
    getKV().set(backupKey(id), raw);
    return { ok: false, error: 'Save file is damaged (a backup was kept)' };
  }
  const r = migrateState(file.state, file.version);
  if (!r.ok) {
    getKV().set(backupKey(id), raw);
    return { ok: false, error: r.error };
  }
  return { ok: true, state: r.state };
}

export function deleteSlot(id: number): void {
  const kv = getKV();
  kv.remove(slotKey(id));
  kv.remove(tmpKey(id));
}

export function listSlots(): SlotInfo[] {
  const kv = getKV();
  return Array.from({ length: SLOT_COUNT }, (_, slotId) => {
    const raw = kv.getString(slotKey(slotId));
    if (raw === undefined) return emptyInfo(slotId);
    const file = parseFile(raw);
    const s = file?.state as Partial<GameState> | undefined;
    const c = s?.character;
    if (!file || !c || typeof c.name !== 'string') {
      return { ...emptyInfo(slotId), empty: false, damaged: true, name: 'Damaged save' };
    }
    return {
      slotId,
      empty: false,
      damaged: false,
      name: c.name,
      age: Math.max(0, c.alive === false ? c.age - 1 : c.age),
      flag: c.identity?.flag ?? '',
      generation: s.generation ?? 1,
      alive: c.alive !== false,
      savedAt: file.savedAt,
      jobTitle: (c.job as { title?: string } | null)?.title ?? null,
    };
  });
}

export function latestSlot(): SlotInfo | null {
  const used = listSlots().filter((s) => !s.empty && !s.damaged);
  if (used.length === 0) return null;
  return used.reduce((a, b) => (b.savedAt > a.savedAt ? b : a));
}

export function firstEmptySlot(): number | null {
  return listSlots().find((s) => s.empty)?.slotId ?? null;
}
