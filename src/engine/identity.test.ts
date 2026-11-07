import { avatarSpec, lifeStage } from './avatar';
import { newRandomGame } from './newGame';
import { identityPools } from '../content/index';

describe('random identity', () => {
  it('is deterministic per seed and varied across seeds', () => {
    const a = newRandomGame(1, identityPools).character;
    expect(newRandomGame(1, identityPools).character).toEqual(a);
    const names = new Set(
      Array.from({ length: 40 }, (_, i) => newRandomGame(i + 10, identityPools).character.name),
    );
    expect(names.size).toBeGreaterThan(25);
    const countries = new Set(
      Array.from({ length: 40 }, (_, i) => newRandomGame(i + 10, identityPools).character.identity.country),
    );
    expect(countries.size).toBeGreaterThan(4);
  });

  it('gives a family sharing the surname', () => {
    const c = newRandomGame(5, identityPools).character;
    expect(c.relationships.length).toBeGreaterThanOrEqual(2);
    for (const r of c.relationships) expect(r.name.endsWith(c.identity.surname)).toBe(true);
  });
});

describe('avatar spec', () => {
  it('maps age to life stages and the look changes as you age', () => {
    expect([0, 3, 8, 15, 30, 50, 80].map(lifeStage)).toEqual([
      'baby', 'toddler', 'child', 'teen', 'adult', 'middle', 'senior',
    ]);
    const c = newRandomGame(9, identityPools).character;
    const baby = avatarSpec(c);
    const old = avatarSpec({ ...c, age: 80 });
    expect(baby.headScale).toBeGreaterThan(old.headScale);
    expect(old.wrinkles).toBe(3);
    expect(old.grey).toBeGreaterThan(0.5);
    expect(old.accessory).toBe('cane');
  });
});
