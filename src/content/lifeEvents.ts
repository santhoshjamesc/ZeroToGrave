import { EventDef } from '../engine/types';

/** Age-banded life events. Add more here; weights bias which come up. */
export const lifeEvents: EventDef[] = [
  {
    id: 'life.baby.first-word', title: 'First Words', text: 'Everyone is watching you babble. What comes out?',
    minAge: 1, maxAge: 3, weight: 3, mandatory: false,
    choices: [
      { id: 'mama', label: '"Mama!"', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }] },
      { id: 'dada', label: '"Dada!"', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }] },
      { id: 'dog', label: '"Doggy!"', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 2 }] },
    ],
  },
  {
    id: 'life.toddler.tantrum', title: 'Supermarket Meltdown', text: 'You want the shiny cereal box. Mum says no.',
    minAge: 2, maxAge: 6, weight: 3, mandatory: false,
    choices: [
      { id: 'scream', label: 'Scream the shop down', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }, { type: 'stat', stat: 'karma', delta: -2 }] },
      { id: 'sulk', label: 'Sulk quietly', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: -1 }] },
      { id: 'ask', label: 'Ask nicely', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 2 }, { type: 'stat', stat: 'smarts', delta: 1 }] },
    ],
  },
  {
    id: 'life.child.bully', title: 'The Playground Bully', text: 'A bigger kid takes your lunch.',
    minAge: 6, maxAge: 12, weight: 4, mandatory: false,
    choices: [
      { id: 'fight', label: 'Fight back', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'health', delta: -4 }, { type: 'stat', stat: 'karma', delta: -1 }, { type: 'stat', stat: 'happiness', delta: 2 }] },
      { id: 'tell', label: 'Tell a teacher', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 1 }, { type: 'stat', stat: 'happiness', delta: -1 }] },
      { id: 'friend', label: 'Try to befriend them', riskHint: 'risky', effects: [{ type: 'stat', stat: 'karma', delta: 3 }, { type: 'stat', stat: 'happiness', delta: 2 }] },
    ],
  },
  {
    id: 'life.child.pet', title: 'A Stray Puppy', text: 'A scruffy puppy follows you home.',
    minAge: 5, maxAge: 12, weight: 3, mandatory: false,
    choices: [
      { id: 'keep', label: 'Beg to keep it', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 6 }, { type: 'stat', stat: 'karma', delta: 2 }] },
      { id: 'shelter', label: 'Take it to the shelter', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 3 }] },
      { id: 'ignore', label: 'Shoo it away', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: -3 }, { type: 'stat', stat: 'happiness', delta: -2 }] },
    ],
  },
  {
    id: 'life.child.exam', title: 'Big Spelling Test', text: 'The class spelling bee is tomorrow.',
    minAge: 6, maxAge: 12, weight: 3, mandatory: false,
    choices: [
      { id: 'study', label: 'Cram all night', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 3 }, { type: 'stat', stat: 'energy', delta: -5 }] },
      { id: 'wing', label: 'Wing it', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'smarts', delta: -1 }, { type: 'stat', stat: 'happiness', delta: 2 }] },
      { id: 'cheat', label: "Peek at a friend's paper", riskHint: 'risky', effects: [{ type: 'stat', stat: 'karma', delta: -4 }, { type: 'stat', stat: 'smarts', delta: 1 }] },
    ],
  },
  {
    id: 'life.teen.party', title: 'The Party', text: 'Friends invite you to a party. Parents said be home by ten.',
    minAge: 13, maxAge: 18, weight: 4, mandatory: false,
    choices: [
      { id: 'go', label: 'Sneak out', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 5 }, { type: 'stat', stat: 'karma', delta: -2 }, { type: 'stat', stat: 'health', delta: -2 }] },
      { id: 'home', label: 'Stay in', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 2 }, { type: 'stat', stat: 'happiness', delta: -2 }] },
      { id: 'host', label: 'Convince your parents to let you go', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 2 }, { type: 'stat', stat: 'happiness', delta: 3 }] },
    ],
  },
  {
    id: 'life.teen.crush', title: 'Crush Alert', text: 'The person you like smiles at you in the hallway.',
    minAge: 13, maxAge: 18, weight: 4, mandatory: false,
    choices: [
      { id: 'talk', label: 'Say hello', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'looks', delta: 1 }] },
      { id: 'note', label: 'Pass a note', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 2 }] },
      { id: 'hide', label: 'Hide in the bathroom', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: -2 }] },
    ],
  },
  {
    id: 'life.teen.exam', title: 'Exam Season', text: 'Finals loom. Your friends want to hang out.',
    minAge: 13, maxAge: 18, weight: 4, mandatory: false,
    choices: [
      { id: 'study', label: 'Hit the books', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 4 }, { type: 'stat', stat: 'happiness', delta: -2 }, { type: 'stat', stat: 'energy', delta: -6 }] },
      { id: 'hang', label: 'Hang out', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'smarts', delta: -2 }] },
      { id: 'balance', label: 'Balance both', riskHint: 'risky', effects: [{ type: 'stat', stat: 'smarts', delta: 2 }, { type: 'stat', stat: 'happiness', delta: 1 }, { type: 'stat', stat: 'energy', delta: -4 }] },
    ],
  },
  {
    id: 'life.teen.social', title: 'Viral Moment', text: 'A video of you goes viral for all the wrong reasons.',
    minAge: 14, maxAge: 19, weight: 2, mandatory: false,
    choices: [
      { id: 'own', label: 'Own it and laugh', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }, { type: 'stat', stat: 'looks', delta: 1 }] },
      { id: 'hide', label: 'Delete everything', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: -3 }] },
      { id: 'clap', label: 'Make a witty reply', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'happiness', delta: 5 }, { type: 'stat', stat: 'karma', delta: -1 }] },
    ],
  },
  {
    id: 'life.adult.job', title: 'Job Offer', text: 'A recruiter offers you a role with better pay but longer hours.',
    minAge: 20, maxAge: 60, weight: 4, mandatory: false,
    choices: [
      { id: 'take', label: 'Take the job', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 2 }, { type: 'stat', stat: 'energy', delta: -6 }, { type: 'money', delta: 8000 }] },
      { id: 'stay', label: 'Stay put', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 1 }] },
      { id: 'negotiate', label: 'Negotiate', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'smarts', delta: 1 }, { type: 'money', delta: 4000 }] },
    ],
  },
  {
    id: 'life.adult.love', title: 'A Spark', text: "You meet someone interesting at a friend's dinner.",
    minAge: 20, maxAge: 45, weight: 4, mandatory: false,
    choices: [
      { id: 'ask', label: 'Ask them out', riskHint: 'gamble', effects: [{ type: 'stat', stat: 'happiness', delta: 6 }, { type: 'stat', stat: 'looks', delta: 1 }] },
      { id: 'friends', label: 'Stay friends', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 1 }, { type: 'stat', stat: 'happiness', delta: 1 }] },
      { id: 'leave', label: 'Leave early', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: -2 }] },
    ],
  },
  {
    id: 'life.adult.gym', title: 'New Year Resolution', text: 'You decide it is time to get healthy.',
    minAge: 18, maxAge: 60, weight: 3, mandatory: false,
    choices: [
      { id: 'gym', label: 'Join a gym', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 4 }, { type: 'stat', stat: 'looks', delta: 2 }, { type: 'stat', stat: 'energy', delta: -4 }, { type: 'money', delta: -400 }] },
      { id: 'run', label: 'Run outside', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 3 }, { type: 'stat', stat: 'happiness', delta: 2 }] },
      { id: 'quit', label: 'Forget about it', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 1 }] },
    ],
  },
  {
    id: 'life.adult.windfall', title: 'Unexpected Windfall', text: 'A forgotten account turns out to hold some money.',
    minAge: 20, maxAge: 70, weight: 2, mandatory: false,
    choices: [
      { id: 'save', label: 'Save it', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 1 }, { type: 'money', delta: 3000 }] },
      { id: 'splurge', label: 'Spend it all', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 6 }, { type: 'money', delta: 500 }] },
      { id: 'give', label: 'Give half away', riskHint: 'safe', effects: [{ type: 'stat', stat: 'karma', delta: 5 }, { type: 'money', delta: 1500 }] },
    ],
  },
  {
    id: 'life.adult.burnout', title: 'Burnout', text: 'Work has been relentless. You can barely get out of bed.',
    minAge: 25, maxAge: 60, weight: 3, mandatory: false,
    choices: [
      { id: 'rest', label: 'Take a long break', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 3 }, { type: 'stat', stat: 'happiness', delta: 2 }, { type: 'money', delta: -1500 }] },
      { id: 'push', label: 'Push through', riskHint: 'risky', effects: [{ type: 'stat', stat: 'health', delta: -5 }, { type: 'money', delta: 2500 }] },
      { id: 'talk', label: 'Talk to a therapist', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'smarts', delta: 1 }, { type: 'money', delta: -600 }] },
    ],
  },
  {
    id: 'life.senior.grandkids', title: 'Family Gathering', text: 'The whole family comes to visit this winter.',
    minAge: 55, maxAge: 100, weight: 4, mandatory: false,
    choices: [
      { id: 'cook', label: 'Cook a big meal', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 6 }, { type: 'stat', stat: 'energy', delta: -4 }] },
      { id: 'stories', label: 'Tell old stories', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'karma', delta: 2 }] },
      { id: 'nap', label: 'Take a nap', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 1 }] },
    ],
  },
  {
    id: 'life.senior.checkup', title: "Doctor's Visit", text: 'Your doctor wants you in for a full check-up.',
    minAge: 50, maxAge: 110, weight: 4, mandatory: false,
    choices: [
      { id: 'go', label: 'Go to the appointment', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 3 }, { type: 'money', delta: -300 }] },
      { id: 'skip', label: 'Skip it', riskHint: 'risky', effects: [{ type: 'stat', stat: 'happiness', delta: 1 }, { type: 'stat', stat: 'health', delta: -3 }] },
      { id: 'second', label: 'Get a second opinion', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 2 }, { type: 'stat', stat: 'smarts', delta: 1 }, { type: 'money', delta: -700 }] },
    ],
  },
  {
    id: 'life.senior.garden', title: 'The Garden', text: 'A patch of earth is calling you.',
    minAge: 55, maxAge: 110, weight: 3, mandatory: false,
    choices: [
      { id: 'plant', label: 'Start gardening', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'health', delta: 2 }] },
      { id: 'park', label: 'Walk in the park instead', riskHint: 'safe', effects: [{ type: 'stat', stat: 'health', delta: 2 }, { type: 'stat', stat: 'happiness', delta: 2 }] },
      { id: 'tv', label: 'Binge old movies', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 2 }, { type: 'stat', stat: 'health', delta: -1 }] },
    ],
  },
  {
    id: 'life.senior.memoir', title: 'Write Your Story', text: 'Friends say your life deserves a book.',
    minAge: 60, maxAge: 110, weight: 2, mandatory: false,
    choices: [
      { id: 'write', label: 'Start writing', riskHint: 'safe', effects: [{ type: 'stat', stat: 'smarts', delta: 2 }, { type: 'stat', stat: 'happiness', delta: 4 }, { type: 'stat', stat: 'karma', delta: 2 }] },
      { id: 'dictate', label: 'Record voice memos', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 3 }] },
      { id: 'no', label: 'Let the past rest', riskHint: 'safe', effects: [{ type: 'stat', stat: 'happiness', delta: 1 }] },
    ],
  },
];
