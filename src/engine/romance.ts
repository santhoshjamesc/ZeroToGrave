import { Rng } from '../utils/rng';
import { GameContent } from './content';
import { FocusAllocation, Gender, Relationship } from './types';
import { effectiveUnits } from './focus';
import { accept, clamp, fmtMoney, logIt, makePrompt, reject, ReduceResult } from './helpers';
import { generateNpc } from './identity';
import { Character, GameState } from './types';

export type Interaction =
  | 'time'
  | 'talk'
  | 'gift'
  | 'date'
  | 'propose'
  | 'wedding'
  | 'baby'
  | 'breakup'
  | 'divorce'
  | 'rekindle';

export interface InteractionOption {
  id: Interaction;
  label: string;
  icon: string;
  cost?: number;
  /** Set when the option exists but cannot be used right now. */
  disabled?: string;
}

const isPartner = (r: Relationship): boolean => r.kind === 'partner';
export const currentPartner = (c: Character): Relationship | undefined =>
  c.relationships.find((r) => r.kind === 'partner' && !r.deceased);

/** What the player may do with this person right now (UI renders this list). */
export function interactionsFor(c: Character, r: Relationship): InteractionOption[] {
  if (r.deceased) return [];
  const out: InteractionOption[] = [];
  const adult = c.age >= 18;
  if (r.kind === 'ex') {
    out.push({ id: 'talk', label: 'Talk it out', icon: '💬' });
    out.push({ id: 'rekindle', label: 'Rekindle', icon: '🔥', disabled: currentPartner(c) ? 'You are with someone' : undefined });
    return out;
  }
  out.push({ id: 'time', label: r.kind === 'parent' ? 'Visit' : 'Spend time', icon: '🤝' });
  out.push({ id: 'talk', label: 'Deep talk', icon: '💬' });
  out.push({ id: 'gift', label: 'Give a gift', icon: '🎁', cost: 100 });
  if (isPartner(r)) {
    out.push({ id: 'date', label: 'Date night', icon: '🍷', cost: 60 });
    if (r.status === 'dating') {
      out.push({
        id: 'propose',
        label: 'Propose',
        icon: '💍',
        disabled: !adult ? 'Too young' : r.closeness < 65 ? 'Not close enough yet' : undefined,
      });
      out.push({ id: 'breakup', label: 'Break up', icon: '💔' });
    }
    if (r.status === 'engaged') {
      out.push({ id: 'wedding', label: 'Hold the wedding', icon: '👰', cost: 5000 });
      out.push({ id: 'breakup', label: 'Call off engagement', icon: '💔' });
    }
    if (r.status === 'married') out.push({ id: 'divorce', label: 'Divorce', icon: '⚖️', cost: 3000 });
    if (adult && r.status !== undefined && c.age <= 48 && (r.age ?? 30) <= 48) {
      out.push({ id: 'baby', label: 'Try for a baby', icon: '👶' });
    }
  }
  return out;
}

const KID_CAP = 6;

function kidsOf(c: Character): number {
  return c.relationships.filter((r) => r.kind === 'child' && !r.deceased).length;
}

function newChild(c: Character, state: GameState, content: GameContent, rng: Rng, partner: Relationship | undefined, adopted: boolean): Relationship {
  const gender: Gender = rng.pick<Gender>(['male', 'female', 'nonbinary']);
  const npc = generateNpc(rng, content.identity, {
    countryId: c.identity.countryId,
    gender,
    surname: c.identity.surname,
    skinTone: rng.chance(0.5) ? c.identity.appearance.skinTone : (partner?.look?.skinTone ?? c.identity.appearance.skinTone),
  });
  return {
    id: `kid-${state.seed}-${c.relationships.length}-${c.age}`,
    kind: 'child',
    name: npc.name,
    age: adopted ? rng.int(1, 5) : 0,
    gender,
    look: npc.look,
    closeness: 85,
    blurb: adopted ? 'Adopted into your family.' : npc.blurb,
  };
}

export function relate(
  state: GameState,
  content: GameContent,
  personId: string,
  interaction: Interaction,
  rng: Rng,
): ReduceResult {
  const c = state.character;
  const r = c.relationships.find((x) => x.id === personId);
  if (!r) return reject(state, 'Unknown person');
  const option = interactionsFor(c, r).find((o) => o.id === interaction);
  if (!option) return reject(state, 'Not possible right now.');
  if (option.disabled) return reject(state, option.disabled);
  if (c.crime.prison && interaction !== 'talk') return reject(state, 'Not from prison.');
  if (option.cost && c.money < option.cost && c.age >= 18) return reject(state, `Costs ${fmtMoney(option.cost)}.`);

  const first = r.name.split(' ')[0] ?? r.name;
  const bump = (id: string, d: number, patch: Partial<Relationship> = {}): Relationship[] =>
    c.relationships.map((x) => (x.id === id ? { ...x, closeness: clamp(x.closeness + d, 0, 100), ...patch } : x));
  const pay = option.cost && c.age >= 18 ? option.cost : 0;
  const base = { ...c, money: c.money - pay };
  const mood = (d: number) => ({ ...base.stats, happiness: clamp(base.stats.happiness + d, 0, 100) });

  switch (interaction) {
    case 'time':
      return accept({
        ...state,
        character: logIt({ ...base, relationships: bump(r.id, 9), stats: mood(2) }, '🤝', `Spent quality time with ${first}.`),
      });
    case 'talk': {
      const warmer = r.kind === 'ex' ? 4 : 7;
      return accept({
        ...state,
        character: logIt({ ...base, relationships: bump(r.id, warmer), stats: mood(1) }, '💬', `Had a long, honest talk with ${first}.`),
      });
    }
    case 'gift':
      return accept({
        ...state,
        character: logIt({ ...base, relationships: bump(r.id, 11), stats: { ...mood(1), karma: clamp(base.stats.karma + 1, 0, 100) } }, '🎁', `Gave ${first} a thoughtful gift.`),
      });
    case 'date':
      return accept({
        ...state,
        character: logIt({ ...base, relationships: bump(r.id, 12), stats: mood(4) }, '🍷', `Date night with ${first}.`),
      });
    case 'propose': {
      const p = clamp(r.closeness / 110, 0.2, 0.9);
      if (rng.chance(p)) {
        return accept({
          ...state,
          character: logIt(
            { ...base, relationships: bump(r.id, 10, { status: 'engaged' }), stats: mood(10) },
            '💍',
            `Proposed to ${first}. They said YES!`,
          ),
        });
      }
      return accept({
        ...state,
        character: logIt({ ...base, relationships: bump(r.id, -25), stats: mood(-8) }, '💔', `Proposed to ${first}. They said they need time.`),
      });
    }
    case 'wedding':
      return accept({
        ...state,
        character: logIt(
          { ...base, relationships: bump(r.id, 15, { status: 'married' }), stats: mood(12) },
          '👰',
          `Married ${first} in a beautiful ceremony${pay ? ` (${fmtMoney(pay)})` : ''}.`,
        ),
      });
    case 'baby': {
      if (kidsOf(c) >= KID_CAP) return reject(state, 'Your house is full of kids already.');
      if (rng.chance(0.55)) {
        const kid = newChild(c, state, content, rng, r, false);
        return accept({
          ...state,
          character: logIt(
            { ...base, relationships: [...bump(r.id, 6), kid], stats: mood(10) },
            '👶',
            `${first} and you welcomed a baby: ${kid.name}!`,
          ),
        });
      }
      return accept({ ...state, character: logIt({ ...base, relationships: bump(r.id, 3) }, '🍼', 'No luck on the baby front this year.') });
    }
    case 'breakup':
      return accept({
        ...state,
        character: logIt(
          { ...base, relationships: bump(r.id, -999, { kind: 'ex', status: 'exes', closeness: 15 }), stats: mood(-6) },
          '💔',
          `Ended things with ${first}.`,
        ),
      });
    case 'divorce': {
      const settlement = Math.round(base.money / 2);
      return accept({
        ...state,
        character: logIt(
          {
            ...base,
            money: base.money - settlement,
            relationships: c.relationships.map((x) => (x.id === r.id ? { ...x, kind: 'ex', status: 'divorced', closeness: 10 } : x)),
            stats: mood(-9),
          },
          '⚖️',
          `Divorced ${first}. The lawyers took ${fmtMoney(3000)}, the settlement ${fmtMoney(settlement)}.`,
        ),
      });
    }
    case 'rekindle': {
      const p = clamp(r.closeness / 120 + 0.1, 0.1, 0.6);
      if (rng.chance(p)) {
        return accept({
          ...state,
          character: logIt(
            { ...base, relationships: bump(r.id, 25, { kind: 'partner', status: 'dating' }), stats: mood(7) },
            '🔥',
            `Got back together with ${first}.`,
          ),
        });
      }
      return accept({ ...state, character: logIt({ ...base, relationships: bump(r.id, -10), stats: mood(-4) }, '🥀', `${first} wants to stay in the past.`) });
    }
  }
}

/** Candidate prompt: someone new to ask out (love) or befriend (friend). */
export function meetPerson(
  state: GameState,
  content: GameContent,
  intent: 'love' | 'friend',
  rng: Rng,
): ReduceResult {
  const c = state.character;
  if (c.age < 13) return reject(state, 'Too young to be looking for friends this way.');
  if (c.crime.prison) return reject(state, 'Not from prison.');
  if (intent === 'love') {
    if (c.age < 14) return reject(state, 'Too young for dating.');
    if (currentPartner(c)) return reject(state, `You are already with ${currentPartner(c)?.name.split(' ')[0]}.`);
  }
  const spread = c.age < 20 ? 2 : 8;
  const age = intent === 'love' ? clamp(c.age + rng.int(-spread, spread), c.age < 18 ? 14 : 18, 90) : clamp(c.age + rng.int(-6, 6), 8, 95);
  const npc = generateNpc(rng, content.identity, { countryId: c.identity.countryId });
  const id = `npc-${state.seed}-${c.age}-${c.relationships.length}-${rng.int(0, 9999)}`;
  const person: Relationship = {
    id,
    kind: intent === 'love' ? 'partner' : 'friend',
    status: intent === 'love' ? 'dating' : undefined,
    name: npc.name,
    age,
    gender: npc.gender,
    look: npc.look,
    closeness: intent === 'love' ? 45 : 40,
    blurb: npc.blurb,
  };
  const first = npc.name.split(' ')[0] ?? npc.name;
  if (intent === 'friend') {
    return accept({
      ...state,
      prompt: makePrompt('meet.friend', '🤝 New person', `You meet ${npc.name} (${age}). ${npc.blurb}`, [
        {
          id: 'befriend',
          label: 'Befriend them',
          riskHint: 'safe',
          effects: [
            { type: 'addPerson', person: person },
            { type: 'stat', stat: 'happiness', delta: 3 },
            { type: 'log', icon: '🤝', text: `Made a new friend: ${npc.name}.` },
          ],
        },
        { id: 'pass', label: 'Smile and move on', riskHint: 'safe', effects: [] },
      ]),
    });
  }
  const p = clamp(0.28 + c.stats.looks / 250 + c.stats.happiness / 500 + c.stats.karma / 700, 0.12, 0.75);
  return accept({
    ...state,
    prompt: makePrompt('meet.love', '💘 Someone catches your eye', `${npc.name}, ${age}. ${npc.blurb}`, [
      {
        id: 'ask',
        label: `Ask ${first} out`,
        riskHint: 'gamble',
        effects: [],
        gamble: {
          p,
          win: [
            { type: 'addPerson', person },
            { type: 'stat', stat: 'happiness', delta: 8 },
          ],
          lose: [{ type: 'stat', stat: 'happiness', delta: -4 }],
          winText: `${npc.name} said yes! You are officially dating.`,
          loseText: `${npc.name} politely turned you down.`,
        },
      },
      {
        id: 'friends',
        label: 'Start as friends',
        riskHint: 'safe',
        effects: [
          { type: 'addPerson', person: { ...person, kind: 'friend', status: undefined } },
          { type: 'log', icon: '🤝', text: `Became friends with ${npc.name}.` },
        ],
      },
      { id: 'walk', label: 'Walk away', riskHint: 'safe', effects: [] },
    ]),
  });
}

const npcDeathChance = (age: number): number => (age < 45 ? 0.0008 : 0.00006 * Math.exp(0.085 * age));

/** Year-end people simulation: drift, break-ups, new friends, deaths, inheritance. */
export function relationshipsYear(
  c: Character,
  alloc: FocusAllocation,
  content: GameContent,
  rng: Rng,
  notes: string[],
): Character {
  const familyBoost = effectiveUnits(alloc.family) * 3;
  const socialBoost = effectiveUnits(alloc.social) * 3.5;
  let out = c;
  let inheritance = 0;
  const people: Relationship[] = [];
  for (const r of c.relationships) {
    if (r.deceased) {
      people.push(r);
      continue;
    }
    // This runs before the age tick, so the person is turning age + 1.
    const age = r.age ?? 0;
    if (r.age !== undefined && rng.chance(npcDeathChance(age + 1))) {
      people.push({ ...r, deceased: true });
      notes.push(`${r.name} passed away`);
      out = logIt(out, '🕯️', `${r.name} (${r.kind === 'parent' ? (r.gender === 'female' ? 'your mother' : 'your father') : r.kind}) passed away at ${age + 1}.`);
      out = { ...out, stats: { ...out.stats, happiness: clamp(out.stats.happiness - (r.closeness > 60 ? 14 : 7), 0, 100) } };
      if (r.kind === 'parent' && age > 55) inheritance += rng.int(5, 80) * 1000;
      continue;
    }
    let d = -2.5;
    if (r.kind === 'parent' || r.kind === 'sibling' || r.kind === 'child') d += familyBoost;
    if (r.kind === 'friend' || r.kind === 'coworker') d += socialBoost;
    if (r.kind === 'partner') d += familyBoost * 0.6 + socialBoost * 0.6 + (r.status === 'married' ? 1 : 0);
    if (r.kind === 'ex') d = -3;
    if (r.kind === 'child' && (r.age ?? 0) < 12) d += 1.5; // little ones need little effort
    let closeness = clamp(r.closeness + d + rng.int(-1, 1), 0, 100);
    let next: Relationship = { ...r, closeness };
    if (r.kind === 'partner' && closeness < 12) {
      if (r.status === 'married') {
        const lost = Math.round(out.money / 2);
        out = logIt({ ...out, money: out.money - lost }, '⚖️', `${r.name.split(' ')[0]} filed for divorce. Half of everything went with them.`);
        out = { ...out, stats: { ...out.stats, happiness: clamp(out.stats.happiness - 10, 0, 100) } };
        notes.push('Divorce');
        next = { ...next, kind: 'ex', status: 'divorced', closeness: 8 };
      } else {
        out = logIt(out, '💔', `${r.name.split(' ')[0]} broke up with you. Neglect will do that.`);
        out = { ...out, stats: { ...out.stats, happiness: clamp(out.stats.happiness - 6, 0, 100) } };
        notes.push('Break-up');
        next = { ...next, kind: 'ex', status: 'exes', closeness: 8 };
      }
      closeness = next.closeness;
    }
    people.push(next);
  }
  out = { ...out, relationships: people, money: out.money + inheritance };
  if (inheritance > 0) out = logIt(out, '💰', `Inherited ${fmtMoney(inheritance)}.`);

  // New friends: at school/work or when going out.
  const friends = people.filter((r) => r.kind === 'friend' && !r.deceased).length;
  const social = alloc.social > 0 || out.education.enrolled !== null || out.job !== null;
  if (social && friends < 12 && rng.chance(0.3 + alloc.social * 0.08)) {
    const npc = generateNpc(rng, content.identity, { countryId: out.identity.countryId });
    const where = out.education.enrolled ? 'at school' : out.job ? 'at work' : 'around town';
    const friend: Relationship = {
      id: `friend-${out.age}-${people.length}-${rng.int(0, 9999)}`,
      kind: 'friend',
      name: npc.name,
      age: clamp(out.age + rng.int(-2, 2), 4, 95),
      gender: npc.gender,
      look: npc.look,
      closeness: 38,
      blurb: npc.blurb,
    };
    out = logIt({ ...out, relationships: [...out.relationships, friend] }, '🤝', `Made a friend ${where}: ${npc.name}.`);
  }
  return out;
}
