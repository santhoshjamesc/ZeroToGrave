import { createRng } from './rng';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 10 }, () => a.next())).toEqual(Array.from({ length: 10 }, () => b.next()));
  });

  it('differs across seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('resumes from saved state', () => {
    const a = createRng(7);
    a.next();
    a.next();
    const b = createRng(a.state());
    expect(b.next()).toBe(a.next());
  });

  it('int stays in inclusive range', () => {
    const r = createRng(3);
    for (let i = 0; i < 500; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('weighted never picks zero-weight items and throws if none pickable', () => {
    const r = createRng(9);
    for (let i = 0; i < 200; i++) expect(r.weighted(['a', 'b'], (x) => (x === 'a' ? 0 : 1))).toBe('b');
    expect(() => r.weighted(['a'], () => 0)).toThrow();
  });
});
