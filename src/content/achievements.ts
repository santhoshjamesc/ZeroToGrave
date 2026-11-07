import { netWorth } from '../engine/meta';
import { AchievementDef, GameState } from '../engine/types';

type Check = (g: GameState) => boolean;
const A = (id: string, icon: string, name: string, description: string, check: Check): AchievementDef => ({ id, icon, name, description, check });

const alive = (g: GameState): boolean => g.yearLoop.phase !== 'DEAD';
const kids = (g: GameState): number => g.character.relationships.filter((r) => r.kind === 'child' && !r.deceased).length;
const friends = (g: GameState): number => g.character.relationships.filter((r) => r.kind === 'friend' && !r.deceased).length;
const hasAsset = (g: GameState, kind: string): boolean => g.character.assets.some((a) => a.kind === kind);

export const achievements: AchievementDef[] = [
  // Milestones
  A('teen', '🎂', 'Teenager', 'Reach age 13.', (g) => g.character.age >= 13),
  A('adult', '🎓', 'Official Adult', 'Reach age 18.', (g) => g.character.age >= 18),
  A('midlife', '🍷', 'Over the Hill', 'Reach age 40.', (g) => g.character.age >= 40),
  A('senior', '🌅', 'Golden Years', 'Reach age 65.', (g) => g.character.age >= 65),
  A('octogenarian', '👴', 'Still Kicking', 'Reach age 80.', (g) => g.character.age >= 80),
  A('centenarian', '💯', 'Centenarian', 'Reach age 100.', (g) => g.character.age >= 100),
  A('short-life', '🕊️', 'Gone Too Soon', 'Die before your 10th birthday.', (g) => !alive(g) && g.character.age - 1 < 10),

  // School & work
  A('graduate', '🎓', 'Graduate', "Earn a bachelor's degree.", (g) => g.character.education.level >= 3),
  A('master', '📜', 'Master of It', "Earn a master's degree.", (g) => g.character.education.level >= 4),
  A('doctor-phd', '🧑‍🔬', 'Doctor Doctor', 'Earn a doctorate.', (g) => g.character.education.level >= 5),
  A('first-job', '💼', 'Employee of the Month', 'Hold a job.', (g) => g.character.job !== null),
  A('promoted', '📈', 'Climbing', 'Reach the third rung of a career ladder.', (g) => (g.character.job?.level ?? 0) >= 2),
  A('top-of-ladder', '👑', 'At the Top', 'Reach the fourth rung of any career.', (g) => (g.character.job?.level ?? 0) >= 3),
  A('retired', '🏖️', 'Retired', 'Retire after a career.', (g) => g.character.retired),
  A('six-figures', '💵', 'Six Figures', 'Earn $100,000 a year.', (g) => (g.character.job?.salary ?? 0) >= 100000),

  // Wealth
  A('saver', '🐷', 'Rainy Day', 'Have $10,000 in cash.', (g) => g.character.money >= 10000),
  A('millionaire', '🤑', 'Millionaire', 'Reach a net worth of $1,000,000.', (g) => netWorth(g.character) >= 1_000_000),
  A('tycoon', '💎', 'Tycoon', 'Reach a net worth of $10,000,000.', (g) => netWorth(g.character) >= 10_000_000),
  A('in-debt', '📉', 'Underwater', 'Owe more than $50,000.', (g) => g.character.debt >= 50000),
  A('homeowner', '🏡', 'Homeowner', 'Own a home.', (g) => hasAsset(g, 'home')),
  A('driver', '🚗', 'Wheels', 'Own a vehicle.', (g) => hasAsset(g, 'vehicle')),
  A('investor', '📊', 'Investor', 'Hold an investment.', (g) => hasAsset(g, 'investment')),
  A('owner', '🏢', 'Business Owner', 'Own a business.', (g) => hasAsset(g, 'business')),
  A('landlord', '🏘️', 'Landlord', 'Own a rental property.', (g) => g.character.assets.some((a) => a.offerId === 'home.rental')),

  // People
  A('in-love', '💘', 'In Love', 'Start dating someone.', (g) => g.character.relationships.some((r) => r.kind === 'partner')),
  A('married', '💍', 'Hitched', 'Get married.', (g) => g.character.relationships.some((r) => r.status === 'married' || r.status === 'divorced')),
  A('divorced', '⚖️', 'Plot Twist', 'Get divorced.', (g) => g.character.relationships.some((r) => r.status === 'divorced')),
  A('parent', '👶', 'Parent', 'Have a child.', (g) => kids(g) >= 1),
  A('big-family', '👨‍👩‍👧‍👦', 'Full House', 'Have four children.', (g) => kids(g) >= 4),
  A('popular', '🎉', 'Popular', 'Have eight friends at once.', (g) => friends(g) >= 8),
  A('dynasty', '🧬', 'Dynasty', 'Play as a second-generation heir.', (g) => g.generation >= 2),
  A('dynasty3', '🏛️', 'Bloodline', 'Reach the third generation.', (g) => g.generation >= 3),

  // Crime
  A('convict', '⛓️', 'Behind Bars', 'Get sent to prison.', (g) => g.character.crime.record.length >= 1),
  A('career-criminal', '🕶️', 'Career Criminal', 'Rack up three convictions.', (g) => g.character.crime.record.length >= 3),
  A('jailbreak', '🪜', 'Great Escape', 'Break out of prison.', (g) => g.character.flags.escaped === true),
  A('heist', '🏦', 'Heist Crew', 'Serve a 10+ year sentence.', (g) => g.character.crime.record.some((r) => r.sentenceYears >= 10)),

  // Character
  A('saint', '😇', 'Saint', 'Reach 95 karma.', (g) => g.character.stats.karma >= 95),
  A('villain', '😈', 'Villain Arc', 'Fall to 5 karma as an adult.', (g) => g.character.age >= 18 && g.character.stats.karma <= 5),
  A('genius', '🧠', 'Genius', 'Reach 95 smarts.', (g) => g.character.stats.smarts >= 95),
  A('stunner', '✨', 'Stunner', 'Reach 95 looks.', (g) => g.character.stats.looks >= 95),
  A('bliss', '😊', 'Pure Bliss', 'Hit 100 happiness.', (g) => g.character.stats.happiness >= 100),
  A('survivor', '🩹', 'Survivor', 'Live with three conditions at once.', (g) => g.character.conditions.length >= 3),
  A('fit-elder', '💪', 'Fit as a Fiddle', 'Be 70+ with 70+ health.', (g) => g.character.age >= 70 && g.character.stats.health >= 70 && alive(g)),
];
