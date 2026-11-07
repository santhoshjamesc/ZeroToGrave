import { AchievementDef, GameState } from '../engine/types';

type Check = (g: GameState) => boolean;
const A = (id: string, icon: string, name: string, description: string, check: Check): AchievementDef => ({ id, icon, name, description, check });

const alive = (g: GameState): boolean => g.yearLoop.phase !== 'DEAD';
const kids = (g: GameState): number => g.character.relationships.filter((r) => r.kind === 'child' && !r.deceased).length;
const friends = (g: GameState): number => g.character.relationships.filter((r) => r.kind === 'friend' && !r.deceased).length;
const hasAsset = (g: GameState, kind: string): boolean => g.character.assets.some((a) => a.kind === kind);

export const moreAchievements: AchievementDef[] = [
  A('well-rounded', '🌈', 'Well Rounded', 'Hold three or more personality traits.', (g) => g.character.traits.length >= 3),
  A('quiet-hero', '🦸', 'Quiet Hero', 'Reach 75 karma and be known as helpful.', (g) => g.character.stats.karma >= 75 && g.character.flags.helpful === true),
  A('thrill-seeker', '🧗', 'Thrill Seeker', 'Be adventurous and reach age 30.', (g) => g.character.flags.adventurous === true && g.character.age >= 30),
  A('teen-hustler', '🧢', 'Teen Hustler', 'Work a job before turning 18.', (g) => g.character.flags.worked_teen === true && g.character.age >= 16),
  A('licensed', '🪪', 'Licensed to Drive', 'Pass your driving lessons.', (g) => g.character.flags.can_drive === true),
  A('maxed-health', '❤️‍🔥', 'Peak Condition', 'Reach 100 health.', (g) => g.character.stats.health >= 100),
  A('all-rounder', '🎯', 'All-Rounder', 'Have 60+ in health, smarts, looks and happiness at once.', (g) => alive(g) && g.character.stats.health >= 60 && g.character.stats.smarts >= 60 && g.character.stats.looks >= 60 && g.character.stats.happiness >= 60),
  A('squeaky-clean', '🧼', 'Squeaky Clean', 'Reach age 50 without smoking, drinking or drugs.', (g) => g.character.age >= 50 && !g.character.flags.smoker && !g.character.flags.drinker && !g.character.flags.drugs),
  A('big-circle', '🫂', 'Inner Circle', 'Have four friends at once.', (g) => friends(g) >= 4),
  A('proud-grandparent', '🧓', 'Grand Plans', 'Reach age 60 with two or more children.', (g) => g.character.age >= 60 && kids(g) >= 2),
  A('reformed', '🕊️', 'Second Chances', 'Have a criminal record and reach 70 karma.', (g) => g.character.crime.record.length >= 1 && g.character.stats.karma >= 70),
  A('property-mogul', '🏙️', 'Property Mogul', 'Own a home and a business at the same time.', (g) => hasAsset(g, 'home') && hasAsset(g, 'business')),
  A('debt-free-late', '🧾', 'Clean Slate', 'Be 30+ with no debt and $50,000 in cash.', (g) => g.character.age >= 30 && g.character.debt === 0 && g.character.money >= 50000),
  A('life-chronicled', '📜', 'A Life Well Told', 'Fill your timeline with 100 memories.', (g) => g.character.log.length >= 100),
  A('late-bloomer', '🌻', 'Late Bloomer', 'Hold a degree at age 30 or older.', (g) => g.character.age >= 30 && g.character.education.level >= 3),
  A('centenarian-fit', '🏆', 'Built Different', 'Reach 100 with at least 40 health.', (g) => g.character.age >= 100 && g.character.stats.health >= 40 && alive(g)),
];
