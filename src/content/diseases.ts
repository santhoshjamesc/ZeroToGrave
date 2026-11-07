import { DiseaseDef } from '../engine/content';

type D = Omit<DiseaseDef, 'minAge' | 'maxAge'> & { age: [number, number] };
const d = ({ age, ...rest }: D): DiseaseDef => ({ minAge: age[0], maxAge: age[1], ...rest });

/** Lifestyle flags (set by activities/events): smoker, drinker, junkfood, gambler, drugs. */
export const diseases: DiseaseDef[] = [
  // ---- Acute illness ----
  d({ id: 'flu', name: 'Flu', icon: '🤒', kind: 'illness', description: 'Fever, aches, and a week in bed.', age: [0, 130], baseRisk: 0.1, chronic: false, severity: 1, healthPenalty: 1, treatCost: 80, treatSuccess: 0.9, selfCure: 0.75 }),
  d({ id: 'food-poisoning', name: 'Food Poisoning', icon: '🤢', kind: 'illness', description: 'That sushi was a mistake.', age: [3, 130], baseRisk: 0.04, chronic: false, severity: 1, healthPenalty: 1.5, treatCost: 100, treatSuccess: 0.9, selfCure: 0.85 }),
  d({ id: 'pneumonia', name: 'Pneumonia', icon: '🫁', kind: 'illness', description: 'Your lungs are in trouble.', age: [0, 130], baseRisk: 0.012, chronic: false, severity: 3, healthPenalty: 5, treatCost: 3500, treatSuccess: 0.8, selfCure: 0.1, riskFlags: { smoker: 2 } }),
  d({ id: 'appendicitis', name: 'Appendicitis', icon: '🏥', kind: 'illness', description: 'Sharp pain on the right. Needs surgery.', age: [6, 45], baseRisk: 0.004, chronic: false, severity: 3, healthPenalty: 6, treatCost: 6000, treatSuccess: 0.9, selfCure: 0 }),
  d({ id: 'kidney-stones', name: 'Kidney Stones', icon: '🪨', kind: 'illness', description: 'Agony measured in hours.', age: [20, 80], baseRisk: 0.006, chronic: false, severity: 2, healthPenalty: 3, treatCost: 1800, treatSuccess: 0.85, selfCure: 0.35 }),
  d({ id: 'shingles', name: 'Shingles', icon: '🔥', kind: 'illness', description: 'A painful, blistering rash.', age: [50, 110], baseRisk: 0.01, chronic: false, severity: 2, healthPenalty: 2.5, treatCost: 400, treatSuccess: 0.85, selfCure: 0.4 }),
  d({ id: 'covid', name: 'Nasty Virus', icon: '😷', kind: 'illness', description: 'A pandemic-grade virus knocks you flat.', age: [0, 130], baseRisk: 0.03, chronic: false, severity: 2, healthPenalty: 3, treatCost: 600, treatSuccess: 0.85, selfCure: 0.6 }),

  // ---- Injuries ----
  d({ id: 'broken-leg', name: 'Broken Leg', icon: '🦴', kind: 'injury', description: 'A cast, crutches, and sympathy.', age: [4, 130], baseRisk: 0.012, chronic: false, severity: 2, healthPenalty: 2, treatCost: 2200, treatSuccess: 0.92, selfCure: 0.5 }),
  d({ id: 'concussion', name: 'Concussion', icon: '💫', kind: 'injury', description: 'The world is spinning gently.', age: [5, 130], baseRisk: 0.008, chronic: false, severity: 2, healthPenalty: 2, treatCost: 900, treatSuccess: 0.9, selfCure: 0.55 }),
  d({ id: 'back-injury', name: 'Back Injury', icon: '🪑', kind: 'injury', description: 'You lifted wrong. Once.', age: [20, 130], baseRisk: 0.012, chronic: false, severity: 1, healthPenalty: 1.5, treatCost: 700, treatSuccess: 0.8, selfCure: 0.4 }),

  // ---- Chronic ----
  d({ id: 'asthma', name: 'Asthma', icon: '😮‍💨', kind: 'illness', description: 'Breathing takes planning.', age: [2, 40], baseRisk: 0.005, chronic: true, severity: 1, healthPenalty: 0.8, treatCost: 400, treatSuccess: 0.9, riskFlags: { smoker: 2 } }),
  d({ id: 'diabetes', name: 'Type 2 Diabetes', icon: '🩸', kind: 'illness', description: 'Blood sugar needs managing for life.', age: [30, 130], baseRisk: 0.009, chronic: true, severity: 2, healthPenalty: 2, treatCost: 1500, treatSuccess: 0.88, riskFlags: { junkfood: 2.2 } }),
  d({ id: 'hypertension', name: 'High Blood Pressure', icon: '💢', kind: 'illness', description: 'The silent one.', age: [35, 130], baseRisk: 0.014, chronic: true, severity: 2, healthPenalty: 1.5, treatCost: 600, treatSuccess: 0.9, riskFlags: { junkfood: 1.6, smoker: 1.5, drinker: 1.4 } }),
  d({ id: 'heart-disease', name: 'Heart Disease', icon: '🫀', kind: 'illness', description: 'Your heart is struggling.', age: [45, 130], baseRisk: 0.011, chronic: true, severity: 3, healthPenalty: 4, treatCost: 7000, treatSuccess: 0.75, riskFlags: { smoker: 2.2, junkfood: 1.8 } }),
  d({ id: 'cancer', name: 'Cancer', icon: '🎗️', kind: 'illness', description: 'The word nobody wants to hear.', age: [30, 130], baseRisk: 0.007, chronic: true, severity: 4, healthPenalty: 5, treatCost: 30000, treatSuccess: 0.6, riskFlags: { smoker: 2.8, drinker: 1.4 } }),
  d({ id: 'copd', name: 'COPD', icon: '🌫️', kind: 'illness', description: 'Years of smoke come due.', age: [45, 130], baseRisk: 0.004, chronic: true, severity: 3, healthPenalty: 3.5, treatCost: 4000, treatSuccess: 0.7, riskFlags: { smoker: 6 } }),
  d({ id: 'arthritis', name: 'Arthritis', icon: '🖐️', kind: 'illness', description: 'Every joint has an opinion.', age: [50, 130], baseRisk: 0.02, chronic: true, severity: 1, healthPenalty: 1, treatCost: 800, treatSuccess: 0.85 }),
  d({ id: 'alzheimers', name: "Alzheimer's", icon: '🧩', kind: 'illness', description: 'Memories are slipping away.', age: [70, 130], baseRisk: 0.02, chronic: true, severity: 3, healthPenalty: 3, treatCost: 9000, treatSuccess: 0.55 }),
  d({ id: 'cataracts', name: 'Cataracts', icon: '👓', kind: 'illness', description: 'The world looks hazy.', age: [60, 130], baseRisk: 0.03, chronic: true, severity: 1, healthPenalty: 0.5, treatCost: 3000, treatSuccess: 0.95 }),

  // ---- Mental health ----
  d({ id: 'anxiety', name: 'Anxiety', icon: '😰', kind: 'mental', description: 'Your mind will not stop racing.', age: [10, 130], baseRisk: 0.02, chronic: true, severity: 1, healthPenalty: 0.6, treatCost: 700, treatSuccess: 0.8 }),
  d({ id: 'depression', name: 'Depression', icon: '🌧️', kind: 'mental', description: 'Everything feels grey.', age: [12, 130], baseRisk: 0.018, chronic: true, severity: 2, healthPenalty: 1.2, treatCost: 1000, treatSuccess: 0.75 }),
  d({ id: 'insomnia', name: 'Insomnia', icon: '🌙', kind: 'mental', description: 'Staring at the ceiling, again.', age: [15, 130], baseRisk: 0.02, chronic: false, severity: 1, healthPenalty: 0.8, treatCost: 300, treatSuccess: 0.8, selfCure: 0.35 }),

  // ---- Addictions (lifestyle-driven) ----
  d({ id: 'nicotine', name: 'Nicotine Addiction', icon: '🚬', kind: 'addiction', description: 'One more cigarette. Always one more.', age: [10, 130], baseRisk: 0.15, chronic: true, severity: 1, healthPenalty: 1, treatCost: 600, treatSuccess: 0.6, requiresFlag: 'smoker' }),
  d({ id: 'alcoholism', name: 'Alcohol Dependence', icon: '🍺', kind: 'addiction', description: 'It stopped being just a drink.', age: [16, 130], baseRisk: 0.05, chronic: true, severity: 2, healthPenalty: 2.5, treatCost: 3500, treatSuccess: 0.55, requiresFlag: 'drinker' }),
  d({ id: 'gambling-addiction', name: 'Gambling Addiction', icon: '🎰', kind: 'addiction', description: 'This time you will win it back.', age: [18, 130], baseRisk: 0.06, chronic: true, severity: 2, healthPenalty: 1, treatCost: 2000, treatSuccess: 0.55, requiresFlag: 'gambler' }),
  d({ id: 'drug-addiction', name: 'Drug Addiction', icon: '💊', kind: 'addiction', description: 'You need it now, not just want it.', age: [13, 130], baseRisk: 0.12, chronic: true, severity: 3, healthPenalty: 4, treatCost: 8000, treatSuccess: 0.5, requiresFlag: 'drugs' }),
];
