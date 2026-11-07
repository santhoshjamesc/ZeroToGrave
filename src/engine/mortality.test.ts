import { createRng } from '../utils/rng';
import { newCharacter } from './newGame';
import { deathRisk, rollDeath } from './mortality';

describe('mortality', () => {
  it('risk rises with age and falls with good health', () => {
    const c = newCharacter('T', 1);
    const young = deathRisk({ ...c, age: 20 }).total;
    const old = deathRisk({ ...c, age: 85 }).total;
    expect(old).toBeGreaterThan(young * 20);
    const sick = deathRisk({ ...c, age: 50, stats: { ...c.stats, health: 10 } }).total;
    const fit = deathRisk({ ...c, age: 50, stats: { ...c.stats, health: 90 } }).total;
    expect(sick).toBeGreaterThan(fit * 4);
  });

  it('is deterministic per seed', () => {
    const c = { ...newCharacter('T', 1), age: 90 };
    expect(rollDeath(c, createRng(5))).toBe(rollDeath(c, createRng(5)));
  });

  it('median passive lifespan lands in a plausible range', () => {
    const ages: number[] = [];
    for (let seed = 1; seed <= 400; seed++) {
      const rng = createRng(seed);
      let c = newCharacter('T', seed);
      while (c.alive && c.age < 130) {
        if (rollDeath(c, rng)) break;
        c = { ...c, age: c.age + 1 };
      }
      ages.push(c.age);
    }
    ages.sort((a, b) => a - b);
    const median = ages[Math.floor(ages.length / 2)] as number;
    expect(median).toBeGreaterThanOrEqual(68);
    expect(median).toBeLessThanOrEqual(90);
  });
});
