import { eventPools } from '../../content';
import { newGame } from '../newGame';
import { GameState } from '../types';
import { MIN_AGING_MS, reduceYear, YearAction } from './reducer';

const SEED = 1234;

function step(s: GameState, a: YearAction): GameState {
  const r = reduceYear(s, a, eventPools);
  if (!r.ok) throw new Error(`seed ${SEED}: ${a.type} rejected: ${r.error}`);
  return r.state;
}

function playYear(s: GameState, clock: { t: number }): GameState {
  s = step(s, { type: 'ACK_BRIEFING' });
  s = step(s, { type: 'SET_FOCUS', area: 'family', points: 3 });
  s = step(s, { type: 'BANK_REMAINING_AS_REST' });
  s = step(s, { type: 'CONFIRM_FOCUS' });
  for (const e of s.yearLoop.pendingEvents) {
    s = step(s, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: e.def.choices[0]!.id });
  }
  s = step(s, { type: 'PROCEED_TO_COMMIT' });
  s = step(s, { type: 'CONFIRM_AGE_UP', now: clock.t });
  clock.t += MIN_AGING_MS;
  return step(s, { type: 'FINISH_AGING', now: clock.t });
}

const toDecisions = (): GameState => {
  let s = newGame('Test', SEED);
  s = step(s, { type: 'ACK_BRIEFING' });
  s = step(s, { type: 'BANK_REMAINING_AS_REST' });
  return step(s, { type: 'CONFIRM_FOCUS' });
};

describe('Year Loop gates (anti-rush)', () => {
  it('rejects every action out of order from BRIEFING (no phase skipping)', () => {
    const s = newGame('Test', SEED);
    const bad: YearAction[] = [
      { type: 'CONFIRM_FOCUS' },
      { type: 'PROCEED_TO_COMMIT' },
      { type: 'CONFIRM_AGE_UP', now: 0 },
      { type: 'FINISH_AGING', now: 99999 },
      { type: 'SET_FOCUS', area: 'family', points: 1 },
    ];
    for (const a of bad) {
      const r = reduceYear(s, a, eventPools);
      expect(r.ok).toBe(false);
      expect(r.state).toBe(s);
    }
  });

  it('blocks FOCUS -> DECISIONS with unspent focus points', () => {
    let s = step(newGame('Test', SEED), { type: 'ACK_BRIEFING' });
    s = step(s, { type: 'SET_FOCUS', area: 'family', points: 2 });
    const r = reduceYear(s, { type: 'CONFIRM_FOCUS' }, eventPools);
    expect(r.ok).toBe(false);
    expect(r.state.yearLoop.phase).toBe('FOCUS');
  });

  it('rejects over-budget allocation and invalid points', () => {
    const s = step(newGame('Test', SEED), { type: 'ACK_BRIEFING' });
    expect(reduceYear(s, { type: 'SET_FOCUS', area: 'family', points: 99 }, eventPools).ok).toBe(false);
    expect(reduceYear(s, { type: 'SET_FOCUS', area: 'family', points: -1 }, eventPools).ok).toBe(false);
    expect(reduceYear(s, { type: 'SET_FOCUS', area: 'family', points: 1.5 }, eventPools).ok).toBe(false);
  });

  it('blocks DECISIONS -> COMMIT while a mandatory event is unresolved', () => {
    const s = toDecisions();
    expect(s.yearLoop.pendingEvents.some((e) => e.def.mandatory)).toBe(true);
    const r = reduceYear(s, { type: 'PROCEED_TO_COMMIT' }, eventPools);
    expect(r.ok).toBe(false);
  });

  it('rejects re-resolving an event and unknown choices', () => {
    let s = toDecisions();
    const e = s.yearLoop.pendingEvents[0]!;
    expect(reduceYear(s, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: 'nope' }, eventPools).ok).toBe(false);
    s = step(s, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: e.def.choices[0]!.id });
    expect(reduceYear(s, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: e.def.choices[1]!.id }, eventPools).ok).toBe(false);
  });

  it('every year presents at least one mandatory decision', () => {
    for (let seed = 1; seed <= 25; seed++) {
      let s = newGame('T', seed);
      s = step(s, { type: 'ACK_BRIEFING' });
      s = step(s, { type: 'BANK_REMAINING_AS_REST' });
      s = step(s, { type: 'CONFIRM_FOCUS' });
      expect(s.yearLoop.pendingEvents.filter((e) => e.def.mandatory).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('AGING cannot finish before the minimum duration, and AGE_UP is only valid in COMMIT', () => {
    let s = toDecisions();
    for (const e of s.yearLoop.pendingEvents) {
      s = step(s, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: e.def.choices[0]!.id });
    }
    expect(reduceYear(s, { type: 'CONFIRM_AGE_UP', now: 0 }, eventPools).ok).toBe(false); // still DECISIONS
    s = step(s, { type: 'PROCEED_TO_COMMIT' });
    s = step(s, { type: 'CONFIRM_AGE_UP', now: 1000 });
    expect(reduceYear(s, { type: 'FINISH_AGING', now: 1000 + MIN_AGING_MS - 1 }, eventPools).ok).toBe(false);
    expect(reduceYear(s, { type: 'CONFIRM_AGE_UP', now: 5000 }, eventPools).ok).toBe(false); // no restart
    const done = step(s, { type: 'FINISH_AGING', now: 1000 + MIN_AGING_MS });
    expect(done.character.age).toBe(1);
    expect(done.yearLoop.phase).toBe('BRIEFING');
  });
});

describe('Year Loop flow', () => {
  it('is deterministic for a seed', () => {
    const run = (): GameState => {
      let s = newGame('T', 99);
      const clock = { t: 0 };
      for (let i = 0; i < 5; i++) s = playYear(s, clock);
      return s;
    };
    expect(run()).toEqual(run());
  });

  it('survives a JSON save/load round-trip mid-life', () => {
    const clock = { t: 0 };
    let s = newGame('T', 7);
    for (let i = 0; i < 3; i++) s = playYear(s, clock);
    const loaded = JSON.parse(JSON.stringify(s)) as GameState;
    expect(playYear(loaded, { t: clock.t })).toEqual(playYear(s, { t: clock.t }));
  });

  it('plays a full life to death, and a dead character rejects all actions', () => {
    let s = newGame('T', 31);
    const clock = { t: 0 };
    let guard = 0;
    while (s.yearLoop.phase !== 'DEAD' && guard++ < 150) {
      s = playYear(s, clock);
    }
    expect(s.yearLoop.phase).toBe('DEAD');
    expect(s.character.alive).toBe(false);
    expect(s.character.causeOfDeath).toBeDefined();
    expect(s.yearLoop.history.length).toBe(s.character.age);
    expect(reduceYear(s, { type: 'ACK_BRIEFING' }, eventPools).ok).toBe(false);
  });

  it('keeps stats within 0..100', () => {
    let s = newGame('T', 5);
    const clock = { t: 0 };
    for (let i = 0; i < 40 && s.yearLoop.phase !== 'DEAD'; i++) s = playYear(s, clock);
    for (const v of Object.values(s.character.stats)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
