import { Rng } from '../utils/rng';
import { GameContent } from './content';
import { AGE_GATES, tooYoung } from './ageGates';
import { accept, clamp, fmtMoney, logIt, makePrompt, reject, ReduceResult } from './helpers';
import { Character, Education, EducationLevel, EventChoice, GameState } from './types';

/** Where a person of this age would be in the school system, if the game started there. */
export function educationForAge(age: number): Education {
  if (age < 5) return { level: 0, enrolled: null, grades: 60, degrees: [] };
  if (age <= 10) {
    return { level: 0, enrolled: { kind: 'primary', yearsLeft: 11 - age }, grades: 60, degrees: [] };
  }
  if (age <= 17) {
    return { level: 1, enrolled: { kind: 'secondary', yearsLeft: 18 - age }, grades: 60, degrees: [] };
  }
  return { level: 2 as EducationLevel, enrolled: null, grades: 60, degrees: [] };
}

export const EDUCATION_NAMES = [
  'No schooling',
  'Primary school',
  'High school diploma',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate',
] as const;

const POSTGRAD = {
  masters: { years: 2, loan: 30000, level: 4 as EducationLevel, label: "Master's" },
  doctorate: { years: 4, loan: 20000, level: 5 as EducationLevel, label: 'Doctorate' },
} as const;

/** Year-end schooling: grades move with smarts and study effort; graduation; auto-enrolment. */
export function educationYear(
  c: Character,
  studyPoints: number,
  newAge: number,
  _rng: Rng,
  notes: string[],
): Character {
  let edu = c.education;
  let out = c;
  const e = edu.enrolled;
  if (e) {
    const smartsEffect = (c.stats.smarts - 50) / 25;
    const grades = clamp(edu.grades + smartsEffect + studyPoints * 1.6 - 1.4, 0, 100);
    edu = { ...edu, grades: Math.round(grades) };
    const yearsLeft = e.yearsLeft - 1;
    if (e.kind !== 'primary' && e.kind !== 'secondary' && grades < 22) {
      edu = { ...edu, enrolled: null };
      out = logIt({ ...out, education: edu }, '📉', 'Failed out of university. The grades just were not there.');
      notes.push('Expelled for failing grades');
      return out;
    }
    if (yearsLeft > 0) {
      edu = { ...edu, enrolled: { ...e, yearsLeft } };
    } else {
      const done = graduate(edu, e.kind, e.major);
      edu = done.edu;
      out = logIt({ ...out, education: edu }, '🎓', done.text);
      notes.push(done.text);
      return autoEnroll(out, newAge);
    }
  }
  return autoEnroll({ ...out, education: edu }, newAge);
}

function graduate(
  edu: Education,
  kind: NonNullable<Education['enrolled']>['kind'],
  major?: string,
): { edu: Education; text: string } {
  switch (kind) {
    case 'primary':
      return { edu: { ...edu, level: 1, enrolled: null }, text: 'Finished primary school.' };
    case 'secondary':
      return { edu: { ...edu, level: 2, enrolled: null }, text: 'Graduated high school!' };
    case 'university':
      return {
        edu: { ...edu, level: 3, enrolled: null, degrees: [...edu.degrees, major ?? 'general'] },
        text: `Graduated university with a degree in ${major ?? 'general studies'}!`,
      };
    case 'masters':
      return {
        edu: { ...edu, level: 4, enrolled: null, degrees: [...edu.degrees, `${major ?? 'general'} (MA)`] },
        text: "Earned a Master's degree.",
      };
    case 'doctorate':
      return {
        edu: { ...edu, level: 5, enrolled: null, degrees: [...edu.degrees, `${major ?? 'general'} (PhD)`] },
        text: 'Became Doctor. A doctorate, framed and everything.',
      };
  }
}

function autoEnroll(c: Character, newAge: number): Character {
  const edu = c.education;
  if (edu.enrolled) return c;
  if (newAge >= 5 && newAge <= 10 && edu.level === 0) {
    return logIt(
      { ...c, education: { ...edu, enrolled: { kind: 'primary', yearsLeft: 11 - newAge } } },
      '🏫',
      'Started primary school.',
    );
  }
  if (newAge >= 11 && newAge <= 17 && edu.level === 1) {
    return logIt(
      { ...c, education: { ...edu, enrolled: { kind: 'secondary', yearsLeft: 18 - newAge } } },
      '🏫',
      'Started high school.',
    );
  }
  return c;
}

/** Why the player cannot apply for this programme right now, or null. */
export function studyBlocker(c: Character, kind: 'university' | 'masters' | 'doctorate'): string | null {
  if (c.crime.prison) return 'Not from behind bars.';
  if (c.education.enrolled) return 'Already enrolled somewhere.';
  if (kind === 'university') {
    const finishingSchool =
      c.education.enrolled === null && c.education.level >= 2;
    if (c.age < AGE_GATES.university) return tooYoung(c.age, AGE_GATES.university, 'applying to college');
    if (!finishingSchool) return 'Finish high school first.';
    if (c.education.level >= 3) return 'You already have a degree.';
  }
  if (kind === 'masters') {
    if (c.age < AGE_GATES.postgrad) return tooYoung(c.age, AGE_GATES.postgrad, 'postgraduate study');
    if (c.education.level !== 3) return "Needs a bachelor's degree (and no higher).";
    if (c.age > 55) return 'Too late for a master’s.';
  }
  if (kind === 'doctorate') {
    if (c.age < AGE_GATES.postgrad) return tooYoung(c.age, AGE_GATES.postgrad, 'postgraduate study');
    if (c.education.level !== 4) return "Needs a master's degree.";
    if (c.age > 60) return 'Too late for a doctorate.';
  }
  return null;
}

/** Entry chance for a programme: smarts and grades matter, with a bit of luck baked in. */
export function admissionChance(c: Character, minSmarts: number): number {
  return clamp(0.3 + (c.stats.smarts - minSmarts) / 120 + c.education.grades / 300, 0.08, 0.92);
}

/** Opens the programme picker (a prompt) for university / master's / doctorate. */
export function applyToStudy(
  state: GameState,
  content: GameContent,
  kind: 'university' | 'masters' | 'doctorate',
): ReduceResult {
  const c = state.character;
  const blocker = studyBlocker(c, kind);
  if (blocker) return reject(state, blocker);

  if (kind === 'university') {
    const majors = content.majors.filter((m) => c.stats.smarts >= m.minSmarts - 12);
    if (majors.length === 0) return reject(state, 'No programmes would take you yet. Study more.');
    const choices: EventChoice[] = majors.slice(0, 6).map((m) => ({
      id: `major:${m.id}`,
      label: `${m.icon} ${m.name} (${fmtMoney(m.yearlyCost * 4)} in loans)`,
      riskHint: 'gamble' as const,
      effects: [],
      gamble: {
        p: admissionChance(c, m.minSmarts),
        win: [
          { type: 'enroll' as const, enrollment: { kind: 'university' as const, yearsLeft: 4, major: m.name } },
          { type: 'debt' as const, delta: m.yearlyCost * 4 },
        ],
        lose: [{ type: 'stat' as const, stat: 'happiness' as const, delta: -4 }],
        winText: `Accepted into ${m.name}! Student loans: ${fmtMoney(m.yearlyCost * 4)}.`,
        loseText: `Rejected from ${m.name}. Ouch.`,
      },
    }));
    choices.push({ id: 'cancel', label: 'Not now', riskHint: 'safe', effects: [] });
    return accept({
      ...state,
      prompt: makePrompt('study.university', '🎓 Choose your degree', 'Pick a programme. Entry depends on your smarts and grades.', choices),
    });
  }

  const p = POSTGRAD[kind];
  const major = c.education.degrees[c.education.degrees.length - 1]?.replace(/ \(.*\)$/, '') ?? 'general';
  const chance = admissionChance(c, 70);
  return accept({
    ...state,
    prompt: makePrompt(`study.${kind}`, `🎓 ${p.label} programme`, `Apply for a ${p.label} in ${major}? It takes ${p.years} years and about ${fmtMoney(p.loan)} in loans.`, [
      {
        id: 'apply',
        label: 'Apply',
        riskHint: 'gamble',
        effects: [],
        gamble: {
          p: chance,
          win: [
            { type: 'enroll', enrollment: { kind, yearsLeft: p.years, major } },
            { type: 'debt', delta: p.loan },
          ],
          lose: [{ type: 'stat', stat: 'happiness', delta: -4 }],
          winText: `Accepted into the ${p.label} programme!`,
          loseText: 'The admissions committee said no.',
        },
      },
      { id: 'cancel', label: 'Not now', riskHint: 'safe', effects: [] },
    ]),
  });
}

export function dropOut(state: GameState): ReduceResult {
  const e = state.character.education.enrolled;
  if (!e || e.kind === 'primary' || e.kind === 'secondary') return reject(state, 'School is compulsory.');
  const c = logIt(
    { ...state.character, education: { ...state.character.education, enrolled: null }, stats: { ...state.character.stats, happiness: clamp(state.character.stats.happiness - 3, 0, 100) } },
    '🚪',
    'Dropped out. The loans stay, the degree does not.',
  );
  return accept({ ...state, character: c });
}
