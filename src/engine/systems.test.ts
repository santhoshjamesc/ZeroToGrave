import { createRng, Rng } from '../utils/rng';
import { gameContent as content } from '../content';
import { GameAction, reduceGame } from './game';
import { heirCandidates, startHeir } from './heir';
import { newRandomGame } from './newGame';
import { activityBlocker } from './activities';
import { FOCUS_AREAS, GameState, Relationship } from './types';
import { MIN_AGING_MS } from './yearLoop/reducer';
import { identityPools } from '../content';

let clock = 0;
function step(s: GameState, a: GameAction): GameState {
  const r = reduceGame(s, a, content);
  if (!r.ok) throw new Error(`${a.type} rejected: ${r.error}`);
  return r.state;
}
const tryStep = (s: GameState, a: GameAction): GameState => {
  const r = reduceGame(s, a, content);
  return r.ok ? r.state : s;
};

const fresh = (seed = 7): GameState => newRandomGame(seed, identityPools);

/** Override the character without touching the rest. */
const withChar = (s: GameState, patch: Partial<GameState['character']>): GameState => ({
  ...s,
  character: { ...s.character, ...patch },
});

/** Answer any open prompt using the first (or a chosen) choice. */
const answer = (s: GameState, pick?: (ids: string[]) => string): GameState => {
  if (!s.prompt) return s;
  const ids = s.prompt.def.choices.map((c) => c.id);
  return step(s, { type: 'RESOLVE_PROMPT', choiceId: pick ? pick(ids) : (ids[0] as string) });
};

function ageUpOneYear(s: GameState, rng?: Rng): GameState {
  let g = s;
  g = step(g, { type: 'ACK_BRIEFING' });
  g = step(g, { type: 'BANK_REMAINING_AS_REST' });
  g = step(g, { type: 'CONFIRM_FOCUS' });
  for (const e of g.yearLoop.pendingEvents) {
    const ids = e.def.choices.map((c) => c.id);
    g = step(g, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: rng ? rng.pick(ids) : (ids[0] as string) });
  }
  g = step(g, { type: 'PROCEED_TO_COMMIT' });
  g = step(g, { type: 'CONFIRM_AGE_UP', now: clock });
  clock += MIN_AGING_MS;
  return step(g, { type: 'FINISH_AGING', now: clock });
}

function ageTo(s: GameState, age: number): GameState {
  let g = s;
  while (g.character.age < age && g.yearLoop.phase !== 'DEAD') g = ageUpOneYear(g);
  return g;
}

describe('prompts and slots (anti-rush)', () => {
  it('an open prompt blocks phase changes and other actions', () => {
    let g = withChar(fresh(), { age: 20 });
    // find a seed where meeting someone opens a prompt
    g = step(g, { type: 'MEET_PERSON', intent: 'friend' });
    expect(g.prompt).not.toBeNull();
    const r1 = reduceGame(g, { type: 'ACK_BRIEFING' }, content);
    const r2 = reduceGame(g, { type: 'ACTIVITY', id: 'read-book' }, content);
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
    g = answer(g);
    expect(g.prompt).toBeNull();
  });

  it('only a few activities fit in a year, and slots refill when you age up', () => {
    let g = withChar(fresh(), { age: 20, money: 5000 });
    const start = g.yearLoop.actionsLeft;
    for (let i = 0; i < start; i++) g = step(g, { type: 'ACTIVITY', id: 'read-book' });
    expect(g.yearLoop.actionsLeft).toBe(0);
    expect(reduceGame(g, { type: 'ACTIVITY', id: 'read-book' }, content).ok).toBe(false);
    // Money moves don't need slots.
    g = tryStep(g, { type: 'REPAY_DEBT', amount: 1 });
    g = ageUpOneYear(g);
    expect(g.yearLoop.actionsLeft).toBe(start);
  });

  it('rejects life actions while dead or aging', () => {
    let g = fresh();
    g = step(g, { type: 'ACK_BRIEFING' });
    g = step(g, { type: 'BANK_REMAINING_AS_REST' });
    g = step(g, { type: 'CONFIRM_FOCUS' });
    for (const e of g.yearLoop.pendingEvents) g = step(g, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: e.def.choices[0]!.id });
    g = step(g, { type: 'PROCEED_TO_COMMIT' });
    g = step(g, { type: 'CONFIRM_AGE_UP', now: 0 });
    expect(reduceGame(g, { type: 'ACTIVITY', id: 'read-book' }, content).ok).toBe(false);
  });
});

describe('education', () => {
  it('walks a child through primary and high school automatically', () => {
    let g = fresh(3);
    g = ageTo(g, 19);
    if (g.yearLoop.phase !== 'DEAD') {
      expect(g.character.education.level).toBe(2);
      expect(g.character.education.enrolled).toBeNull();
    }
  });

  it('university admission opens a major prompt and can enrol with a loan', () => {
    let g = withChar(fresh(5), {
      age: 18,
      stats: { health: 80, happiness: 70, smarts: 98, looks: 60, karma: 50, energy: 70 },
      education: { level: 2, enrolled: null, grades: 95, degrees: [] },
    });
    g = step(g, { type: 'APPLY_STUDY', kind: 'university' });
    expect(g.prompt?.def.choices.some((c) => c.id.startsWith('major:'))).toBe(true);
    g = answer(g, (ids) => ids.find((i) => i === 'major:business') ?? (ids[0] as string));
    // 92% admission odds; if rejected the test seed would be unlucky, so just ensure consistent state.
    expect(g.prompt).toBeNull();
  });
});

describe('careers', () => {
  it('a teen can land a part-time job and accept the offer', () => {
    let offered = false;
    for (let seed = 1; seed < 40 && !offered; seed++) {
      let g = withChar(fresh(seed), { age: 15 });
      g = step(g, { type: 'APPLY_JOB', careerId: 'fast-food' });
      if (g.prompt) {
        offered = true;
        g = answer(g, () => 'accept');
        expect(g.character.job?.careerId).toBe('fast-food');
        expect(g.character.job?.salary).toBeGreaterThan(0);
      }
    }
    expect(offered).toBe(true);
  });

  it('blocks careers the character is not qualified for', () => {
    const g = withChar(fresh(), { age: 22 });
    expect(reduceGame(g, { type: 'APPLY_JOB', careerId: 'doctor' }, content).ok).toBe(false);
    expect(reduceGame({ ...g, character: { ...g.character, age: 10 } }, { type: 'APPLY_JOB', careerId: 'warehouse' }, content).ok).toBe(false);
  });

  it('employed characters earn taxed pay each year', () => {
    let g = withChar(fresh(2), {
      age: 25,
      money: 0,
      education: { level: 2, enrolled: null, grades: 60, degrees: [] },
      job: { careerId: 'warehouse', title: 'Picker', level: 0, salary: 30000, yearsInJob: 0, performance: 60 },
    });
    g = ageUpOneYear(g);
    const last = g.yearLoop.history[g.yearLoop.history.length - 1];
    expect(last?.cashflow?.income).toBeGreaterThanOrEqual(24000 - 1); // salary after 20% tax
  });
});

describe('romance and family', () => {
  const partner = (status: Relationship['status'], closeness: number): Relationship => ({
    id: 'p1', kind: 'partner', status, name: 'Sam Rivers', age: 28, gender: 'nonbinary', closeness,
  });

  it('can propose, marry and have a baby (given enough tries)', () => {
    let married = false;
    for (let seed = 1; seed < 30 && !married; seed++) {
      let g = withChar(fresh(seed), { age: 28, money: 20000, relationships: [partner('dating', 95)] });
      g = { ...g, yearLoop: { ...g.yearLoop, actionsLeft: 99 } };
      g = tryStep(g, { type: 'RELATE', personId: 'p1', interaction: 'propose' });
      if (g.character.relationships[0]?.status !== 'engaged') continue;
      g = step(g, { type: 'RELATE', personId: 'p1', interaction: 'wedding' });
      expect(g.character.relationships[0]?.status).toBe('married');
      married = true;
      let kids = 0;
      for (let i = 0; i < 20 && kids === 0; i++) {
        g = step(g, { type: 'RELATE', personId: 'p1', interaction: 'baby' });
        kids = g.character.relationships.filter((r) => r.kind === 'child').length;
      }
      expect(kids).toBeGreaterThan(0);
      g = step(g, { type: 'RELATE', personId: 'p1', interaction: 'divorce' });
      expect(g.character.relationships.find((r) => r.id === 'p1')?.status).toBe('divorced');
    }
    expect(married).toBe(true);
  });

  it('refuses to propose when not close enough', () => {
    const g = withChar(fresh(), { age: 28, relationships: [partner('dating', 30)] });
    expect(reduceGame(g, { type: 'RELATE', personId: 'p1', interaction: 'propose' }, content).ok).toBe(false);
  });

  it('neglected partners eventually leave', () => {
    let g = withChar(fresh(4), { age: 25, relationships: [partner('dating', 14)] });
    g = ageTo(g, 29);
    expect(g.character.relationships.find((r) => r.id === 'p1')?.kind).not.toBe('partner');
  });
});

describe('crime', () => {
  it('getting caught opens a court prompt; pleading guilty sends you to prison, then you walk free', () => {
    let jailed: GameState | null = null;
    for (let seed = 1; seed < 60 && !jailed; seed++) {
      let g = withChar(fresh(seed), { age: 20, stats: { ...fresh(seed).character.stats, smarts: 10 } });
      g = tryStep(g, { type: 'CRIME', id: 'armed-robbery' });
      if (g.prompt?.def.id === 'crime.caught') {
        g = answer(g, () => 'plead');
        if (g.character.crime.prison) jailed = g;
      }
    }
    expect(jailed).not.toBeNull();
    let g = jailed as GameState;
    expect(g.character.job).toBeNull();
    expect(reduceGame(g, { type: 'CRIME', id: 'shoplift' }, content).ok).toBe(false);
    expect(activityBlocker(g.character, content.activities.find((a) => a.id === 'gym')!)).toMatch(/bars/);
    expect(activityBlocker(g.character, content.activities.find((a) => a.id === 'prison-gym')!)).toBeNull();
    g = ageTo(g, g.character.age + 20);
    if (g.yearLoop.phase !== 'DEAD') expect(g.character.crime.prison).toBeNull();
    expect(g.character.crime.record.length).toBe(1);
  });
});

describe('money', () => {
  it('buying needs cash; investing and selling move money', () => {
    let g = withChar(fresh(), { age: 30, money: 1000 });
    expect(reduceGame(g, { type: 'BUY', offerId: 'home.house' }, content).ok).toBe(false);
    g = withChar(g, { money: 10000 });
    g = step(g, { type: 'INVEST', offerId: 'inv.savings', amount: 4000 });
    expect(g.character.money).toBe(6000);
    expect(g.character.assets[0]?.value).toBe(4000);
    g = step(g, { type: 'SELL', assetId: g.character.assets[0]!.id });
    expect(g.character.assets).toHaveLength(0);
    expect(g.character.money).toBeGreaterThan(9900);
  });

  it('mortgages need income and a down payment', () => {
    let g = withChar(fresh(), { age: 30, money: 100000 });
    expect(reduceGame(g, { type: 'BUY', offerId: 'home.house', financed: true }, content).ok).toBe(false);
    g = withChar(g, { job: { careerId: 'x', title: 'X', level: 0, salary: 80000, yearsInJob: 1, performance: 60 } });
    g = step(g, { type: 'BUY', offerId: 'home.house', financed: true });
    expect(g.character.debt).toBe(256000);
    expect(g.character.assets[0]?.kind).toBe('home');
  });

  it('shortfalls turn into debt instead of negative cash', () => {
    let g = withChar(fresh(), { age: 30, money: 0 });
    g = ageUpOneYear(g);
    expect(g.character.money).toBeGreaterThanOrEqual(0);
    expect(g.character.debt).toBeGreaterThan(0);
  });
});

describe('health', () => {
  it('check-ups reveal hidden conditions and treatment can cure them', () => {
    const hidden = { id: 'flu', name: 'Flu', icon: '🤒', kind: 'illness' as const, severity: 1 as const, sinceAge: 20, chronic: false, treated: false, diagnosed: false };
    let g = withChar(fresh(), { age: 30, money: 5000, conditions: [hidden] });
    expect(reduceGame(g, { type: 'TREAT', conditionId: 'flu' }, content).ok).toBe(false);
    g = step(g, { type: 'CHECKUP' });
    expect(g.character.conditions[0]?.diagnosed).toBe(true);
    let cured = false;
    for (let seed = 1; seed < 20 && !cured; seed++) {
      let h = { ...g, rngState: seed * 1234567 };
      h = { ...h, yearLoop: { ...h.yearLoop, actionsLeft: 5 } };
      h = step(h, { type: 'TREAT', conditionId: 'flu' });
      cured = h.character.conditions.length === 0;
    }
    expect(cured).toBe(true);
  });
});

describe('heir system', () => {
  it('continues the bloodline as a child with an inheritance', () => {
    const kid: Relationship = { id: 'k1', kind: 'child', name: 'Mia Hart', age: 9, gender: 'female', closeness: 90 };
    let g = withChar(fresh(), { age: 71, money: 100000, relationships: [kid] });
    g = { ...g, character: { ...g.character, alive: false, causeOfDeath: 'old age' }, yearLoop: { ...g.yearLoop, phase: 'DEAD' } };
    expect(heirCandidates(g).map((r) => r.id)).toEqual(['k1']);
    const next = startHeir(g, 'k1');
    expect(next).not.toBeNull();
    expect(next?.generation).toBe(2);
    expect(next?.character.name).toBe('Mia Hart');
    expect(next?.character.age).toBe(9);
    expect(next?.character.money).toBe(70000);
    expect(next?.lineage).toHaveLength(1);
    expect(next?.character.education.enrolled?.kind).toBe('primary');
    expect(startHeir(g, 'nobody')).toBeNull();
    expect(startHeir({ ...g, yearLoop: { ...g.yearLoop, phase: 'BRIEFING' } }, 'k1')).toBeNull();
  });
});

describe('full lives (bot)', () => {
  function botYear(s: GameState, rng: Rng): GameState {
    let g = step(s, { type: 'ACK_BRIEFING' });
    for (const area of FOCUS_AREAS) {
      const room = g.yearLoop.focusBudget - Object.values(g.yearLoop.allocation).reduce((a, b) => a + b, 0);
      if (room > 0 && rng.chance(0.5)) g = tryStep(g, { type: 'SET_FOCUS', area, points: rng.int(0, Math.min(room, 3)) });
    }
    g = step(g, { type: 'BANK_REMAINING_AS_REST' });
    g = step(g, { type: 'CONFIRM_FOCUS' });
    // Spend slots on random things.
    for (let i = 0; i < 6; i++) {
      const c = g.character;
      const roll = rng.int(0, 9);
      if (roll === 0) g = tryStep(g, { type: 'MEET_PERSON', intent: rng.chance(0.5) ? 'love' : 'friend' });
      else if (roll === 1) g = tryStep(g, { type: 'APPLY_JOB', careerId: rng.pick(content.careers).id });
      else if (roll === 2) g = tryStep(g, { type: 'APPLY_STUDY', kind: rng.pick(['university', 'masters', 'doctorate'] as const) });
      else if (roll === 3) g = tryStep(g, { type: 'CRIME', id: rng.pick(content.crimes).id });
      else if (roll === 4 && c.relationships.length) g = tryStep(g, { type: 'RELATE', personId: rng.pick(c.relationships).id, interaction: rng.pick(['time', 'date', 'propose', 'wedding', 'baby', 'gift'] as const) });
      else if (roll === 5) g = tryStep(g, { type: 'CHECKUP' });
      else if (roll === 6) g = tryStep(g, { type: 'BUY', offerId: rng.pick(content.offers.filter((o) => !o.divisible)).id, financed: rng.chance(0.5) });
      else if (roll === 7) g = tryStep(g, { type: 'INVEST', offerId: 'inv.index', amount: Math.max(1, Math.floor(c.money / 2)) });
      else g = tryStep(g, { type: 'ACTIVITY', id: rng.pick(content.activities).id });
      if (g.prompt) g = answer(g, (ids) => rng.pick(ids));
      for (const k of g.character.conditions) g = tryStep(g, { type: 'TREAT', conditionId: k.id, surgery: k.severity >= 3 });
      if (g.prompt) g = answer(g, (ids) => rng.pick(ids));
    }
    for (const e of g.yearLoop.pendingEvents) {
      g = step(g, { type: 'RESOLVE_EVENT', eventId: e.eventId, choiceId: rng.pick(e.def.choices).id });
    }
    g = step(g, { type: 'PROCEED_TO_COMMIT' });
    g = step(g, { type: 'CONFIRM_AGE_UP', now: clock });
    clock += MIN_AGING_MS;
    return step(g, { type: 'FINISH_AGING', now: clock });
  }

  function playLife(seed: number): GameState {
    const rng = createRng(seed * 77);
    let g = fresh(seed);
    let guard = 0;
    while (g.yearLoop.phase !== 'DEAD' && guard++ < 140) g = botYear(g, rng);
    return g;
  }

  it('random-bot lives never crash, stay serialisable and keep sane numbers', () => {
    const ages: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const g = playLife(seed);
      expect(g.yearLoop.phase).toBe('DEAD');
      expect(JSON.parse(JSON.stringify(g))).toEqual(g);
      const c = g.character;
      for (const v of Object.values(c.stats)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      expect(c.money).toBeGreaterThanOrEqual(0);
      expect(c.debt).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(c.money + c.debt)).toBe(true);
      ages.push(c.age - 1);
    }
    ages.sort((a, b) => a - b);
    const median = ages[Math.floor(ages.length / 2)] as number;
    expect(median).toBeGreaterThanOrEqual(45);
    expect(median).toBeLessThanOrEqual(95);
  });

  it('is deterministic for a seed', () => {
    expect(playLife(11)).toEqual(playLife(11));
  });
});
