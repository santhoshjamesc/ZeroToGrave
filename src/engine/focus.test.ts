import { emptyAllocation, effectiveUnits, focusBudget, focusOutcome, totalAllocated } from './focus';
import { newCharacter } from './newGame';

describe('focus points', () => {
  it('has diminishing returns per area', () => {
    const gains = [1, 2, 3, 4].map((n) => effectiveUnits(n) - effectiveUnits(n - 1));
    for (let i = 1; i < gains.length; i++) expect(gains[i]!).toBeLessThan(gains[i - 1]!);
    expect(effectiveUnits(0)).toBe(0);
  });

  it('spreading points beats stacking one area', () => {
    const stacked = { ...emptyAllocation(), study: 6 };
    const spread = { ...emptyAllocation(), study: 3, hobby: 3 };
    const sm = (a: typeof stacked) => focusOutcome(a).stats.smarts ?? 0;
    expect(sm(stacked)).toBeGreaterThan(sm(spread)); // study is smarts-heavy, but hobby adds happiness
    expect((focusOutcome(spread).stats.happiness ?? 0)).toBeGreaterThan(focusOutcome(stacked).stats.happiness ?? -99);
  });

  it('budget shrinks with illness, kids and job, never below the minimum', () => {
    const c = newCharacter('T', 1);
    const healthy = { ...c, stats: { ...c.stats, health: 90 } };
    expect(focusBudget(healthy)).toBe(10);
    expect(focusBudget({ ...healthy, stats: { ...healthy.stats, health: 20 } })).toBe(7);
    const burdened = {
      ...healthy,
      stats: { ...healthy.stats, health: 10 },
      job: { careerId: 'x', title: 'X', level: 1, salary: 1, yearsInJob: 0, performance: 50 },
      relationships: [1, 2, 3, 4].map((i) => ({ id: `${i}`, name: 'k', kind: 'child' as const, closeness: 50 })),
    };
    expect(focusBudget(burdened)).toBe(4);
  });

  it('totalAllocated sums areas', () => {
    expect(totalAllocated({ ...emptyAllocation(), rest: 2, study: 3 })).toBe(5);
  });
});
