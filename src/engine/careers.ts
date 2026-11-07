import { Rng } from '../utils/rng';
import { CareerDef, GameContent } from './content';
import { AGE_GATES, tooYoung } from './ageGates';
import { traitMods } from './traits';
import { accept, clamp, fmtMoney, logIt, makePrompt, reject, ReduceResult } from './helpers';
import { Character, GameState, Job } from './types';

export const RETIREMENT_AGE = 65;
export const FORCED_RETIREMENT_AGE = 72;

export function careerById(content: GameContent, id: string): CareerDef | undefined {
  return content.careers.find((c) => c.id === id);
}

/** Why this career is closed to the character right now, or null if they can apply. */
export function careerBlocker(c: Character, career: CareerDef, content: GameContent): string | null {
  if (c.crime.prison) return 'Locked up.';
  if (c.age < AGE_GATES.jobs) return tooYoung(c.age, AGE_GATES.jobs, 'working');
  if (c.age < career.minAge) return tooYoung(c.age, career.minAge, `a job as ${career.name.toLowerCase()}`);
  if (c.age >= RETIREMENT_AGE + 5 && !career.partTime) return 'Past hiring age';
  if (c.education.level < career.minEdu) return 'Needs more schooling';
  if (career.major) {
    const major = content.majors.find((m) => m.id === career.major);
    const has = c.education.degrees.some((d) => major && d.startsWith(major.name));
    if (!has) return `Needs a ${major?.name ?? career.major} degree`;
  }
  if (career.minSmarts && c.stats.smarts < career.minSmarts) return `Needs smarts ${career.minSmarts}+`;
  if (career.minLooks && c.stats.looks < career.minLooks) return `Needs looks ${career.minLooks}+`;
  if (career.cleanRecord && c.crime.record.length > 0) return 'Criminal record';
  if (c.job?.careerId === career.id) return 'Already your job';
  return null;
}

/** Hiring odds: ability, experience and a clean record. */
export function hireChance(c: Character, career: CareerDef, content?: GameContent): number {
  let p = 0.3 + (content ? traitMods(c, content.traits).hire : 0) + (c.stats.smarts - 50) / 250 + Math.min(c.workXp, 40) / 120;
  if (c.education.level > career.minEdu) p += 0.1;
  if (c.crime.record.length > 0) p -= 0.25;
  if (c.job) p += 0.05; // easier to move when employed
  if (career.minLooks) p += (c.stats.looks - 50) / 300;
  return clamp(p, 0.06, 0.9);
}

export function startingSalary(career: CareerDef): number {
  return career.ladder[0]?.salary ?? 0;
}

/** Roll the interview; a success opens an offer the player may accept or decline. */
export function applyForJob(
  state: GameState,
  content: GameContent,
  careerId: string,
  rng: Rng,
): ReduceResult {
  const c = state.character;
  const career = careerById(content, careerId);
  if (!career) return reject(state, 'Unknown career');
  const blocker = careerBlocker(c, career, content);
  if (blocker) return reject(state, blocker);

  if (!rng.chance(hireChance(c, career, content))) {
    const next = logIt(
      { ...c, stats: { ...c.stats, happiness: clamp(c.stats.happiness - 2, 0, 100) } },
      '📨',
      `Applied to be a ${career.ladder[0]?.title ?? career.name}, but they went with someone else.`,
    );
    return accept({ ...state, character: next });
  }
  const first = career.ladder[0];
  if (!first) return reject(state, 'Career has no ladder');
  const job: Job = {
    careerId: career.id,
    title: first.title,
    level: 0,
    salary: first.salary,
    yearsInJob: 0,
    performance: 55,
  };
  return accept({
    ...state,
    prompt: makePrompt(
      'job.offer',
      `${career.icon} Job offer!`,
      `${first.title}, ${fmtMoney(first.salary)} a year. ${career.blurb}${c.job ? ' Taking it means leaving your current job.' : ''}`,
      [
        {
          id: 'accept',
          label: 'Accept the offer',
          riskHint: 'safe',
          effects: [
            { type: 'setJob', job },
            { type: 'stat', stat: 'happiness', delta: 4 },
            { type: 'log', icon: career.icon, text: `Started a new job as ${first.title}.` },
          ],
        },
        { id: 'decline', label: 'Decline', riskHint: 'safe', effects: [] },
      ],
    ),
  });
}

export function askForRaise(state: GameState, rng: Rng): ReduceResult {
  const c = state.character;
  const job = c.job;
  if (!job) return reject(state, 'You need a job first.');
  const p = clamp(job.performance / 160 + Math.min(job.yearsInJob, 5) * 0.04, 0.05, 0.75);
  if (rng.chance(p)) {
    const salary = Math.round((job.salary * 1.08) / 100) * 100;
    return accept({
      ...state,
      character: logIt(
        { ...c, job: { ...job, salary }, stats: { ...c.stats, happiness: clamp(c.stats.happiness + 3, 0, 100) } },
        '💵',
        `Boss agreed to a raise: ${fmtMoney(salary)} a year.`,
      ),
    });
  }
  return accept({
    ...state,
    character: logIt(
      { ...c, job: { ...job, performance: clamp(job.performance - 6, 0, 100) }, stats: { ...c.stats, happiness: clamp(c.stats.happiness - 3, 0, 100) } },
      '🙅',
      'Asked for a raise. The answer was a polite no.',
    ),
  });
}

export function promotionBlocker(c: Character, content: GameContent): string | null {
  const job = c.job;
  if (!job) return 'You need a job first.';
  const career = careerById(content, job.careerId);
  if (!career) return 'Career no longer exists.';
  if (job.level >= career.ladder.length - 1) return 'Already at the top.';
  if (job.yearsInJob < 1) return 'Give it a year first.';
  return null;
}

export function seekPromotion(state: GameState, content: GameContent, rng: Rng): ReduceResult {
  const c = state.character;
  const blocker = promotionBlocker(c, content);
  if (blocker || !c.job) return reject(state, blocker ?? 'No job');
  const job = c.job;
  const career = careerById(content, job.careerId);
  const next = career?.ladder[job.level + 1];
  if (!career || !next) return reject(state, 'Already at the top.');
  const p = clamp(job.performance / 130 + (c.stats.smarts - 50) / 400 + Math.min(job.yearsInJob, 6) * 0.03 - 0.12, 0.04, 0.8);
  if (rng.chance(p)) {
    const salary = Math.max(next.salary, Math.round(job.salary * 1.1));
    return accept({
      ...state,
      character: logIt(
        {
          ...c,
          job: { ...job, level: job.level + 1, title: next.title, salary, yearsInJob: 0 },
          stats: { ...c.stats, happiness: clamp(c.stats.happiness + 6, 0, 100) },
        },
        '📈',
        `Promoted to ${next.title}! ${fmtMoney(salary)} a year.`,
      ),
    });
  }
  return accept({
    ...state,
    character: logIt(
      { ...c, job: { ...job, performance: clamp(job.performance - 4, 0, 100) } },
      '😤',
      `Passed over for ${next.title}.`,
    ),
  });
}

export function quitJob(state: GameState): ReduceResult {
  const c = state.character;
  if (!c.job) return reject(state, 'You have no job.');
  return accept({ ...state, character: logIt({ ...c, job: null }, '🚪', `Quit the job as ${c.job.title}.`) });
}

export function retire(state: GameState): ReduceResult {
  const c = state.character;
  if (c.retired) return reject(state, 'Already retired.');
  if (c.age < 60) return reject(state, 'Too early to retire.');
  const pension = Math.round(Math.max(12000, (c.job?.salary ?? 20000) * 0.4));
  return accept({
    ...state,
    character: logIt(
      { ...c, job: null, retired: true, flags: { ...c.flags, pension } },
      '🏖️',
      `Retired with a pension of ${fmtMoney(pension)} a year.`,
    ),
  });
}

/** Year-end work life: experience, performance, small raises, layoffs. */
export function careerYear(
  c: Character,
  workPoints: number,
  newAge: number,
  rng: Rng,
  notes: string[],
): Character {
  const job = c.job;
  if (!job || c.crime.prison) return c;
  if (newAge >= FORCED_RETIREMENT_AGE) {
    const pension = Math.round(Math.max(12000, job.salary * 0.4));
    notes.push('Forced into retirement');
    return logIt(
      { ...c, job: null, retired: true, flags: { ...c.flags, pension } },
      '🏖️',
      `Reached the mandatory retirement age. Pension: ${fmtMoney(pension)} a year.`,
    );
  }
  const tired = c.stats.energy < 20 ? 4 : 0;
  const performance = clamp(
    job.performance + workPoints * 4 - 6 + (c.stats.smarts - 50) / 25 - tired,
    0,
    100,
  );
  if (performance < 15 && rng.chance(0.5)) {
    notes.push(`Fired from ${job.title}`);
    return logIt({ ...c, job: null }, '📦', `Fired from the job as ${job.title} for poor performance.`);
  }
  if (rng.chance(0.015)) {
    notes.push(`Laid off from ${job.title}`);
    return logIt({ ...c, job: null }, '📦', `Laid off. The company "restructured".`);
  }
  const cola = performance >= 40 ? 1.02 : 1;
  return {
    ...c,
    job: {
      ...job,
      yearsInJob: job.yearsInJob + 1,
      performance: Math.round(performance),
      salary: Math.round((job.salary * cola) / 10) * 10,
    },
  };
}
