import { newGame } from '../engine/newGame';
import { GameState } from '../engine/types';
import { createMemoryKV, KV, setKV } from './kv';
import { loadMeta, recordProgress, beginLife } from './meta';
import { CURRENT_SAVE_VERSION, migrateState } from './migrations';
import {
  deleteSlot,
  firstEmptySlot,
  latestSlot,
  listSlots,
  loadSlot,
  saveSlot,
  SLOT_COUNT,
} from './saves';
import { getSettings, resetSettingsCache, updateSettings } from './settings';

let kv: KV;
beforeEach(() => {
  kv = createMemoryKV();
  setKV(kv);
  resetSettingsCache();
});
afterAll(() => setKV(null));

/** A hand-built version-1 save (the shape before education/crime/prompt existed). */
function v1Fixture(): unknown {
  const g = newGame('Old Timer', 77);
  const { retired: _r, education: _e, conditions: _c, crime: _cr, debt: _d, ...rest } = g.character;
  void [_r, _e, _c, _cr, _d];
  const { actionsLeft: _a, ...loop } = g.yearLoop;
  void _a;
  return {
    version: 1,
    seed: g.seed,
    rngState: g.rngState,
    character: { ...rest, age: 30, job: { careerId: 'x', level: 1, salary: 40000 } },
    yearLoop: loop,
  };
}

describe('saves', () => {
  it('round-trips a game exactly', () => {
    const g = newGame('Ada Test', 5);
    expect(saveSlot(0, g, 1000)).toBe(true);
    const r = loadSlot(0);
    expect(r.ok && r.state).toEqual(g);
  });

  it('swaps the tmp key away after a successful write', () => {
    saveSlot(1, newGame('A', 1));
    expect(kv.keys().some((k) => k.endsWith(':tmp'))).toBe(false);
  });

  it('recovers from a crash that left only a tmp copy', () => {
    const g = newGame('Crash', 9);
    saveSlot(2, g);
    kv.set('ztg:slot:2:tmp', kv.getString('ztg:slot:2') as string);
    kv.remove('ztg:slot:2');
    const r = loadSlot(2);
    expect(r.ok).toBe(true);
  });

  it('keeps a backup and reports a recoverable error for corrupt saves', () => {
    kv.set('ztg:slot:0', '{not json');
    const r = loadSlot(0);
    expect(r.ok).toBe(false);
    expect(kv.getString('ztg:backup:0')).toBe('{not json');
    expect(listSlots()[0]?.damaged).toBe(true);
  });

  it('rejects structurally invalid state without throwing', () => {
    kv.set(
      'ztg:slot:0',
      JSON.stringify({ version: CURRENT_SAVE_VERSION, state: { version: 2 }, savedAt: 1 }),
    );
    expect(loadSlot(0).ok).toBe(false);
    expect(kv.getString('ztg:backup:0')).toBeDefined();
  });

  it('lists slots, finds latest and first empty, deletes', () => {
    expect(listSlots()).toHaveLength(SLOT_COUNT);
    expect(latestSlot()).toBeNull();
    saveSlot(0, newGame('First', 1), 100);
    saveSlot(2, newGame('Second', 2), 300);
    expect(latestSlot()?.name).toBe('Second');
    expect(firstEmptySlot()).toBe(1);
    deleteSlot(2);
    expect(latestSlot()?.name).toBe('First');
  });
});

describe('migrations', () => {
  it('loads a v1 save and upgrades it to v2', () => {
    const r = migrateState(v1Fixture(), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.version).toBe(2);
    expect(r.state.character.job?.title).toBe('Employee');
    expect(r.state.character.crime.prison).toBeNull();
    expect(r.state.yearLoop.actionsLeft).toBeGreaterThan(0);
    expect(r.state.prompt).toBeNull();
  });

  it('a v1 save written to a slot loads through loadSlot', () => {
    kv.set(
      'ztg:slot:0',
      JSON.stringify({ version: 1, slotId: 0, savedAt: 5, seed: 77, state: v1Fixture() }),
    );
    expect(loadSlot(0).ok).toBe(true);
  });

  it('refuses saves from the future', () => {
    expect(migrateState({}, 99).ok).toBe(false);
  });
});

describe('meta', () => {
  it('records achievements and buries a dead life exactly once', () => {
    beginLife();
    const g: GameState = newGame('Dead Dan', 3);
    const dead: GameState = {
      ...g,
      achievements: ['first-breath'],
      character: { ...g.character, alive: false, age: 41, causeOfDeath: 'illness' },
      yearLoop: { ...g.yearLoop, phase: 'DEAD' },
    };
    recordProgress(dead);
    recordProgress(dead);
    const m = loadMeta();
    expect(m.graveyard).toHaveLength(1);
    expect(m.graveyard[0]?.diedAtAge).toBe(40);
    expect(m.achievements['first-breath']).toBe(1);
    expect(m.livesStarted).toBe(1);
  });
});

describe('settings', () => {
  it('defaults, persists and survives a cache reset', () => {
    expect(getSettings().sound).toBe(true);
    updateSettings({ hardcore: true, music: false });
    resetSettingsCache();
    expect(getSettings()).toEqual({ sound: true, music: false, haptics: true, hardcore: true });
  });
});
