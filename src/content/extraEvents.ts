import { Condition, Effect, EventChoice, EventDef, StatKey } from '../engine/types';

const st = (stat: StatKey, delta: number): Effect => ({ type: 'stat', stat, delta });
const money = (delta: number): Effect => ({ type: 'money', delta });
const flag = (key: string, value: boolean | number | string = true): Effect => ({ type: 'flag', key, value });
const log = (icon: string, text: string): Effect => ({ type: 'log', icon, text });
const cond = (c: Omit<Condition, 'sinceAge' | 'treated'>): Effect => ({ type: 'addCondition', condition: { ...c, sinceAge: 0, treated: false } });

const choice = (id: string, label: string, riskHint: EventChoice['riskHint'], effects: Effect[], gamble?: EventChoice['gamble']): EventChoice => ({ id, label, riskHint, effects, gamble });
const ev = (id: string, title: string, text: string, minAge: number, maxAge: number, weight: number, choices: EventChoice[], requiresFlags?: string[]): EventDef => ({ id, title, text, minAge, maxAge, weight, mandatory: false, choices, requiresFlags });

/** More age-banded events. Choices can gamble (resolved by the seeded RNG) and set long-term flags. */
export const extraEvents: EventDef[] = [
  ev('x.child.lemonade', 'Lemonade Stand', 'Summer. Sun. A wobbly table and a jug of lemons.', 6, 12, 3, [
    choice('open', 'Open for business', 'gamble', [], { p: 0.6, win: [money(40), st('happiness', 4), st('smarts', 1)], lose: [st('happiness', -2)], winText: 'Sold out by noon!', loseText: 'Nobody came. Mum bought the last cup.' }),
    choice('donate', 'Give it to charity', 'safe', [st('karma', 4), st('happiness', 2)]),
    choice('drink', 'Drink it all yourself', 'safe', [st('happiness', 2), st('health', -1)]),
  ]),
  ev('x.child.tree', 'The Big Tree', 'A huge oak tower over the playground. It dares you.', 6, 12, 3, [
    choice('climb', 'Climb to the top', 'gamble', [], { p: 0.7, win: [st('happiness', 5), st('health', 1)], lose: [st('health', -5), cond({ id: 'broken-leg', name: 'Broken Leg', icon: '🦴', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], winText: 'You could see your whole street from up there.', loseText: 'The branch snapped. Hospital time.' }),
    choice('stay', 'Stay on the ground', 'safe', [st('happiness', -1)]),
  ]),
  ev('x.child.cheat', 'Wandering Eyes', 'The test is hard. Your neighbour’s answers are right there.', 8, 17, 3, [
    choice('cheat', 'Peek', 'gamble', [flag('cheated')], { p: 0.55, win: [st('smarts', 1), st('karma', -3)], lose: [st('karma', -5), st('happiness', -5), st('smarts', -1)], winText: 'Nobody noticed. Your conscience did.', loseText: 'Caught red-handed. Detention for a month.' }),
    choice('honest', 'Do your own work', 'safe', [st('karma', 3), st('smarts', 1)]),
  ]),
  ev('x.teen.firstjob', 'Help Wanted', 'A local shop has a "Help Wanted" sign in the window.', 14, 17, 3, [
    choice('apply', 'Ask about the job', 'safe', [money(300), st('smarts', 1), st('energy', -3), flag('worked_teen')]),
    choice('skip', 'Enjoy your freedom instead', 'safe', [st('happiness', 3)]),
  ]),
  ev('x.teen.drive', 'Behind the Wheel', 'You are old enough to learn to drive.', 16, 18, 3, [
    choice('lessons', 'Take proper lessons', 'safe', [money(-400), st('smarts', 1), flag('can_drive')]),
    choice('friend', 'Let a friend teach you', 'gamble', [flag('can_drive')], { p: 0.8, win: [st('happiness', 3)], lose: [st('health', -4), money(-800)], winText: 'Passed with flying colours!', loseText: 'You clipped a bin. A very expensive bin.' }),
  ]),
  ev('x.teen.smoke', 'Peer Pressure', 'Friends behind the school offer you a cigarette.', 13, 18, 3, [
    choice('try', 'Take one', 'risky', [st('happiness', 1), st('health', -1), flag('smoker')]),
    choice('refuse', 'Say no', 'safe', [st('karma', 1), st('health', 1)]),
  ]),
  ev('x.teen.band', 'Garage Band', 'Your friends want to start a band. You are on drums, apparently.', 13, 19, 2, [
    choice('join', 'Join the band', 'gamble', [st('happiness', 3)], { p: 0.15, win: [money(2000), st('happiness', 8), log('🎸', 'Your garage band got a paid gig and a local following.')], lose: [st('happiness', 1)], winText: 'You blew up locally!', loseText: 'The neighbours hate you. Still fun.' }),
    choice('pass', 'Stick to homework', 'safe', [st('smarts', 2)]),
  ]),
  ev('x.adult.wedding', 'Save the Date', 'A close friend is getting married and wants you in the wedding party.', 20, 60, 2, [
    choice('yes', 'Say yes (and pay for the suit)', 'safe', [money(-500), st('happiness', 4), st('karma', 2)]),
    choice('no', 'Politely decline', 'safe', [st('happiness', -2), st('karma', -1)]),
  ]),
  ev('x.adult.flatmate', 'The Flatmate', 'Your flatmate has not paid rent in two months.', 19, 40, 3, [
    choice('confront', 'Have it out', 'risky', [st('happiness', -2), money(400)]),
    choice('cover', 'Cover them', 'safe', [money(-900), st('karma', 3)]),
    choice('move', 'Move out', 'safe', [money(-700), st('happiness', 2)]),
  ]),
  ev('x.adult.stock-tip', 'A Hot Tip', 'A coworker swears this stock will triple.', 22, 70, 2, [
    choice('invest', 'Put $2,000 in', 'gamble', [money(-2000)], { p: 0.35, win: [money(6000), st('happiness', 6)], lose: [st('happiness', -5)], winText: 'It tripled! They were right!', loseText: 'It cratered. Classic.' }),
    choice('ignore', 'Ignore it', 'safe', [st('smarts', 1)]),
  ]),
  ev('x.adult.crash', 'Fender Bender', 'You and another driver meet at a junction. Loudly.', 18, 75, 2, [
    choice('exchange', 'Exchange details', 'safe', [money(-500), st('karma', 1)]),
    choice('flee', 'Drive off', 'gamble', [st('karma', -6)], { p: 0.6, win: [st('happiness', 1)], lose: [{ type: 'jail', years: 1, crime: 'Hit and run' }], winText: 'Nobody caught your plate.', loseText: 'A witness took your plate. Hit and run.' }),
  ], ['can_drive']),
  ev('x.adult.cough', 'That Cough', 'You have been coughing for weeks.', 30, 80, 3, [
    choice('doctor', 'See a doctor', 'safe', [money(-120), st('health', 1)]),
    choice('wait', 'It will pass', 'gamble', [], { p: 0.7, win: [st('happiness', 1)], lose: [st('health', -6), cond({ id: 'pneumonia', name: 'Pneumonia', icon: '🫁', kind: 'illness', severity: 3, chronic: false, diagnosed: true })], winText: 'It cleared up on its own.', loseText: 'It was pneumonia. You should have gone sooner.' }),
  ], ['smoker']),
  ev('x.adult.reunion', 'Old Friends', 'An old friend from school looks you up.', 25, 70, 2, [
    choice('meet', 'Get dinner', 'safe', [st('happiness', 5), money(-80)]),
    choice('busy', 'Too busy, sorry', 'safe', [st('happiness', -1)]),
  ]),
  ev('x.adult.pet', 'Rescue Dog', 'The shelter has a dog with your exact energy.', 20, 70, 2, [
    choice('adopt', 'Adopt him', 'safe', [money(-300), st('happiness', 7), st('health', 1), flag('has_dog')]),
    choice('no', 'Maybe next year', 'safe', []),
  ]),
  ev('x.adult.inherit', 'A Distant Relative', 'A solicitor calls: a great-aunt left you something.', 22, 70, 1, [
    choice('claim', 'Claim it', 'gamble', [], { p: 0.7, win: [money(15000), st('happiness', 6)], lose: [money(-300)], winText: 'A tidy sum. Thank you, Auntie.', loseText: 'It was mostly debts and cats.' }),
  ]),
  ev('x.senior.retire', 'The Watch', 'Colleagues throw you a retirement party.', 62, 72, 3, [
    choice('speech', 'Give a speech', 'safe', [st('happiness', 5), st('karma', 1)]),
    choice('quiet', 'Slip out early', 'safe', [st('happiness', 1)]),
  ]),
  ev('x.senior.scam', 'The Phone Call', 'A friendly voice says your grandchild is in trouble and needs money now.', 60, 95, 2, [
    choice('pay', 'Send the money', 'gamble', [], { p: 0.2, win: [st('karma', 2)], lose: [money(-5000), st('happiness', -8)], winText: 'It was real, and you helped.', loseText: 'It was a scam. You feel foolish and furious.' }),
    choice('hang', 'Hang up and call family', 'safe', [st('smarts', 1), st('karma', 1)]),
  ]),
  ev('x.senior.fall', 'A Nasty Fall', 'The stairs were slippery. You are on the floor.', 65, 100, 2, [
    choice('hospital', 'Go to hospital', 'safe', [money(-800), st('health', -2)]),
    choice('rub', 'Shake it off', 'gamble', [], { p: 0.55, win: [st('happiness', 1)], lose: [st('health', -8), cond({ id: 'broken-leg', name: 'Broken Hip', icon: '🦴', kind: 'injury', severity: 3, chronic: false, diagnosed: true })], winText: 'Just a bruise.', loseText: 'A broken hip. You should have gone.' }),
  ]),
  ev('x.any.vices', 'A Rough Week', 'Everything went wrong. A drink would help. Several would help more.', 18, 80, 2, [
    choice('drink', 'Have a few drinks', 'risky', [st('happiness', 3), st('health', -1), flag('drinker')]),
    choice('talk', 'Call someone you trust', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('run', 'Go for a long run', 'safe', [st('health', 2), st('happiness', 2)]),
  ]),
];
