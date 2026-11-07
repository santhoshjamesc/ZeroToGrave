import { gameContent as c } from './index';

const unique = (ids: string[]): boolean => new Set(ids).size === ids.length;

describe('content validation', () => {
  it('has unique ids in every pool', () => {
    for (const pool of [c.events, c.fallback, c.careers, c.majors, c.diseases, c.activities, c.crimes, c.offers, c.achievements]) {
      expect(unique(pool.map((x) => x.id))).toBe(true);
    }
  });

  it('events have choices and sane age windows', () => {
    for (const e of [...c.events, ...c.fallback]) {
      expect(e.choices.length).toBeGreaterThan(0);
      expect(e.minAge).toBeLessThanOrEqual(e.maxAge);
      expect(unique(e.choices.map((x) => x.id))).toBe(true);
      for (const ch of e.choices) {
        if (!ch.gamble) continue;
        expect(ch.gamble.p).toBeGreaterThan(0);
        expect(ch.gamble.p).toBeLessThan(1);
      }
    }
  });

  it('every age 0-100 has at least one eligible event or fallback', () => {
    for (let age = 0; age <= 100; age++) {
      const n = [...c.events, ...c.fallback].filter((e) => age >= e.minAge && age <= e.maxAge && e.weight > 0 && !e.requiresFlags?.length).length;
      expect(n).toBeGreaterThan(0);
    }
  });

  it('career ladders climb and degree careers reference real majors', () => {
    for (const k of c.careers) {
      expect(k.ladder.length).toBeGreaterThan(0);
      for (let i = 1; i < k.ladder.length; i++) expect(k.ladder[i]!.salary).toBeGreaterThan(k.ladder[i - 1]!.salary);
      if (k.major) expect(c.majors.some((m) => m.id === k.major)).toBe(true);
    }
    expect(c.careers.length).toBeGreaterThanOrEqual(30);
  });

  it('activities and crimes are well formed', () => {
    for (const a of c.activities) {
      expect(a.outcomes.length).toBeGreaterThan(0);
      for (const o of a.outcomes) expect(o.weight).toBeGreaterThan(0);
    }
    for (const k of c.crimes) {
      expect(k.catchRisk).toBeGreaterThan(0);
      expect(k.catchRisk).toBeLessThan(1);
      expect(k.sentence[0]).toBeLessThanOrEqual(k.sentence[1]);
    }
  });

  it('diseases reference only lifestyle flags that something can set', () => {
    const settable = new Set<string>();
    const scan = (effects: { type: string; key?: string }[]) => effects.forEach((e) => e.type === 'flag' && e.key && settable.add(e.key));
    for (const a of c.activities) a.outcomes.forEach((o) => scan(o.effects));
    for (const e of [...c.events, ...c.fallback]) e.choices.forEach((ch) => scan(ch.effects));
    for (const d of c.diseases) {
      if (d.requiresFlag) expect(settable.has(d.requiresFlag)).toBe(true);
      for (const f of Object.keys(d.riskFlags ?? {})) expect(settable.has(f)).toBe(true);
    }
  });

  it('offers: investments are divisible, others have a price', () => {
    for (const o of c.offers) {
      if (o.divisible) expect(o.kind).toBe('investment');
      else expect(o.price).toBeGreaterThan(0);
    }
  });

  it('event requirements reference real traits and flags that something can set', () => {
    const traitIds = new Set(c.traits.map((t) => t.id));
    const settable = new Set<string>();
    const scan = (effects: { type: string; key?: string }[]) => effects.forEach((e) => e.type === 'flag' && e.key && settable.add(e.key));
    const all = [...c.events, ...c.fallback];
    for (const e of all) for (const ch of e.choices) {
      scan(ch.effects);
      if (ch.gamble) { scan(ch.gamble.win); scan(ch.gamble.lose); }
    }
    for (const a of c.activities) a.outcomes.forEach((o) => scan(o.effects));
    for (const f of ['family_struggling', 'family_modest', 'family_comfortable', 'family_wealthy']) settable.add(f);
    for (const e of all) {
      for (const t of e.requiresTraits ?? []) expect(traitIds.has(t)).toBe(true);
      for (const f of e.requiresFlags ?? []) expect(`${e.id} needs ${f}: ${settable.has(f)}`).toBe(`${e.id} needs ${f}: true`);
    }
  });

  it('no activity, career or event lets a baby do adult things', () => {
    for (const k of c.careers) expect(k.minAge).toBeGreaterThanOrEqual(14);
    for (const k of c.crimes) expect(k.minAge).toBeGreaterThanOrEqual(8);
    for (const e of c.events) {
      const adultish = /\b(college|university|job interview|mortgage|wedding|divorce)\b/i.test(e.title);
      if (adultish) expect(e.minAge).toBeGreaterThanOrEqual(14);
    }
  });

  it('there is plenty to do at every life stage', () => {
    for (const age of [0, 1, 2, 3, 4]) expect(c.activities.filter((a) => a.where !== 'prison' && age >= a.minAge && age <= a.maxAge).length).toBeGreaterThanOrEqual(4);
    expect(c.activities.length).toBeGreaterThanOrEqual(100);
    expect(c.careers.length).toBeGreaterThanOrEqual(100);
  });
});
