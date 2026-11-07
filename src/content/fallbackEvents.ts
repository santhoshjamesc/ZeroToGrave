import { EventDef } from '../engine/types';

/** Generic, always-eligible decisions. Guarantees every year has >= 1 meaningful choice. */
export const fallbackEvents: EventDef[] = [
  {
    id: 'fb.how-to-spend-the-year',
    title: 'A Quiet Year',
    text: 'Nothing dramatic is on the horizon. How do you approach the year ahead?',
    minAge: 0,
    maxAge: 130,
    weight: 1,
    mandatory: true,
    choices: [
      { id: 'routine', label: 'Stick to routine', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 1 }] },
      { id: 'adventure', label: 'Try something new', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }, { type: 'stat', stat: 'health', delta: -1 }, { type: 'flag', key: 'adventurous', value: true }] },
      { id: 'reflect', label: 'Reflect and plan', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 1 }, { type: 'stat', stat: 'karma', delta: 1 }] },
    ],
  },
  {
    id: 'fb.helping-hand',
    title: 'A Helping Hand',
    text: 'Someone nearby could use your help, but it would cost you time.',
    minAge: 5,
    maxAge: 130,
    weight: 1,
    mandatory: true,
    choices: [
      { id: 'help', label: 'Help out', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 3 }, { type: 'stat', stat: 'energy', delta: -3 }, { type: 'flag', key: 'helpful', value: true }] },
      { id: 'walk-by', label: 'Walk on by', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: -2 }] },
    ],
  },
];
