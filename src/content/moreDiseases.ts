import { DiseaseDef } from '../engine/content';

type D = Omit<DiseaseDef, 'minAge' | 'maxAge'> & { age: [number, number] };
const d = ({ age, ...rest }: D): DiseaseDef => ({ minAge: age[0], maxAge: age[1], ...rest });

/** Lifestyle flags (set by activities/events): smoker, drinker, junkfood, gambler, drugs. */
export const moreDiseases: DiseaseDef[] = [
  // ---- Childhood ----
  d({ id: 'ear-infection', name: 'Ear Infection', icon: '👂', kind: 'illness', description: 'Tugging at your ear and cranky all night.', age: [0, 10], baseRisk: 0.08, chronic: false, severity: 1, healthPenalty: 1, treatCost: 90, treatSuccess: 0.92, selfCure: 0.7 }),
  d({ id: 'chickenpox', name: 'Chickenpox', icon: '🔴', kind: 'illness', description: 'Itchy spots everywhere. Do not scratch.', age: [1, 12], baseRisk: 0.07, chronic: false, severity: 1, healthPenalty: 1.2, treatCost: 70, treatSuccess: 0.9, selfCure: 0.85 }),
  d({ id: 'croup', name: 'Croup', icon: '🐕', kind: 'illness', description: 'A barking cough in the middle of the night.', age: [0, 5], baseRisk: 0.05, chronic: false, severity: 1, healthPenalty: 1.5, treatCost: 150, treatSuccess: 0.93, selfCure: 0.7 }),
  d({ id: 'broken-wrist', name: 'Broken Wrist', icon: '🦴', kind: 'injury', description: 'Fell off something you were told not to climb.', age: [4, 130], baseRisk: 0.015, chronic: false, severity: 2, healthPenalty: 1.5, treatCost: 1200, treatSuccess: 0.93, selfCure: 0.5 }),
  d({ id: 'asthma-flare', name: 'Asthma Flare-up', icon: '🌬️', kind: 'illness', description: 'Your chest is tight and the inhaler is far away.', age: [3, 25], baseRisk: 0.015, chronic: false, severity: 2, healthPenalty: 2, treatCost: 350, treatSuccess: 0.9, selfCure: 0.4, riskFlags: { smoker: 2.5 } }),
  d({ id: 'tonsillitis', name: 'Tonsillitis', icon: '🗣️', kind: 'illness', description: 'Swallowing feels like gravel.', age: [3, 30], baseRisk: 0.045, chronic: false, severity: 1, healthPenalty: 1, treatCost: 140, treatSuccess: 0.9, selfCure: 0.6 }),
  d({ id: 'sprained-ankle', name: 'Sprained Ankle', icon: '🦶', kind: 'injury', description: 'Awkward landing, instant regret.', age: [5, 80], baseRisk: 0.03, chronic: false, severity: 1, healthPenalty: 0.8, treatCost: 250, treatSuccess: 0.9, selfCure: 0.7 }),

  // ---- Adult ----
  d({ id: 'migraines', name: 'Migraines', icon: '⚡', kind: 'illness', description: 'Lights hurt. Sounds hurt. Everything hurts.', age: [14, 130], baseRisk: 0.014, chronic: true, severity: 1, healthPenalty: 0.9, treatCost: 500, treatSuccess: 0.75, riskFlags: { drinker: 1.3 } }),
  d({ id: 'chronic-back-pain', name: 'Chronic Back Pain', icon: '🧍', kind: 'illness', description: 'Your lower back has opinions about every chair.', age: [28, 130], baseRisk: 0.016, chronic: true, severity: 1, healthPenalty: 1.1, treatCost: 900, treatSuccess: 0.7, riskFlags: { junkfood: 1.2 } }),
  d({ id: 'burnout', name: 'Burnout', icon: '🕯️', kind: 'mental', description: 'You are running on fumes and spite.', age: [20, 70], baseRisk: 0.02, chronic: false, severity: 2, healthPenalty: 1.5, treatCost: 600, treatSuccess: 0.8, selfCure: 0.3 }),
  d({ id: 'panic-attacks', name: 'Panic Attacks', icon: '💓', kind: 'mental', description: 'Your heart races for no reason you can name.', age: [12, 130], baseRisk: 0.012, chronic: true, severity: 1, healthPenalty: 0.7, treatCost: 650, treatSuccess: 0.8, riskFlags: { drugs: 2, gambler: 1.4 } }),
  d({ id: 'gastric-reflux', name: 'Acid Reflux', icon: '🔥', kind: 'illness', description: 'Spicy food now fights back.', age: [25, 130], baseRisk: 0.02, chronic: true, severity: 1, healthPenalty: 0.6, treatCost: 300, treatSuccess: 0.85, riskFlags: { junkfood: 1.8, drinker: 1.3, smoker: 1.3 } }),
  d({ id: 'fatty-liver', name: 'Fatty Liver', icon: '🍔', kind: 'illness', description: 'Years of habits are catching up with you.', age: [30, 130], baseRisk: 0.008, chronic: true, severity: 2, healthPenalty: 1.8, treatCost: 1400, treatSuccess: 0.75, riskFlags: { drinker: 2.5, junkfood: 2 } }),

  // ---- Senior ----
  d({ id: 'hearing-loss', name: 'Hearing Loss', icon: '🦻', kind: 'illness', description: 'Everyone seems to mumble these days.', age: [55, 130], baseRisk: 0.035, chronic: true, severity: 1, healthPenalty: 0.4, treatCost: 1800, treatSuccess: 0.9 }),
  d({ id: 'osteoporosis', name: 'Osteoporosis', icon: '🦴', kind: 'illness', description: 'Your bones are thinner than they used to be.', age: [55, 130], baseRisk: 0.022, chronic: true, severity: 2, healthPenalty: 1.2, treatCost: 1100, treatSuccess: 0.8, riskFlags: { smoker: 1.6, drinker: 1.3 } }),
  d({ id: 'hip-fracture', name: 'Broken Hip', icon: '🩼', kind: 'injury', description: 'A fall that changes everything.', age: [65, 130], baseRisk: 0.012, chronic: false, severity: 3, healthPenalty: 4, treatCost: 9000, treatSuccess: 0.8, selfCure: 0.05 }),
  d({ id: 'mild-memory-loss', name: 'Memory Fog', icon: '🌫️', kind: 'illness', description: 'Where did you put the keys? Wait, what keys?', age: [65, 130], baseRisk: 0.03, chronic: true, severity: 1, healthPenalty: 0.8, treatCost: 1200, treatSuccess: 0.6 }),
];
