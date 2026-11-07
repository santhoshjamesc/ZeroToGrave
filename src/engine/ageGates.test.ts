import { gameContent } from '../content';
import { newRandomGame } from './newGame';
import { reduceGame } from './game';
import { baseFace, cueFromChange, cueSequence, microPool, pickMicro } from './expression';
import { focusAreaBlocker, tooYoung } from './ageGates';
import { rollTraits, traitMods } from './traits';
import { createRng } from '../utils/rng';
import type { GameState } from './types';

const baby = (): GameState => {
  const g = newRandomGame(42, gameContent.identity);
  return { ...g, yearLoop: { ...g.yearLoop, phase: 'FOCUS' as const } };
};
const aged = (g: GameState, age: number): GameState => ({ ...g, character: { ...g.character, age } });

describe('age gates', () => {
  it('a baby cannot apply to college, work, date, shop or commit crimes', () => {
    const g = baby();
    for (const action of [
      { type: 'APPLY_STUDY', kind: 'university' },
      { type: 'APPLY_JOB', careerId: gameContent.careers[0]!.id },
      { type: 'MEET_PERSON', intent: 'love' },
      { type: 'BUY', offerId: gameContent.offers[0]!.id },
      { type: 'CRIME', id: gameContent.crimes[0]!.id },
    ] as const) {
      const r = reduceGame(g, action, gameContent);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/baby|toddler|kid|unlocks/i);
    }
  });

  it('college opens at 17 and focus areas unlock by age', () => {
    expect(tooYoung(0, 17, 'applying to college')).toContain('baby');
    expect(focusAreaBlocker({ age: 0, crime: { record: [], prison: null, heat: 0 } }, 'work')).not.toBeNull();
    expect(focusAreaBlocker({ age: 6, crime: { record: [], prison: null, heat: 0 } }, 'study')).toBeNull();
    const r = reduceGame(baby(), { type: 'SET_FOCUS', area: 'work', points: 1 }, gameContent);
    expect(r.ok).toBe(false);
    const ok = reduceGame(aged(baby(), 15), { type: 'SET_FOCUS', area: 'work', points: 1 }, gameContent);
    expect(ok.ok).toBe(true);
  });
});

describe('personality', () => {
  it('rolls distinct, non-conflicting traits', () => {
    for (let s = 1; s < 200; s++) {
      const picked = rollTraits(createRng(s), gameContent.traits, 3);
      expect(new Set(picked.map((p) => p.id)).size).toBe(picked.length);
      for (const a of picked) for (const b of picked) expect(a.conflicts ?? []).not.toContain(b.id);
    }
  });

  it('trait content is consistent', () => {
    const ids = new Set(gameContent.traits.map((t) => t.id));
    expect(ids.size).toBe(gameContent.traits.length);
    for (const t of gameContent.traits) for (const c of t.conflicts ?? []) expect(ids.has(c)).toBe(true);
    expect(gameContent.traits.filter((t) => !t.acquired).length).toBeGreaterThanOrEqual(30);
  });

  it('new lives differ: different seeds give different personalities', () => {
    const sets = new Set<string>();
    for (let s = 1; s <= 30; s++) {
      sets.add(newRandomGame(s, gameContent.identity).character.traits.map((t) => t.id).sort().join(','));
    }
    expect(sets.size).toBeGreaterThan(20);
  });

  it('traits modify focus and event weights', () => {
    const g = newRandomGame(7, gameContent.identity);
    const lazy = { ...g.character, traits: [{ id: 'lazy', label: 'Lazy' }] };
    expect(traitMods(lazy, gameContent.traits).focus.work).toBeLessThan(1);
    const wander = { ...g.character, traits: [{ id: 'wanderer', label: 'Wanderer' }] };
    expect(traitMods(wander, gameContent.traits).eventWeight(['travel'])).toBeGreaterThan(1);
  });
});

describe('micro expressions', () => {
  it('temperament changes the resting face and the idle flickers', () => {
    expect(baseFace('neutral', 'smug').mouth).toBe('smirkR');
    expect(baseFace('neutral', 'anxious').mouth).toBe('tight');
    expect(baseFace('sad', 'sunny').mouth).toBe('frown');
    const anxious = microPool(['anxious'], 'neutral', 'adult').map((p) => p.id);
    expect(anxious).toContain('dartL');
    expect(microPool([], 'neutral', 'toddler').map((p) => p.id)).toContain('wideEyes');
    expect(pickMicro([{ id: 'sigh', w: 1 }], 0.5)).toBe('sigh');
  });

  it('same cue plays differently by temperament; good news triggers delight', () => {
    expect(cueSequence('delight', 'smug')[0]?.micro).toBe('smirk');
    expect(cueSequence('delight', 'stoic')).toHaveLength(1);
    const g = newRandomGame(3, gameContent.identity).character;
    const happier = { ...g, stats: { ...g.stats, happiness: g.stats.happiness + 8 } };
    expect(cueFromChange(g, happier)).toBe('delight');
    expect(cueFromChange(g, g)).toBeNull();
  });
});
