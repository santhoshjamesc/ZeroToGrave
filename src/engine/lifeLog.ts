import { Character, LifeLogEntry } from './types';

/** Age-based milestones so every life has a visible story even before content grows. */
export function milestoneFor(newAge: number): LifeLogEntry | null {
  const m: Record<number, [string, string]> = {
    1: ['🍼', 'Took first steps.'],
    3: ['🧸', 'Started preschool and made a best friend.'],
    6: ['🎒', 'Started primary school.'],
    13: ['🎂', 'Became a teenager.'],
    16: ['🚗', 'Old enough to learn to drive.'],
    18: ['🎓', 'Became an adult. Time to choose a path.'],
    21: ['🥂', 'Turned 21.'],
    30: ['🕯️', 'Turned 30. The twenties are over.'],
    40: ['🍷', 'Hit 40. Middle age begins.'],
    50: ['🏔️', 'Half a century alive.'],
    65: ['🌅', 'Reached retirement age.'],
    80: ['👴', 'Eighty years young.'],
    100: ['💯', 'A centenarian!'],
  };
  const hit = m[newAge];
  return hit ? { age: newAge, icon: hit[0], text: hit[1] } : null;
}

export function appendLog(c: Character, entries: LifeLogEntry[]): Character {
  return entries.length ? { ...c, log: [...c.log, ...entries] } : c;
}
