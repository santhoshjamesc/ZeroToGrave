import { Rng } from '../utils/rng';
import { CrimeDef, GameContent } from './content';
import { tooYoung } from './ageGates';
import { accept, clamp, fmtMoney, logIt, makePrompt, reject, ReduceResult } from './helpers';
import { Character, EventChoice, GameState } from './types';

export function crimeBlocker(c: Character, crime: CrimeDef): string | null {
  if (c.crime.prison) return 'You are already locked up.';
  if (c.age < crime.minAge) return tooYoung(c.age, crime.minAge, crime.label.toLowerCase());
  return null;
}

/** Chance of getting caught: base risk, police attention, a prior record, minus cunning. */
export function catchChance(c: Character, crime: CrimeDef): number {
  return clamp(
    crime.catchRisk + c.crime.heat / 200 - c.stats.smarts / 400 + (c.crime.record.length > 0 ? 0.08 : 0),
    0.03,
    0.95,
  );
}

export function commitCrime(
  state: GameState,
  content: GameContent,
  crimeId: string,
  rng: Rng,
): ReduceResult {
  const c = state.character;
  const crime = content.crimes.find((x) => x.id === crimeId);
  if (!crime) return reject(state, 'Unknown crime');
  const blocker = crimeBlocker(c, crime);
  if (blocker) return reject(state, blocker);

  const caught = rng.chance(catchChance(c, crime));
  if (!caught) {
    const loot = rng.int(crime.reward[0], crime.reward[1]);
    let next: Character = {
      ...c,
      money: c.money + loot,
      stats: {
        ...c.stats,
        karma: clamp(c.stats.karma + crime.karma, 0, 100),
        happiness: clamp(c.stats.happiness + 2, 0, 100),
      },
      crime: { ...c.crime, heat: clamp(c.crime.heat + crime.heat, 0, 100) },
    };
    next = logIt(next, crime.icon, loot > 0 ? `${crime.winText} (+${fmtMoney(loot)})` : crime.winText);
    return accept({ ...state, character: next });
  }

  // Busted: the court prompt. Sentence length is fixed now; the *verdict* is rolled on resolve.
  const minor = c.age < 18;
  const raw = rng.int(crime.sentence[0], crime.sentence[1]);
  const sentence = minor ? Math.min(2, Math.max(1, Math.ceil(raw / 3))) : raw;
  const record = c.crime.record.length > 0 ? 1 : 0;
  const base = sentence + record;
  const cutBase = {
    karma: { type: 'stat' as const, stat: 'karma' as const, delta: crime.karma },
    heat: { type: 'heat' as const, delta: crime.heat },
  };
  const choices: EventChoice[] = [
    {
      id: 'plead',
      label: `Plead guilty (about ${Math.max(1, Math.ceil(base * 0.6))} yr)`,
      riskHint: 'safe',
      effects: [
        cutBase.karma,
        cutBase.heat,
        { type: 'jail', years: Math.max(1, Math.ceil(base * 0.6)), crime: crime.label },
        { type: 'log', icon: '⚖️', text: `Pleaded guilty to ${crime.label.toLowerCase()}.` },
      ],
    },
    {
      id: 'fight',
      label: 'Fight it in court',
      riskHint: 'gamble',
      effects: [cutBase.karma, cutBase.heat],
      gamble: {
        p: clamp(0.3 + c.stats.smarts / 280, 0.15, 0.65),
        win: [{ type: 'stat', stat: 'happiness', delta: 6 }],
        lose: [{ type: 'jail', years: base + 1, crime: crime.label }],
        winText: 'Acquitted! The jury bought every word.',
        loseText: `Found guilty of ${crime.label.toLowerCase()}. The judge was not amused.`,
      },
    },
  ];
  if (c.money >= 5000) {
    choices.push({
      id: 'bribe',
      label: 'Bribe someone ($5,000)',
      riskHint: 'gamble',
      effects: [{ type: 'money', delta: -5000 }, cutBase.karma, cutBase.heat],
      gamble: {
        p: 0.5,
        win: [{ type: 'stat', stat: 'happiness', delta: 3 }],
        lose: [{ type: 'jail', years: base + 1, crime: `${crime.label} + bribery` }],
        winText: 'The paperwork quietly vanished.',
        loseText: 'The bribe backfired. Bribery added to the charges.',
      },
    });
  }
  return accept({
    ...state,
    prompt: makePrompt(
      'crime.caught',
      '🚨 Busted!',
      `${crime.loseText} ${minor ? 'You are a minor, so juvenile detention is likely.' : `You are facing up to ${base} year${base === 1 ? '' : 's'}.`} How do you plead?`,
      choices,
    ),
  });
}

/** Year-end justice: serve time, get released, cool down. */
export function crimeYear(c: Character, notes: string[]): Character {
  const prison = c.crime.prison;
  if (!prison) {
    const heat = Math.max(0, c.crime.heat - 12);
    return heat === c.crime.heat ? c : { ...c, crime: { ...c.crime, heat } };
  }
  const yearsLeft = prison.yearsLeft - 1;
  const stats = {
    ...c.stats,
    happiness: clamp(c.stats.happiness - 4, 0, 100),
    looks: clamp(c.stats.looks - 0.4, 0, 100),
  };
  if (yearsLeft <= 0) {
    notes.push('Released from prison');
    return logIt(
      { ...c, stats, crime: { ...c.crime, prison: null, heat: 0 } },
      '🔓',
      `Released from prison after serving time for ${prison.crime.toLowerCase()}.`,
    );
  }
  return { ...c, stats, crime: { ...c.crime, prison: { ...prison, yearsLeft } } };
}
