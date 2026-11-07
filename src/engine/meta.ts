import { Character, GameState, GraveEntry, MetaState } from './types';

export const emptyMeta = (): MetaState => ({
  version: 1,
  achievements: {},
  graveyard: [],
  livesStarted: 0,
});

export const netWorth = (c: Character): number =>
  Math.round(c.money + c.assets.reduce((s, a) => s + a.value, 0) - c.debt);

export const graveId = (g: GameState): string => `${g.seed}:${g.generation}:${g.character.id}`;

function epitaphFor(c: Character): string {
  const kids = c.relationships.filter((r) => r.kind === 'child').length;
  if (c.causeOfDeath === 'violence') return 'Lived fast. Left a mark.';
  if (netWorth(c) > 1_000_000) return 'Rich in every way that shows up on a spreadsheet.';
  if (kids >= 3) return 'Beloved parent of many.';
  if (c.crime.record.length >= 3) return 'The law never quite caught up.';
  if (c.age > 90) return 'Outlasted everyone. Still got the last laugh.';
  if (c.stats.karma > 80) return 'Kind to the very end.';
  if (c.age < 18) return 'Gone far too soon.';
  return 'Here lies someone who really lived.';
}

/** Summary of a finished life for the graveyard. */
export function graveEntry(g: GameState): GraveEntry {
  const c = g.character;
  const died = Math.max(0, c.age - 1);
  return {
    id: graveId(g),
    name: c.name,
    flag: c.identity.flag,
    generation: g.generation,
    bornYear: c.identity.birthYear,
    diedAtAge: died,
    cause: c.causeDetail ?? c.causeOfDeath ?? 'unknown causes',
    netWorth: netWorth(c),
    jobTitle: c.job?.title ?? null,
    children: c.relationships.filter((r) => r.kind === 'child').length,
    achievements: g.achievements.length,
    epitaph: epitaphFor(c),
  };
}

/**
 * Fold a game state into the cross-life meta: new achievements are recorded against the current
 * life number, and a dead character is buried exactly once. Pure; returns the same object if
 * nothing changed so callers can skip writing.
 */
export function mergeMeta(meta: MetaState, g: GameState): MetaState {
  let next = meta;
  const fresh = g.achievements.filter((id) => meta.achievements[id] === undefined);
  if (fresh.length > 0) {
    const achievements = { ...meta.achievements };
    for (const id of fresh) achievements[id] = Math.max(1, meta.livesStarted);
    next = { ...next, achievements };
  }
  if (g.yearLoop.phase === 'DEAD' && !next.graveyard.some((e) => e.id === graveId(g))) {
    next = { ...next, graveyard: [graveEntry(g), ...next.graveyard] };
  }
  return next;
}
