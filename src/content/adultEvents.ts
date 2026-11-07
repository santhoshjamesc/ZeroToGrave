import { Condition, Effect, EventChoice, EventDef, EventNeed, StatKey, Trait } from '../engine/types';

const st = (stat: StatKey, delta: number): Effect => ({ type: 'stat', stat, delta });
const money = (delta: number): Effect => ({ type: 'money', delta });
const flag = (key: string, value: boolean | number | string = true): Effect => ({ type: 'flag', key, value });
const log = (icon: string, text: string): Effect => ({ type: 'log', icon, text });
const cond = (c: Omit<Condition, 'sinceAge' | 'treated'>): Effect => ({ type: 'addCondition', condition: { ...c, sinceAge: 0, treated: false } });
const trait = (t: Trait): Effect => ({ type: 'addTrait', trait: t });

const choice = (id: string, label: string, riskHint: EventChoice['riskHint'], effects: Effect[], gamble?: EventChoice['gamble']): EventChoice => ({ id, label, riskHint, effects, gamble });
const gm = (p: number, win: Effect[], lose: Effect[], winText: string, loseText: string): EventChoice['gamble'] => ({ p, win, lose, winText, loseText });

interface Opts {
  flags?: string[];
  forbids?: string[];
  traits?: string[];
  needs?: EventNeed[];
  tags?: string[];
  once?: boolean;
  cooldown?: number;
  sensitive?: boolean;
  minStat?: EventDef['minStat'];
  maxStat?: EventDef['maxStat'];
}
const ev = (id: string, title: string, text: string, minAge: number, maxAge: number, weight: number, choices: EventChoice[], o: Opts = {}): EventDef => {
  const def: EventDef = { id: `ad.${id}`, title, text, minAge, maxAge, weight, mandatory: false, choices };
  if (o.flags) def.requiresFlags = o.flags;
  if (o.forbids) def.forbidsFlags = o.forbids;
  if (o.traits) def.requiresTraits = o.traits;
  if (o.needs) def.needs = o.needs;
  if (o.tags) def.tags = o.tags;
  if (o.once) def.once = true;
  if (o.cooldown !== undefined) def.cooldown = o.cooldown;
  if (o.sensitive) def.sensitive = true;
  if (o.minStat) def.minStat = o.minStat;
  if (o.maxStat) def.maxStat = o.maxStat;
  return def;
};

/**
 * Adult life (18-64). Needs/traits gate many events so different lives see different stories.
 * Flags SET: ad_side_biz, ad_viral, ad_affair, ad_married, ad_moved_in, ad_burnout, ad_caregiver, ad_whistle,
 *   ad_crypto, ad_midlife_car, ad_novel, ad_feud, ad_cat, ad_sober, ad_band, ad_dropout_dream, ad_new_parent.
 */
export const adultEvents: EventDef[] = [
  // =============== AGES 18-29 ===============
  ev('first-apartment', 'Keys in Hand', 'Your first place. The landlord hands you the keys and a stern list of rules about the boiler.', 18, 26, 3, [
    choice('decorate', 'Splurge on making it yours', 'safe', [money(-900), st('happiness', 5)]),
    choice('bare', 'Live minimalist and save', 'safe', [money(-150), st('happiness', 1), st('smarts', 1)]),
    choice('roommates', 'Take in a lodger', 'gamble', [], gm(0.6, [money(1200), st('happiness', 1)], [money(-400), st('happiness', -4)], 'The lodger is tidy and pays early.', 'The lodger ate your food and vanished.')),
  ], { tags: ['money', 'family'], once: true }),
  ev('rent-spike', 'Rent Hike', 'Your landlord announces a rent increase with a smiley face emoji. The smiley face is not helping.', 20, 45, 3, [
    choice('pay', 'Grit your teeth and pay', 'safe', [money(-1200), st('happiness', -3)]),
    choice('negotiate', 'Negotiate', 'gamble', [], gm(0.5, [money(-300), st('smarts', 1)], [money(-1500), st('happiness', -3)], 'You talked it down to something bearable.', 'He laughed, then raised it further.')),
    choice('move', 'Hunt for somewhere cheaper', 'safe', [money(-600), st('energy', -4), st('happiness', -1)]),
  ], { tags: ['money'], needs: ['job'] }),
  ev('boss-yells', 'The Boss Blows Up', 'Your boss shouts at the whole team about a mistake that was probably not yours.', 19, 55, 3, [
    choice('take', 'Take it quietly', 'safe', [st('happiness', -4), st('karma', 1)]),
    choice('speak', 'Calmly point out the facts', 'gamble', [], gm(0.55, [st('smarts', 1), st('happiness', 3)], [st('happiness', -5), money(-300)], 'The room goes silent, then the boss apologises.', 'You are written up for "tone". Delightful.')),
    choice('update', 'Update your CV that night', 'safe', [st('energy', -3), st('smarts', 1)]),
  ], { needs: ['job'], tags: ['work'] }),
  ev('coworker-credit', 'Stolen Credit', 'A coworker presents your idea in a meeting as their own. They get the praise.', 21, 50, 3, [
    choice('confront', 'Confront them privately', 'risky', [st('karma', 1), st('happiness', -2)]),
    choice('email', 'Send a polite email with the original draft', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('revenge', 'Quietly sabotage their next slide deck', 'risky', [st('karma', -5), st('happiness', 3), flag('ad_feud')]),
  ], { needs: ['job'], tags: ['work', 'mischief'] }),
  ev('office-cake', 'Mystery Cake', 'Someone leaves a vast cake in the kitchen with no note. The office is divided on whether to trust it.', 19, 60, 2, [
    choice('eat', 'Eat a big slice', 'safe', [st('happiness', 3), st('health', -1)]),
    choice('detective', 'Investigate the baker', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('skip', 'Walk past with iron will', 'safe', [st('health', 1), st('happiness', -1)]),
  ], { needs: ['job'], tags: ['food', 'work'], cooldown: 4 }),
  ev('layoff-young', 'Restructuring', 'HR schedules "a quick chat". Everyone knows what that means.', 21, 45, 2, [
    choice('severance', 'Take the severance and breathe', 'safe', [money(3000), st('happiness', -5), st('energy', 3)]),
    choice('fight', 'Push for a better package', 'gamble', [], gm(0.4, [money(7000), st('happiness', -1)], [money(500), st('happiness', -6)], 'They doubled the offer to avoid a fuss.', 'They held firm and cut you off early.')),
  ], { needs: ['job'], tags: ['work', 'money'], cooldown: 10 }),
  ev('student-debt-letter', 'The Loan Statement', 'A letter arrives from your lender. The number inside is bigger than your hopes.', 22, 35, 3, [
    choice('aggressive', 'Throw everything at it', 'safe', [money(-2500), st('happiness', -3), st('karma', 1)]),
    choice('minimum', 'Pay the minimum, live a little', 'safe', [money(-300), st('happiness', 2)]),
    choice('ignore', 'Pretend you did not see it', 'risky', [st('happiness', 1)]),
  ], { needs: ['inDebt', 'degree'], tags: ['money', 'school'], cooldown: 5 }),
  ev('dating-app', 'Swipe Right', 'You spend an evening on a dating app. Your thumb aches. Someone interesting messages you.', 18, 40, 3, [
    choice('date', 'Meet for coffee', 'gamble', [money(-20)], gm(0.5, [st('happiness', 5), st('looks', 1)], [st('happiness', -3)], 'You talk for three hours and forget the coffee.', 'They looked nothing like their photos. Or their personality.')),
    choice('delete', 'Delete the app dramatically', 'safe', [st('happiness', 1), st('energy', 2)]),
  ], { needs: ['single'], tags: ['love', 'tech'] }),
  ev('first-date-disaster', 'Date From Nowhere', 'Your date orders the most expensive dish, then reveals they forgot their wallet.', 18, 38, 2, [
    choice('pay', 'Pay with a smile', 'safe', [money(-120), st('happiness', -1), st('karma', 1)]),
    choice('split', 'Insist on splitting', 'safe', [money(-50), st('happiness', 1)]),
    choice('laugh', 'Laugh and wash dishes together', 'gamble', [], gm(0.35, [st('happiness', 6), st('karma', 1)], [st('happiness', -2), money(-60)], 'The owner loved it and so did your date.', 'The owner was not amused. You still paid.')),
  ], { needs: ['single'], tags: ['love', 'food'] }),
  ev('romantic-grand-gesture', 'The Grand Gesture', 'You have a plan involving a rooftop, a speaker, and a lot of fairy lights.', 19, 35, 2, [
    choice('go', 'Do it', 'gamble', [money(-250)], gm(0.45, [st('happiness', 8), flag('ad_moved_in')], [st('happiness', -6), st('karma', -1)], 'They said yes to dinner, to everything.', 'The speaker played the wrong song. Neighbours filmed it.')),
    choice('simple', 'Write a handwritten note instead', 'safe', [st('happiness', 3)]),
  ], { traits: ['romantic', 'charming'], tags: ['love'] }),
  ev('moving-in', 'Toothbrush Treaty', 'A toothbrush has appeared in your bathroom. Then a drawer. Then a whole wardrobe.', 20, 36, 3, [
    choice('yes', 'Make it official: move in together', 'safe', [st('happiness', 5), money(-300), flag('ad_moved_in')]),
    choice('slow', 'Ask for a little more time', 'safe', [st('happiness', -1), st('smarts', 1)]),
  ], { needs: ['partner'], tags: ['love'], forbids: ['ad_moved_in'] }),
  ev('jealousy', 'Green Eyes', 'Your partner’s ex keeps liking their photos. You are wearing a hole in your carpet.', 19, 45, 3, [
    choice('talk', 'Have an honest chat', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('snoop', 'Check their phone', 'gamble', [st('karma', -3)], gm(0.5, [st('happiness', 2)], [st('happiness', -6)], 'Nothing there. You feel silly, but relieved.', 'You found something that made things worse. And you looked.')),
    choice('stew', 'Say nothing and seethe', 'risky', [st('happiness', -4), st('health', -1)]),
  ], { needs: ['partner'], tags: ['love'] }),
  ev('infidelity-temptation', 'Late-Night Message', 'A charming coworker keeps texting after hours. Tonight they suggest a drink "just us".', 22, 55, 2, [
    choice('go', 'Go for the drink', 'gamble', [flag('ad_affair'), flag('cheated'), st('karma', -6)], gm(0.4, [st('happiness', 4)], [st('happiness', -8), st('karma', -2)], 'Nobody ever knew, but you do.', 'Someone saw you. The whisper is already travelling.')),
    choice('decline', 'Politely decline and mute them', 'safe', [st('karma', 3), st('happiness', -1)]),
    choice('tell', 'Tell your partner about it', 'safe', [st('karma', 4), st('happiness', 1)]),
  ], { needs: ['partner', 'job'], tags: ['love', 'work'] }),
  ev('affair-fallout', 'Truth Comes Out', 'Your partner sits you down. They have found out about the other person.', 23, 58, 3, [
    choice('confess', 'Own it, apologise, and mean it', 'safe', [st('happiness', -6), st('karma', 4), st('smarts', 1)]),
    choice('deny', 'Deny everything', 'gamble', [], gm(0.25, [st('happiness', 1)], [st('happiness', -10), st('karma', -3), money(-1500)], 'They wavered. You got away with it.', 'They had screenshots. It ended badly and expensively.')),
    choice('leave', 'Say it is over and leave', 'risky', [st('happiness', -5), money(-1200), st('karma', -2)]),
  ], { flags: ['ad_affair'], needs: ['partner'], tags: ['love'], sensitive: true, once: true }),
  ev('wedding-planning', 'The Big Day', 'Your partner proposes. You say yes, then discover what chairs cost.', 22, 42, 3, [
    choice('lavish', 'Go all out', 'safe', [money(-8000), st('happiness', 8), flag('ad_married')]),
    choice('small', 'Small ceremony, great food', 'safe', [money(-1500), st('happiness', 6), flag('ad_married')]),
    choice('elope', 'Elope to somewhere windy', 'safe', [money(-500), st('happiness', 5), flag('ad_married'), log('💍', 'You eloped, and told everyone afterwards.')]),
  ], { needs: ['partner'], tags: ['love', 'family'], forbids: ['ad_married'], once: true }),
  ev('wedding-guest', 'Plus One', 'A friend’s wedding invite arrives. The plus-one box blinks at you.', 21, 34, 2, [
    choice('bring', 'Bring a friend and a good dance', 'safe', [st('happiness', 4), money(-250)]),
    choice('alone', 'Go solo and meet people', 'gamble', [money(-150)], gm(0.4, [st('happiness', 6)], [st('happiness', -2)], 'You danced all night and swapped numbers.', 'You spent the night at the singles table, defending a bread roll.')),
  ], { needs: ['single'], tags: ['love', 'friends'] }),
  ev('friend-needs-couch', 'The Guest Who Stayed', 'A friend turns up with a bag, saying "just a couple of nights". It has been a month.', 20, 38, 3, [
    choice('generous', 'Keep being generous', 'safe', [st('karma', 3), money(-300), st('happiness', -1)]),
    choice('deadline', 'Set a firm deadline', 'safe', [st('happiness', 1), st('karma', -1)]),
    choice('prank', 'Hide the remote until they leave', 'safe', [st('happiness', 2), st('karma', -1)]),
  ], { tags: ['friends'] }),
  ev('scam-email', 'You Have Won!', 'An email congratulates you on a prize you never entered. It needs only a small "processing fee".', 18, 45, 2, [
    choice('pay', 'Pay the fee, just in case', 'gamble', [money(-200)], gm(0.02, [money(5000)], [st('happiness', -4), st('smarts', -1)], 'Somehow it was real.', 'It was a scam. As expected, and you knew better.')),
    choice('report', 'Report it and mock it', 'safe', [st('smarts', 1), st('happiness', 1)]),
  ], { tags: ['money', 'tech'] }),
  ev('crypto-hype', 'Moon Coin', 'Everyone at the pub is suddenly a cryptocurrency expert, loudly.', 20, 50, 2, [
    choice('all-in', 'Invest a chunk', 'gamble', [money(-2000), flag('ad_crypto')], gm(0.35, [money(6500), st('happiness', 5)], [st('happiness', -4)], 'The coin soared and so did your ego.', 'It crashed within the week. Down to ashes.')),
    choice('tiny', 'Dabble with pocket change', 'safe', [money(-100), st('happiness', 1)]),
    choice('mock', 'Laugh and buy another round', 'safe', [money(-40), st('happiness', 2)]),
  ], { tags: ['money', 'luck', 'tech'] }),
  ev('crypto-crash', 'Red Screens', 'You check your crypto app. Everything is red. It is also your lunch break.', 21, 55, 2, [
    choice('hold', 'Hold on and meditate', 'gamble', [], gm(0.5, [money(3500), st('happiness', 4)], [money(-1500), st('happiness', -4)], 'It bounced back. You look like a genius.', 'It kept sinking. You looked less like a genius.')),
    choice('sell', 'Sell and take the loss', 'safe', [money(-800), st('happiness', -2), st('smarts', 1)]),
  ], { flags: ['ad_crypto'], tags: ['money'], once: true }),
  ev('festival-weekend', 'Festival Weekend', 'Friends have tickets to a three-day music festival. The forecast says mud.', 18, 30, 3, [
    choice('go', 'Pack a tent and go', 'gamble', [money(-350), st('happiness', 4)], gm(0.55, [st('happiness', 4), st('looks', 1)], [st('health', -3), st('happiness', -1)], 'Best weekend of the year.', 'You came home with a cold and one welly.')),
    choice('stay', 'Stay home and watch the livestream', 'safe', [st('happiness', 1), st('energy', 2)]),
  ], { tags: ['friends', 'adventure'] }),
  ev('backpacking', 'One Way Ticket', 'You have savings and a world map. Your flat lease ends next month.', 18, 29, 3, [
    choice('go', 'Backpack for six months', 'gamble', [money(-3500), st('happiness', 5)], gm(0.7, [st('smarts', 2), st('happiness', 6), log('🌍', 'You spent months wandering. You came back different.')], [st('health', -4), money(-800)], 'You met people who changed how you see things.', 'Food poisoning, a stolen bag, and a lot of buses.')),
    choice('week', 'Settle for two weeks in one place', 'safe', [money(-900), st('happiness', 3)]),
    choice('save', 'Save the money instead', 'safe', [money(300), st('smarts', 1), st('happiness', -1)]),
  ], { tags: ['travel', 'adventure'], needs: ['noJob'], cooldown: 8 }),
  ev('gym-membership', 'January Resolution', 'You pay for a gym membership and take a brave selfie in the changing rooms.', 18, 40, 3, [
    choice('commit', 'Actually go, three times a week', 'safe', [money(-500), st('health', 4), st('looks', 2), st('energy', -2)]),
    choice('mostly', 'Go twice, then forget', 'safe', [money(-500), st('health', 1)]),
    choice('home', 'Cancel and do push-ups at home', 'safe', [st('health', 2), st('happiness', -1)]),
  ], { tags: ['sports', 'health'] }),
  ev('side-project', 'Side Project', 'You have an idea that will not leave you alone: a little business you could start after work.', 20, 40, 3, [
    choice('start', 'Start it on weekends', 'gamble', [money(-600), st('energy', -4), flag('ad_side_biz')], gm(0.4, [money(1500), st('happiness', 4)], [st('happiness', -3)], 'First customers! Tiny, but real.', 'It never took off, but you learned plenty.')),
    choice('park', 'Park it in a notebook', 'safe', [st('happiness', 1)]),
  ], { tags: ['work', 'money', 'creativity'], needs: ['job'], traits: ['ambitious', 'creative', 'tech-savvy', 'curious'] }),
  ev('biz-scale', 'Orders Piling Up', 'Your side business has more orders than you have evenings.', 22, 48, 3, [
    choice('quit', 'Quit your job and go full-time', 'gamble', [], gm(0.45, [money(9000), st('happiness', 7), log('📦', 'Your side project turned into a real business.')], [money(-6000), st('happiness', -6)], 'You never looked back.', 'It was too soon. You limp back to a job.')),
    choice('hire', 'Hire a helper', 'safe', [money(-1500), st('energy', 3), st('happiness', 2)]),
    choice('cap', 'Cap orders and keep your job', 'safe', [money(1200), st('energy', -3)]),
  ], { flags: ['ad_side_biz'], tags: ['work', 'money'], once: true }),
  ev('dropout-dream', 'The Big Dream', 'You are bored of your life plan and itch to chase an art, a band, a crazy thing.', 19, 28, 2, [
    choice('chase', 'Chase it hard for a year', 'gamble', [money(-2000), flag('ad_dropout_dream')], gm(0.2, [st('happiness', 9), money(4000), st('looks', 1)], [st('happiness', -3), st('smarts', 1)], 'Against all odds, it caught fire.', 'It fizzled, but you will never wonder "what if".')),
    choice('sensible', 'Keep it as a hobby', 'safe', [st('happiness', 2)]),
  ], { traits: ['creative', 'daydreamer', 'rebel', 'wanderer'], tags: ['creativity'] }),
  ev('band-reunion', 'Band Practice', 'Old friends invite you to start a band again. Your amp still works. Your knees are unsure.', 20, 40, 2, [
    choice('join', 'Play the gig', 'gamble', [flag('ad_band')], gm(0.4, [st('happiness', 6), money(400)], [st('happiness', -2), st('health', -1)], 'A tiny crowd, a huge buzz.', 'You played the wrong song twice. Nobody noticed. You did.')),
    choice('pass', 'Politely pass', 'safe', [st('energy', 2)]),
  ], { tags: ['creativity', 'friends'] }),
  ev('night-class', 'Evening Course', 'A flyer for a pottery night class is stuck to a lamppost. You take it as a sign.', 20, 55, 2, [
    choice('sign', 'Sign up', 'safe', [money(-180), st('happiness', 3), st('smarts', 1)]),
    choice('skip', 'Keep the flyer as a bookmark', 'safe', []),
  ], { tags: ['creativity', 'school'] }),
  ev('car-trouble', 'Strange Noise', 'Your car starts making a noise like a cat learning cello.', 19, 60, 3, [
    choice('mechanic', 'Take it to the mechanic', 'safe', [money(-500), st('energy', -1)]),
    choice('diy', 'Watch a tutorial and fix it yourself', 'gamble', [], gm(0.5, [money(-60), st('smarts', 2), st('happiness', 3)], [money(-1300), st('happiness', -3)], 'Fixed! You feel unstoppable.', 'You made it worse. The mechanic sighed theatrically.')),
    choice('bus', 'Take the bus until it stops', 'risky', [st('happiness', -1), st('health', 1)]),
  ], { flags: ['can_drive'], tags: ['money'] }),
  ev('speeding-ticket', 'Flashing Lights', 'A police car pulls up behind you. You were definitely not speeding. A little.', 18, 60, 2, [
    choice('pay', 'Accept the fine', 'safe', [money(-250), st('karma', 1)]),
    choice('argue', 'Contest it', 'gamble', [], gm(0.35, [st('smarts', 1), st('happiness', 3)], [money(-500), st('happiness', -2)], 'The judge threw it out.', 'You lost, and the costs doubled.')),
  ], { flags: ['can_drive'], tags: ['crime', 'money'] }),
  ev('shoplift-dare', 'Easy Money', 'A friend nudges you to pocket something small from a big store. "They will never notice".', 18, 28, 2, [
    choice('take', 'Slip it in your pocket', 'gamble', [st('karma', -5)], gm(0.5, [st('happiness', 1)], [st('karma', -3), money(-400), st('happiness', -5)], 'Nobody saw. It still sits badly.', 'A guard stopped you. A fine, an apology, and a ban.')),
    choice('refuse', 'Say no and walk out', 'safe', [st('karma', 3)]),
    choice('talk', 'Talk them out of it too', 'safe', [st('karma', 2), st('smarts', 1)]),
  ], { tags: ['crime', 'friends'], traits: ['rebel', 'reckless', 'selfish'] }),
  ev('karaoke-night', 'Karaoke Hero', 'Your friends chant your name toward the karaoke stage. Someone queued a power ballad.', 18, 40, 3, [
    choice('sing', 'Grab the mic', 'gamble', [], gm(0.5, [st('happiness', 5), st('looks', 1)], [st('happiness', -3)], 'The room sings along. You are briefly famous.', 'Your voice cracked on the key change. It echoed.')),
    choice('duet', 'Pull a friend up for a duet', 'safe', [st('happiness', 3)]),
    choice('hide', 'Hide in the toilets', 'safe', [st('happiness', -1)]),
  ], { tags: ['friends', 'creativity'], traits: ['life-of-party', 'charming', 'shy'] }),
  ev('street-performer', 'Busking Experiment', 'On a whim, you try performing in the street with a hat on the pavement.', 19, 35, 2, [
    choice('perform', 'Go for it', 'gamble', [], gm(0.45, [money(150), st('happiness', 5)], [st('happiness', -2)], 'People stopped and tossed coins. Magic.', 'A pigeon got more attention.')),
    choice('practice', 'Practise at home first', 'safe', [st('smarts', 1)]),
  ], { tags: ['creativity', 'fame'], traits: ['creative', 'charming', 'life-of-party'] }),
  ev('viral-post', 'Gone Viral', 'A silly video of you goes viral overnight. Strangers know your face.', 18, 50, 1.5, [
    choice('lean', 'Lean into it', 'gamble', [flag('ad_viral')], gm(0.5, [money(1800), st('happiness', 5), log('📱', 'You briefly went viral and kept a few fans.')], [st('happiness', -5), st('karma', -1)], 'Brand deals knock on the door.', 'The comments are brutal. Never look.')),
    choice('hide', 'Delete everything and hide', 'safe', [st('happiness', -1)]),
  ], { tags: ['fame', 'tech'], cooldown: 12 }),
  ev('viral-aftermath', 'Is That You?', 'Strangers still recognise you in the street from that viral clip. Some are kind.', 20, 55, 2, [
    choice('wave', 'Wave and take selfies', 'safe', [st('happiness', 3), st('looks', 1)]),
    choice('brand', 'Accept an endorsement deal', 'safe', [money(2500), st('karma', -1)]),
    choice('quiet', 'Move on quietly', 'safe', [st('happiness', 1), st('energy', 2)]),
  ], { flags: ['ad_viral'], tags: ['fame'], once: true }),
  ev('adopt-cat', 'The Stray', 'A scruffy cat keeps turning up at your window. Today it walked in and fell asleep on your jumper.', 18, 55, 3, [
    choice('keep', 'Keep him', 'safe', [money(-250), st('happiness', 6), st('health', 1), flag('ad_cat')]),
    choice('shelter', 'Take him to a shelter', 'safe', [st('karma', 2), st('happiness', 1)]),
    choice('feed', 'Feed him outside only', 'safe', [st('happiness', 2), money(-20)]),
  ], { tags: ['pets'] }),
  ev('pet-vet', 'Vet Bill', 'Your cat swallowed something it should not have. Everyone is calm except you.', 20, 64, 2, [
    choice('pay', 'Pay whatever it costs', 'safe', [money(-1100), st('happiness', 3), st('karma', 1)]),
    choice('cheap', 'Try a cheaper clinic', 'gamble', [], gm(0.6, [money(-300), st('happiness', 2)], [money(-1500), st('happiness', -4)], 'Fixed and affordable.', 'It needed a second visit, a pricey one.')),
  ], { flags: ['ad_cat'], tags: ['pets', 'money'] }),
  ev('housemate-noise', 'Thin Walls', 'Your neighbours have found a drum kit. Or a very committed set of pans.', 19, 60, 3, [
    choice('knock', 'Knock politely', 'safe', [st('happiness', 1)]),
    choice('revenge', 'Play loud music back', 'risky', [st('karma', -2), st('happiness', 2), flag('ad_feud')]),
    choice('earplugs', 'Buy earplugs and endure', 'safe', [money(-25), st('happiness', -2)]),
  ], { tags: ['mischief'] }),
  ev('first-flu', 'Adult Flu', 'The flu hits with the subtlety of a dropped piano. Nobody is coming to help.', 18, 40, 2, [
    choice('rest', 'Take a week off', 'safe', [st('health', -1), st('energy', 4), money(-150)]),
    choice('work', 'Push through', 'gamble', [], gm(0.5, [st('health', -2)], [st('health', -7), money(-400)], 'You survived with caffeine and stubbornness.', 'You got worse and infected three coworkers.')),
  ], { needs: ['job'], tags: ['health'] }),
  ev('crash-diet', 'The Cleanse', 'A glossy video promises miracles from a juice-and-air diet.', 19, 40, 2, [
    choice('go', 'Try it for two weeks', 'risky', [st('health', -3), st('looks', 1), money(-100)]),
    choice('balanced', 'Eat balanced and walk more', 'safe', [st('health', 2)]),
    choice('pizza', 'Order pizza in protest', 'safe', [st('happiness', 3), st('health', -1)]),
  ], { tags: ['health', 'food'] }),
  ev('party-too-far', 'One More Round', 'The party was great. The next morning is less great. The neighbours have opinions.', 18, 30, 3, [
    choice('sorry', 'Apologise with donuts', 'safe', [money(-30), st('karma', 1), st('happiness', 1)]),
    choice('again', 'Do it all again next weekend', 'risky', [st('happiness', 3), st('health', -2), flag('drinker')]),
    choice('hide', 'Move out discreetly', 'safe', [money(-500), st('happiness', -1)]),
  ], { traits: ['life-of-party', 'reckless', 'rebel'], tags: ['friends', 'mischief'] }),
  ev('mugged', 'Wrong Alley', 'Walking home late, someone demands your phone and wallet. Your heart pounds.', 18, 55, 1.5, [
    choice('hand', 'Hand it over calmly', 'safe', [money(-250), st('happiness', -4), trait({ id: 'streetwise', label: 'Streetwise', icon: '🕶️', temperament: 'smug' })]),
    choice('run', 'Run and shout', 'gamble', [], gm(0.5, [st('happiness', 1), st('health', 1)], [st('health', -6), money(-350)], 'They fled instead. Your legs shook for an hour.', 'They caught you. A bruised rib and a lost wallet.')),
  ], { tags: ['crime'], sensitive: true, cooldown: 15 }),
  ev('lottery-ticket', 'Scratch Card', 'The shop assistant hands you a free scratch card with your change.', 18, 64, 2, [
    choice('scratch', 'Scratch it right there', 'gamble', [], gm(0.1, [money(2500), st('happiness', 6)], [st('happiness', 0)], 'Matching symbols! The cashier shouted.', 'Nothing. A small sigh.')),
    choice('gift', 'Give it to the next person in line', 'safe', [st('karma', 2), st('happiness', 1)]),
  ], { tags: ['luck', 'money'], traits: ['lucky', 'optimist', 'selfish'] }),

  // =============== AGES 30-49 ===============
  ev('promotion-offer', 'The Big Promotion', 'Your manager offers you a promotion with longer hours and a bigger desk.', 28, 55, 3, [
    choice('accept', 'Take it', 'safe', [money(3000), st('energy', -5), st('happiness', 1)]),
    choice('negotiate', 'Negotiate remote days', 'gamble', [], gm(0.5, [money(3000), st('happiness', 4)], [st('happiness', -2)], 'They agreed. Best of both worlds.', 'They found someone else. The desk was not that big anyway.')),
    choice('decline', 'Decline and keep your evenings', 'safe', [st('happiness', 4), st('energy', 2)]),
  ], { needs: ['job'], tags: ['work', 'money'] }),
  ev('burnout', 'Running on Empty', 'You stare at your screen. The words stop making sense. Your hands shake faintly.', 28, 55, 3, [
    choice('rest', 'Take two weeks off', 'safe', [st('energy', 8), st('happiness', 2), money(-400)]),
    choice('push', 'Push through, double coffee', 'gamble', [flag('ad_burnout')], gm(0.4, [money(1500), st('energy', -4)], [st('health', -7), st('happiness', -7), cond({ id: 'burnout', name: 'Burnout', icon: '🪫', kind: 'mental', severity: 2, chronic: false, diagnosed: true })], 'You hit the deadline and wobbled to bed.', 'You collapsed. Doctor says: stop.')),
  ], { needs: ['job'], tags: ['work', 'health'], traits: ['ambitious', 'perfectionist', 'anxious'], maxStat: { energy: 55 } }),
  ev('burnout-recovery', 'After the Storm', 'Weeks of rest have cleared your head. You wonder what you want your work life to be.', 29, 60, 3, [
    choice('boundaries', 'Set firm boundaries at work', 'safe', [st('happiness', 5), st('energy', 4), money(-500)]),
    choice('career-change', 'Switch careers entirely', 'gamble', [money(-2500)], gm(0.5, [st('happiness', 7), st('smarts', 1)], [st('happiness', -3)], 'A fresh start, and you love it.', 'The new job is just as stressful, in a different font.')),
    choice('hustle', 'Dive straight back in', 'risky', [trait({ id: 'workaholic', label: 'Workaholic', icon: '🗂️', temperament: 'anxious' }), money(1500), st('health', -3)]),
  ], { flags: ['ad_burnout'], once: true, tags: ['work', 'health'] }),
  ev('whistle', 'Something Is Off', 'You spot numbers in the quarterly report that do not add up. Your boss waves it off.', 30, 58, 2, [
    choice('report', 'Report it to compliance', 'gamble', [flag('ad_whistle')], gm(0.5, [st('karma', 6), st('happiness', 3), st('smarts', 1)], [st('karma', 3), st('happiness', -7), money(-2500)], 'It was fraud. They thanked you, quietly.', 'You were sidelined and shown the door.')),
    choice('quiet', 'Stay quiet', 'safe', [st('karma', -4), st('happiness', -2)]),
    choice('leave', 'Quietly resign', 'safe', [st('karma', -1), money(-800), st('happiness', 1)]),
  ], { needs: ['job'], tags: ['work', 'crime'], once: true }),
  ev('whistle-after', 'The Aftermath', 'Months after you spoke up, a journalist wants to interview you. Some colleagues glare. Some secretly thank you.', 31, 62, 2, [
    choice('interview', 'Give the interview', 'gamble', [], gm(0.55, [st('happiness', 5), st('karma', 3), money(1000)], [st('happiness', -5), money(-1500)], 'It was fair and brave. A job offer follows.', 'They twisted your words. Your inbox is hateful.')),
    choice('private', 'Decline and keep your head down', 'safe', [st('happiness', 1)]),
  ], { flags: ['ad_whistle'], once: true, tags: ['work', 'fame'] }),
  ev('new-baby', 'Two Pink Lines', 'The test says positive. Your stomach flips like a trampoline.', 22, 44, 3, [
    choice('celebrate', 'Celebrate with a nervous grin', 'safe', [st('happiness', 6), money(-1000), flag('ad_new_parent')]),
    choice('plan', 'Make a detailed plan and spreadsheet', 'safe', [st('smarts', 1), money(-600), st('happiness', 3), flag('ad_new_parent')]),
  ], { needs: ['partner'], forbids: ['ad_new_parent'], tags: ['family', 'love'], once: true }),
  ev('sleepless-nights', 'The Midnight Shift', 'The baby cries at 3am. And 4am. You have learned many lullabies and some swear words.', 22, 45, 3, [
    choice('shift', 'Split night shifts with your partner', 'safe', [st('energy', -4), st('happiness', 2), st('karma', 1)]),
    choice('solo', 'Take it all on yourself', 'risky', [st('energy', -8), st('health', -2), trait({ id: 'devoted-parent', label: 'Devoted Parent', icon: '🍼', temperament: 'gentle' })]),
    choice('help', 'Call in the grandparents', 'safe', [st('energy', 3), st('happiness', 1)]),
  ], { flags: ['ad_new_parent'], needs: ['child'], tags: ['family'], cooldown: 8 }),
  ev('school-run', 'The School Run', 'You are late for work, the kids are late for school, and the car is late for everything.', 28, 50, 3, [
    choice('rush', 'Race to school and work', 'risky', [st('energy', -3), st('happiness', -1)]),
    choice('walk', 'Walk with the kids and be late', 'safe', [st('happiness', 3), st('health', 1)]),
    choice('swap', 'Swap school runs with another parent', 'safe', [st('karma', 2), st('energy', 1)]),
  ], { needs: ['child', 'job'], tags: ['family'] }),
  ev('parent-teacher', 'Parent-Teacher Night', 'The teacher begins with the phrase "a very spirited child".', 28, 50, 3, [
    choice('listen', 'Listen and promise to help', 'safe', [st('happiness', 1), st('smarts', 1)]),
    choice('defend', 'Defend your child fiercely', 'safe', [st('happiness', 2), st('karma', -1)]),
    choice('laugh', 'Laugh later in the car', 'safe', [st('happiness', 3)]),
  ], { needs: ['child'], tags: ['family', 'school'] }),
  ev('kid-recital', 'The Recital', 'Your child is playing a violin solo. Brace yourself. Your ears may not forgive you.', 29, 52, 2, [
    choice('film', 'Film every second', 'safe', [st('happiness', 4), st('energy', -1)]),
    choice('cry', 'Cry quietly with pride', 'safe', [st('happiness', 5)]),
    choice('skip', 'Skip it for a work meeting', 'risky', [money(500), st('happiness', -4), st('karma', -2)]),
  ], { needs: ['child'], tags: ['family', 'creativity'] }),
  ev('couple-fight', 'The Dishes Fight', 'It started with dishes. Now it is about who does what, in the whole relationship, forever.', 26, 55, 3, [
    choice('apologise', 'Apologise first', 'safe', [st('happiness', 2), st('karma', 1)]),
    choice('counsel', 'Suggest counselling', 'safe', [money(-400), st('happiness', 3), st('smarts', 1)]),
    choice('sleep-on', 'Sleep on the sofa', 'risky', [st('happiness', -3)]),
  ], { needs: ['partner'], tags: ['love'] }),
  ev('anniversary', 'Anniversary Dinner', 'You and your partner have been married years. Somebody forgot something.', 28, 62, 3, [
    choice('lavish', 'Book a fancy restaurant', 'safe', [money(-350), st('happiness', 5)]),
    choice('home', 'Cook together at home', 'safe', [st('happiness', 4), st('health', 1)]),
    choice('forget', 'Forget completely', 'risky', [st('happiness', -5), st('karma', -1)]),
  ], { flags: ['ad_married'], needs: ['partner'], tags: ['love'], cooldown: 4 }),
  ev('marriage-rough', 'Two Strangers', 'Years in, you realise you are polite roommates who share a surname. Something needs to change.', 32, 58, 2, [
    choice('rekindle', 'Plan a getaway and rediscover each other', 'gamble', [money(-1500)], gm(0.6, [st('happiness', 7)], [st('happiness', -3)], 'It felt like old times.', 'It brought up every old argument at once.')),
    choice('therapy', 'Start couples therapy', 'safe', [money(-1200), st('happiness', 3), st('smarts', 1)]),
    choice('separate', 'Talk about separating', 'risky', [st('happiness', -4), money(-2000)]),
  ], { flags: ['ad_married'], needs: ['partner'], tags: ['love'], sensitive: true, once: true }),
  ev('divorce-papers', 'The Papers', 'A thick envelope arrives. It is polite and brutal at the same time.', 30, 60, 2, [
    choice('amicable', 'Keep it amicable', 'safe', [money(-3000), st('happiness', -4), st('karma', 2), st('smarts', 1)]),
    choice('fight', 'Fight for everything', 'gamble', [money(-5000), st('karma', -2)], gm(0.45, [money(6000), st('happiness', 1)], [money(-3000), st('happiness', -6)], 'You came out ahead, tired, richer, lonelier.', 'Lawyers took more than your ex did.')),
  ], { flags: ['ad_married'], needs: ['partner'], sensitive: true, tags: ['love', 'money'], once: true }),
  ev('single-again', 'Starting Over', 'Being single in your late thirties feels like re-entering a game with all new rules.', 32, 50, 2, [
    choice('reinvent', 'Reinvent yourself: new hair, new hobby', 'safe', [money(-300), st('looks', 2), st('happiness', 4)]),
    choice('friends', 'Lean on friends', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('work', 'Pour yourself into work', 'safe', [money(1200), st('happiness', -2), st('energy', -3)]),
  ], { needs: ['single'], tags: ['love', 'friends'] }),
  ev('house-hunt', 'House Hunting', 'You tour a dozen houses. Every kitchen is "full of potential" and every mortgage is full of numbers.', 28, 50, 3, [
    choice('buy', 'Put in an offer on the fixer-upper', 'gamble', [money(-6000)], gm(0.6, [st('happiness', 5), money(2500)], [st('happiness', -4), money(-5000)], 'A good eye. It is already rising in value.', 'The roof, the pipes, and the damp. A money pit.')),
    choice('rent', 'Keep renting and stay flexible', 'safe', [st('happiness', 1)]),
    choice('dream', 'Buy the dream home and stretch', 'risky', [money(-12000), st('happiness', 6)]),
  ], { needs: ['job'], tags: ['money', 'family'], cooldown: 12 }),
  ev('mortgage-stress', 'Rates Rise', 'The bank announces higher interest rates. Your mortgage statement looks different now.', 30, 60, 2, [
    choice('tighten', 'Tighten your belt', 'safe', [money(-1500), st('happiness', -3), st('smarts', 1)]),
    choice('extra', 'Take extra shifts', 'safe', [money(-500), st('energy', -4)]),
    choice('remortgage', 'Shop for a better deal', 'gamble', [], gm(0.6, [money(1000), st('smarts', 1)], [money(-2000), st('happiness', -3)], 'You saved a bundle.', 'The fees swallowed the savings.')),
  ], { needs: ['job', 'inDebt'], tags: ['money'] }),
  ev('broke-month', 'Rent Day Panic', 'The account balance says 14 and the rent says 1,100. Maths is not on your side.', 20, 60, 3, [
    choice('family', 'Ask family for a loan', 'safe', [money(1000), st('happiness', -2), st('karma', -1)]),
    choice('gig', 'Take odd jobs for a week', 'safe', [money(700), st('energy', -5)]),
    choice('sell', 'Sell something you love', 'safe', [money(500), st('happiness', -3)]),
  ], { needs: ['broke'], tags: ['money'] }),
  ev('debt-collector', 'Knock on the Door', 'A collection agent is on the phone again, a bit too friendly and a bit too persistent.', 24, 60, 3, [
    choice('plan', 'Set up a payment plan', 'safe', [money(-800), st('happiness', 1), st('smarts', 1)]),
    choice('ignore', 'Ignore the calls', 'risky', [st('happiness', -3)]),
    choice('negotiate', 'Negotiate a settlement', 'gamble', [], gm(0.5, [money(-300), st('happiness', 3)], [money(-1200), st('happiness', -3)], 'They took less than half.', 'They refused and added fees.')),
  ], { needs: ['inDebt'], tags: ['money'] }),
  ev('windfall-bonus', 'Surprise Bonus', 'Your boss hands you an envelope at the end of a rough year. Inside: more than you expected.', 25, 58, 2, [
    choice('spend', 'Spend it on something fun', 'safe', [money(1800), st('happiness', 5)]),
    choice('save', 'Save it for a rainy day', 'safe', [money(2500), st('smarts', 1)]),
    choice('share', 'Share some with family', 'safe', [money(1200), st('karma', 4), st('happiness', 3)]),
  ], { needs: ['job'], tags: ['money', 'work'] }),
  ev('investment-club', 'Investment Club', 'Colleagues start a monthly investment club. You think of tulips and tulips-based pyramids.', 28, 58, 2, [
    choice('join', 'Join with a modest sum', 'gamble', [money(-1000)], gm(0.55, [money(2200), st('smarts', 1)], [st('happiness', -2)], 'Slow, steady, and a little smug.', 'The club picked all the wrong picks.')),
    choice('pass', 'Pass and read a book instead', 'safe', [st('smarts', 1)]),
  ], { needs: ['job'], tags: ['money', 'work'], traits: ['logical', 'ambitious'] }),
  ev('bill-shock', 'Bill Shock', 'An unexpected bill lands: car, tax, or a boiler with feelings. Probably all three.', 26, 62, 3, [
    choice('pay', 'Pay in full', 'safe', [money(-1200), st('happiness', -2)]),
    choice('instalments', 'Pay in instalments', 'safe', [money(-300), st('happiness', -1), st('energy', -1)]),
    choice('dispute', 'Dispute the bill', 'gamble', [], gm(0.4, [st('smarts', 1), st('happiness', 3)], [money(-1500), st('happiness', -3)], 'It was an error. You win!', 'It was not. Fees apply.')),
  ], { tags: ['money'] }),
  ev('tax-audit', 'Letter From the Tax Office', 'The tax office wants a "friendly chat" about last year’s numbers.', 28, 62, 2, [
    choice('honest', 'Bring neat records', 'gamble', [], gm(0.8, [st('smarts', 1), st('happiness', 2)], [money(-900), st('happiness', -3)], 'Everything checked out.', 'A small error, a bigger fine.')),
    choice('accountant', 'Hire an accountant', 'safe', [money(-500), st('happiness', 1)]),
  ], { tags: ['money'], needs: ['job'] }),
  ev('layoff-mid', 'The Redundancy Letter', 'A big company-wide restructure. Your name is on the list, nobody meets your eyes.', 35, 58, 2, [
    choice('severance', 'Take the package and regroup', 'safe', [money(5000), st('happiness', -5), st('energy', 3)]),
    choice('retrain', 'Retrain for a new field', 'safe', [money(-1800), st('smarts', 2), st('happiness', -1)]),
    choice('freelance', 'Go freelance', 'gamble', [], gm(0.45, [money(5000), st('happiness', 5)], [money(-1500), st('happiness', -4)], 'Clients came in, to your surprise.', 'Invoices went unpaid and silence grew loud.')),
  ], { needs: ['job'], sensitive: true, tags: ['work', 'money'], cooldown: 10 }),
  ev('job-hunt-slog', 'Hundred Applications', 'The job hunt drags on. You are now an expert in cover letters, and in rejection.', 25, 62, 3, [
    choice('network', 'Network and reconnect with old colleagues', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('volunteer', 'Volunteer while looking', 'safe', [st('karma', 3), st('happiness', 2)]),
    choice('pivot', 'Apply for something unexpected', 'gamble', [], gm(0.35, [money(1500), st('happiness', 5)], [st('happiness', -3)], 'To your surprise, they called you back.', 'Another polite no.')),
  ], { needs: ['noJob'], tags: ['work'] }),
  ev('wealthy-friend', 'Expensive Friends', 'A wealthy friend invites you on a luxury trip. You can barely afford the coffee they take for granted.', 25, 55, 2, [
    choice('go', 'Join them and splurge', 'risky', [money(-2200), st('happiness', 5), st('karma', -1)]),
    choice('cheap', 'Suggest a cheaper plan', 'safe', [money(-400), st('happiness', 3), st('karma', 1)]),
    choice('decline', 'Decline with a joke', 'safe', [st('happiness', -1)]),
  ], { needs: ['broke'], tags: ['friends', 'money'] }),
  ev('rich-problems', 'Everyone Has a Plan for Your Money', 'Relatives, friends and strangers all have "an opportunity" that needs your investment.', 30, 64, 3, [
    choice('lend', 'Lend to a relative', 'gamble', [money(-3000)], gm(0.4, [money(3500), st('karma', 4)], [st('happiness', -3), st('karma', 1)], 'They paid you back with interest.', 'You will never see it again. At least you tried.')),
    choice('charity', 'Give to a favourite charity', 'safe', [money(-2000), st('karma', 6), st('happiness', 4)]),
    choice('refuse', 'Politely refuse everyone', 'safe', [st('happiness', -1), st('karma', -2)]),
  ], { needs: ['wealthy'], tags: ['money', 'family'] }),
  ev('yacht-party', 'The Invitation', 'You are invited to a very glamorous party. Everyone knows everyone. You know the bartender.', 30, 62, 2, [
    choice('mingle', 'Mingle with confidence', 'gamble', [], gm(0.5, [st('happiness', 4), money(2000)], [st('happiness', -2)], 'You made useful contacts, and ate tiny sandwiches.', 'You spilled a drink on someone important.')),
    choice('bar', 'Befriend the bartender', 'safe', [st('happiness', 3), st('karma', 1)]),
  ], { needs: ['wealthy'], tags: ['fame', 'friends'] }),
  ev('health-scare-lump', 'Something Not Right', 'You notice a lump you do not recognise. You Google it. The internet is not kind.', 30, 64, 2, [
    choice('doctor', 'Book an appointment today', 'safe', [money(-150), st('happiness', -2), st('health', 1)]),
    choice('wait', 'Wait and see', 'gamble', [], gm(0.6, [st('happiness', 1)], [st('health', -8), st('happiness', -6)], 'It went away on its own.', 'It grew. You should have gone sooner.')),
  ], { tags: ['health'], sensitive: true, traits: ['anxious', 'cautious', 'stoic-heart'] }),
  ev('checkup-results', 'Check-Up Results', 'The routine check-up is back. The doctor says your cholesterol deserves some respect.', 35, 64, 3, [
    choice('change', 'Change your habits', 'safe', [st('health', 4), st('happiness', -1), money(-200)]),
    choice('meds', 'Take the medication', 'safe', [st('health', 2), money(-300)]),
    choice('ignore', 'Ignore it', 'risky', [st('health', -3), st('happiness', 1)]),
  ], { tags: ['health'] }),
  ev('back-pain', 'Lower Back Lament', 'You bent to pick up a sock and your back declared war.', 32, 64, 3, [
    choice('physio', 'See a physio', 'safe', [money(-350), st('health', 2)]),
    choice('yoga', 'Take up yoga', 'safe', [money(-120), st('health', 2), st('happiness', 1)]),
    choice('tough', 'Tough it out', 'gamble', [], gm(0.5, [st('happiness', 1)], [st('health', -4), cond({ id: 'back-pain', name: 'Chronic Back Pain', icon: '🦴', kind: 'injury', severity: 1, chronic: true, diagnosed: true })], 'It faded after a week.', 'It never fully went away.')),
  ], { tags: ['health'] }),
  ev('mental-slump', 'The Grey Months', 'Colours seem washed out. Mornings are heavy and nights are long. You are not quite yourself.', 28, 62, 2, [
    choice('therapy', 'Find a therapist', 'safe', [money(-800), st('happiness', 4), st('smarts', 1)]),
    choice('friend', 'Open up to a friend', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('bottle', 'Push it down with a few drinks', 'risky', [st('happiness', -2), st('health', -3), flag('drinker')]),
  ], { sensitive: true, tags: ['health'], cooldown: 10 }),
  ev('sober-journey', 'Dry January and Beyond', 'You wake up after another heavy night and decide: maybe this is enough.', 28, 60, 2, [
    choice('quit', 'Quit drinking', 'safe', [st('health', 5), st('happiness', 2), st('looks', 1), flag('ad_sober')]),
    choice('cut', 'Cut back', 'safe', [st('health', 2)]),
    choice('shrug', 'Shrug and carry on', 'risky', [st('health', -3), st('happiness', 1)]),
  ], { flags: ['drinker'], tags: ['health'], sensitive: true, once: true }),
  ev('smoker-lungs', 'Breathless on the Stairs', 'You are breathless after one flight. The stairs seem steeper than last year.', 32, 62, 3, [
    choice('quit', 'Quit smoking, for real', 'gamble', [money(-100)], gm(0.5, [st('health', 5), st('happiness', 2)], [st('happiness', -2), st('health', 1)], 'The first month was grim. After that, so much better.', 'You quit for three weeks. Then you did not.')),
    choice('laugh', 'Laugh it off', 'risky', [st('health', -3)]),
  ], { flags: ['smoker'], tags: ['health'] }),
  ev('midlife-car', 'Midlife Motor', 'A shiny sports car in a showroom window is looking at you. You are looking back.', 38, 55, 2, [
    choice('buy', 'Buy it', 'risky', [money(-9000), st('happiness', 6), st('looks', 1), flag('ad_midlife_car')]),
    choice('test', 'Take a test drive and leave smiling', 'safe', [st('happiness', 3)]),
    choice('bike', 'Buy a bicycle instead', 'safe', [money(-500), st('health', 3), st('happiness', 2)]),
  ], { flags: ['can_drive'], needs: ['job'], tags: ['money', 'adventure'], once: true }),
  ev('midlife-car-regret', 'Insurance Quote', 'The insurance quote for your sports car arrives. It has four digits and an unkind tone.', 38, 60, 2, [
    choice('pay', 'Pay it and drive with a smile', 'safe', [money(-1500), st('happiness', 1)]),
    choice('sell', 'Sell it and sigh', 'safe', [money(4000), st('happiness', -3)]),
  ], { flags: ['ad_midlife_car'], once: true, tags: ['money'] }),
  ev('midlife-crisis', 'The Mirror Moment', 'You look in the mirror and ask: is this it? The answer is complicated.', 38, 54, 3, [
    choice('adventure', 'Book a wild trip', 'safe', [money(-2500), st('happiness', 6), st('health', 1)]),
    choice('therapy', 'Talk it out with a professional', 'safe', [money(-600), st('happiness', 3), st('smarts', 1)]),
    choice('reinvent', 'Change your career dramatically', 'gamble', [], gm(0.45, [st('happiness', 8), money(1000)], [st('happiness', -4), money(-3000)], 'You finally feel like yourself.', 'It was a mistake, but a memorable one.')),
  ], { tags: ['adventure'], once: true }),
  ev('marathon', 'Marathon Dare', 'A friend bets you cannot run a marathon. You say something you instantly regret.', 28, 50, 2, [
    choice('train', 'Train for months', 'gamble', [st('energy', -3), st('health', 3)], gm(0.65, [st('happiness', 7), st('health', 2), log('🏃', 'You finished a marathon, barely, and cried a lot.')], [st('health', -4), st('happiness', -2)], 'You crossed the finish line with legs like noodles.', 'You pulled a muscle at mile 18.')),
    choice('bet', 'Pay the bet and decline', 'safe', [money(-100), st('happiness', -1)]),
  ], { tags: ['sports', 'friends'], traits: ['athletic', 'daredevil', 'disciplined'] }),
  ev('hobby-garden', 'The Allotment', 'The council offers you a plot of land. It is mostly weeds and ambition.', 30, 60, 2, [
    choice('dig', 'Grow your own vegetables', 'safe', [money(-80), st('health', 3), st('happiness', 4)]),
    choice('flowers', 'Plant a wildflower patch', 'safe', [st('happiness', 5), st('karma', 1)]),
    choice('decline', 'Decline and enjoy weekends', 'safe', [st('energy', 1)]),
  ], { tags: ['nature'], traits: ['green-thumb', 'homebody'] }),
  ev('novel-draft', 'The Novel in the Drawer', 'You finally open the file you have been avoiding for years: your half-finished novel.', 28, 58, 2, [
    choice('write', 'Write a chapter a week', 'gamble', [flag('ad_novel'), st('energy', -2)], gm(0.4, [st('happiness', 6), st('smarts', 1)], [st('happiness', -1)], 'It has a real shape now.', 'Chapter 4 is hopeless. Chapter 5 is worse.')),
    choice('drawer', 'Return it to the drawer', 'safe', [st('happiness', -1)]),
  ], { tags: ['creativity'], traits: ['creative', 'bookworm', 'daydreamer'] }),
  ev('publisher-reply', 'Email From a Publisher', 'An email arrives. The subject line says: "Regarding your manuscript."', 30, 62, 2, [
    choice('sign', 'Sign the deal', 'gamble', [], gm(0.45, [money(3500), st('happiness', 8), log('📖', 'Your novel was published.')], [st('happiness', -4)], 'A real, printed book with your name on it.', 'Turned out to be a vanity press. Ouch.')),
    choice('selfpub', 'Self-publish instead', 'safe', [money(-400), st('happiness', 3), st('karma', 1)]),
  ], { flags: ['ad_novel'], once: true, tags: ['creativity', 'fame'] }),
  ev('neighbour-feud', 'The Hedge War', 'The hedge between your house and next door is ten centimetres taller than the law says. Both sides claim it.', 30, 64, 3, [
    choice('trim', 'Trim it politely', 'safe', [st('happiness', 1), st('karma', 1)]),
    choice('escalate', 'Install a taller fence', 'risky', [money(-400), st('karma', -2), flag('ad_feud')]),
    choice('cake', 'Bake them a cake', 'safe', [money(-15), st('happiness', 3), st('karma', 2)]),
  ], { tags: ['mischief'], needs: ['job'] }),
  ev('neighbour-truce', 'Peace Offering', 'The neighbour you feuded with leaves a tomato plant on your doorstep with a note: "Truce?"', 31, 64, 3, [
    choice('accept', 'Accept the truce', 'safe', [st('happiness', 4), st('karma', 3)]),
    choice('hold', 'Hold your grudge a little longer', 'safe', [st('happiness', 1), st('karma', -2)]),
  ], { flags: ['ad_feud'], once: true, tags: ['mischief'] }),
  ev('block-party', 'Street Party', 'The street plans a summer block party. Somebody needs to bring the grill and the courage.', 28, 64, 3, [
    choice('host', 'Host it at your place', 'safe', [money(-250), st('happiness', 5), st('karma', 2)]),
    choice('attend', 'Show up with a dish', 'safe', [st('happiness', 3)]),
    choice('avoid', 'Peek through the curtains', 'safe', [st('happiness', -1), st('energy', 1)]),
  ], { tags: ['friends', 'food'] }),
  ev('community-board', 'Community Meeting', 'The council plans to close the local park. A flyer asks for volunteers to fight it.', 30, 64, 3, [
    choice('lead', 'Lead the campaign', 'gamble', [st('energy', -4)], gm(0.5, [st('karma', 5), st('happiness', 5), log('🌳', 'You helped save the neighbourhood park.')], [st('happiness', -2)], 'The council relented.', 'You lost, but made friends along the way.')),
    choice('sign', 'Sign the petition', 'safe', [st('karma', 1)]),
    choice('ignore', 'Let someone else handle it', 'safe', [st('karma', -1)]),
  ], { tags: ['nature', 'friends'], traits: ['kind', 'loyal', 'rebel'] }),
  ev('coach-kids', 'Weekend Coach', 'The local kids’ football team needs a coach. You know the offside rule only vaguely.', 30, 55, 2, [
    choice('coach', 'Volunteer', 'safe', [st('karma', 3), st('happiness', 4), st('energy', -3)]),
    choice('snack', 'Provide orange slices from the sidelines', 'safe', [st('karma', 1), st('happiness', 1)]),
  ], { needs: ['child'], tags: ['sports', 'family'] }),
  ev('old-flame', 'Ghost of Romance Past', 'You bump into an old flame. They look wonderful and ask how you have been.', 28, 55, 2, [
    choice('coffee', 'Grab a coffee', 'gamble', [], gm(0.5, [st('happiness', 4)], [st('happiness', -3), st('karma', -1)], 'It was sweet and closed an old chapter.', 'It opened old wounds.')),
    choice('wave', 'Wave and keep walking', 'safe', [st('happiness', 1)]),
  ], { tags: ['love'] }),
  ev('parent-health', 'Phone Call From Home', 'Your mum calls. She says it is nothing. Her voice says otherwise.', 36, 62, 3, [
    choice('visit', 'Drop everything and visit', 'safe', [money(-300), st('energy', -3), st('karma', 3), flag('ad_caregiver')]),
    choice('call', 'Call every day instead', 'safe', [st('happiness', -1), st('karma', 1)]),
    choice('busy', 'Promise to visit next month', 'risky', [st('karma', -3), st('happiness', -2)]),
  ], { tags: ['family', 'health'], sensitive: true, once: true }),
  ev('caregiver-strain', 'Caring for Mum', 'You juggle appointments, pills, groceries and your own life. Your sleep is a rumour.', 38, 64, 3, [
    choice('carry', 'Carry on, no matter what', 'risky', [st('energy', -7), st('health', -2), st('karma', 4)]),
    choice('help', 'Hire a part-time carer', 'safe', [money(-1800), st('energy', 3), st('happiness', 1)]),
    choice('siblings', 'Call a family meeting', 'gamble', [], gm(0.5, [st('energy', 4), st('happiness', 3), st('karma', 1)], [st('happiness', -4)], 'Everyone agreed to chip in.', 'It became a loud argument about who does what.')),
  ], { flags: ['ad_caregiver'], tags: ['family', 'health'], sensitive: true, cooldown: 4 }),
  ev('wanderlust', 'Passport Itch', 'A travel documentary is on and your feet are twitching. Your holiday balance is unused.', 25, 60, 3, [
    choice('city', 'Weekend in a foreign city', 'safe', [money(-900), st('happiness', 4)]),
    choice('road', 'Epic road trip', 'gamble', [money(-600)], gm(0.65, [st('happiness', 6), st('smarts', 1)], [st('happiness', -2), money(-500)], 'The playlist, the sunrise, perfection.', 'A flat tyre, a huge storm, a cold motel.')),
    choice('staycation', 'Staycation with snacks', 'safe', [money(-100), st('happiness', 2), st('energy', 3)]),
  ], { tags: ['travel'], traits: ['wanderer', 'foodie', 'daredevil'] }),
  ev('lost-luggage', 'Lost Luggage', 'Your bag has taken a different holiday from you. It is in a country you are not.', 25, 64, 2, [
    choice('complain', 'Complain, sternly and loudly', 'safe', [money(300), st('happiness', -1)]),
    choice('shop', 'Buy new clothes and call it a gift', 'safe', [money(-400), st('looks', 1), st('happiness', 2)]),
    choice('wait', 'Wait with a smile', 'safe', [st('happiness', 1), st('karma', 1)]),
  ], { tags: ['travel'] }),
  ev('foodie-trip', 'Street Food Quest', 'You find a legendary food stall. The queue is long and the smell is divine.', 25, 60, 2, [
    choice('queue', 'Wait in line for an hour', 'gamble', [money(-15)], gm(0.8, [st('happiness', 5)], [st('health', -3), st('happiness', -1)], 'The best meal of the decade.', 'Delicious, then deeply regrettable.')),
    choice('safe-meal', 'Eat at the hotel instead', 'safe', [money(-40), st('happiness', 1)]),
  ], { tags: ['food', 'travel'], traits: ['foodie', 'wanderer'] }),
  ev('learn-language', 'Hello, Hola, Bonjour', 'You decide to learn a new language. Duolingo’s owl is already judging you.', 22, 60, 2, [
    choice('commit', 'Commit to daily lessons', 'safe', [st('smarts', 3), st('energy', -1)]),
    choice('class', 'Join an evening class', 'safe', [money(-250), st('smarts', 2), st('happiness', 2)]),
    choice('quit', 'Quit after day three', 'safe', [st('happiness', -1)]),
  ], { tags: ['school', 'travel'], traits: ['curious', 'bookworm', 'wanderer'] }),
  ev('tech-meltdown', 'Everything Crashed', 'Your laptop dies the night before a deadline. It takes your files and your calm with it.', 22, 55, 2, [
    choice('backup', 'Restore from your backup', 'safe', [st('smarts', 1), st('happiness', 2)]),
    choice('repair', 'Pay for emergency recovery', 'safe', [money(-450), st('energy', -1)]),
    choice('redo', 'Start over from scratch', 'risky', [st('energy', -5), st('happiness', -2)]),
  ], { needs: ['job'], tags: ['tech', 'work'] }),
  ev('family-it', 'Unpaid IT Support', 'Your family calls you at 9pm: the Wi-Fi is "broken". It is a loose plug.', 22, 55, 3, [
    choice('fix', 'Walk them through it patiently', 'safe', [st('karma', 2), st('happiness', 1)]),
    choice('visit', 'Drive over and fix it', 'safe', [st('karma', 3), st('energy', -2)]),
    choice('refuse', 'Mute your phone', 'safe', [st('karma', -1), st('energy', 2)]),
  ], { tags: ['tech', 'family'], traits: ['tech-savvy', 'logical'] }),
  ev('identity-theft', 'Identity Trouble', 'Your card is declined. A stranger has been shopping with your name.', 24, 60, 1.5, [
    choice('bank', 'Call the bank and freeze everything', 'safe', [money(-250), st('energy', -3)]),
    choice('detective', 'Investigate it yourself', 'gamble', [], gm(0.35, [st('smarts', 2), st('karma', 1), st('happiness', 2)], [money(-1200), st('happiness', -4)], 'You helped trace the crook.', 'You wasted a week and lost more.')),
  ], { tags: ['crime', 'tech', 'money'] }),
  ev('pyramid-friend', 'Business Opportunity', 'An old friend invites you to a "business opportunity". It involves buying starter kits and recruiting friends.', 22, 50, 2, [
    choice('join', 'Buy the starter kit', 'gamble', [money(-900)], gm(0.1, [money(3000), st('happiness', 3)], [st('karma', -2), st('happiness', -4)], 'A rare winner.', 'You now own forty bottles of shampoo and lost a friend.')),
    choice('decline', 'Decline kindly and say no more', 'safe', [st('smarts', 1), st('karma', 1)]),
    choice('expose', 'Warn others about it', 'safe', [st('karma', 3), st('happiness', -1)]),
  ], { tags: ['money'] }),
  ev('office-romance', 'Office Spark', 'A coworker keeps stopping by your desk. Everyone else at the office noticed first.', 22, 45, 2, [
    choice('ask', 'Ask them out', 'gamble', [], gm(0.5, [st('happiness', 5), st('looks', 1)], [st('happiness', -4)], 'Sparks flew, and HR does not care.', 'Awkward. Every meeting is awkward now.')),
    choice('keep', 'Keep it professional', 'safe', [st('smarts', 1)]),
  ], { needs: ['single', 'job'], tags: ['love', 'work'] }),
  ev('friends-drift', 'Drifting Apart', 'You realise you have not seen your oldest friend in two years. Life got busy.', 30, 55, 3, [
    choice('reach', 'Send a long message', 'gamble', [], gm(0.7, [st('happiness', 5), st('karma', 1)], [st('happiness', -2)], 'They replied within minutes.', 'No reply. The silence feels heavy.')),
    choice('visit', 'Book a train and surprise them', 'safe', [money(-250), st('happiness', 5)]),
    choice('let', 'Let it fade', 'safe', [st('happiness', -2)]),
  ], { tags: ['friends'] }),
  ev('group-trip', 'The Group Chat Plan', 'A group chat of six friends is planning a holiday. After four hundred messages, nothing is decided.', 24, 48, 2, [
    choice('book', 'Take charge and book it', 'gamble', [money(-700)], gm(0.7, [st('happiness', 6), st('karma', 1)], [st('happiness', -2)], 'Everyone thanked you.', 'Half the group cancelled the night before.')),
    choice('wait', 'Wait for someone else', 'safe', [st('happiness', -1)]),
  ], { tags: ['friends', 'travel'] }),
  ev('toddler-tantrum', 'Supermarket Meltdown', 'Your toddler flops on the floor in the cereal aisle and screams about a banana.', 24, 45, 3, [
    choice('calm', 'Kneel and negotiate gently', 'safe', [st('happiness', 1), st('smarts', 1)]),
    choice('bribe', 'Hand over the banana', 'safe', [st('happiness', 2), money(-2)]),
    choice('leave', 'Abandon the trolley and leave', 'safe', [st('energy', -2), st('happiness', -1)]),
  ], { needs: ['child'], tags: ['family', 'food'] }),
  ev('single-parent', 'Doing It All', 'It is you, the child, and a mountain of laundry. Nobody can help tonight.', 24, 50, 3, [
    choice('grit', 'Grit your teeth and manage', 'risky', [st('energy', -5), st('karma', 2), trait({ id: 'devoted-parent', label: 'Devoted Parent', icon: '🍼', temperament: 'gentle' })]),
    choice('ask', 'Ask a friend for help', 'safe', [st('happiness', 2), st('energy', 2)]),
    choice('paid', 'Pay for a babysitter', 'safe', [money(-250), st('energy', 3)]),
  ], { needs: ['child', 'single'], tags: ['family'] }),
  ev('co-parent-clash', 'Different Parenting Styles', 'You and your partner disagree about bedtime, screens, and whether sugar is a food group.', 28, 48, 2, [
    choice('compromise', 'Write down shared rules', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('stand', 'Stand your ground', 'risky', [st('happiness', -2), st('karma', -1)]),
    choice('joke', 'Break the tension with a pillow fight', 'safe', [st('happiness', 3)]),
  ], { needs: ['child', 'partner'], tags: ['family', 'love'] }),
  ev('lost-wallet', 'Found Wallet', 'You find a thick wallet on a bench. There is an address inside and a lot of cash.', 20, 64, 2, [
    choice('return', 'Return it to the owner', 'safe', [st('karma', 5), st('happiness', 2)]),
    choice('keep', 'Keep the cash', 'risky', [money(500), st('karma', -5), st('happiness', -1)]),
    choice('police', 'Hand it to the police', 'safe', [st('karma', 3)]),
  ], { tags: ['luck', 'money'] }),
  ev('volunteer-flood', 'Flood Night', 'Heavy rain floods the street. The community needs sandbags and warm hands.', 22, 64, 2, [
    choice('help', 'Help for the whole night', 'safe', [st('karma', 5), st('energy', -4), st('happiness', 3)]),
    choice('donate', 'Donate supplies from home', 'safe', [money(-150), st('karma', 3)]),
    choice('stay', 'Stay dry and watch the news', 'safe', [st('karma', -2), st('energy', 1)]),
  ], { tags: ['nature', 'friends'] }),
  ev('jury-duty', 'Jury Summons', 'A summons arrives. Your civic duty is on a collision course with your calendar.', 25, 64, 2, [
    choice('serve', 'Serve with an open mind', 'safe', [st('karma', 2), st('smarts', 1), st('energy', -2)]),
    choice('excuse', 'Plead work commitments', 'gamble', [], gm(0.5, [st('energy', 2)], [st('karma', -1), money(-150)], 'Excused. Unfairly smug.', 'The judge was not impressed. A fine.')),
  ], { needs: ['job'], tags: ['crime'] }),
  ev('misdelivered-parcel', 'The Wrong Parcel', 'A very large parcel meant for your neighbour arrives at your door. It is wobbling.', 20, 60, 1.5, [
    choice('open', 'Open it just a little', 'gamble', [], gm(0.5, [st('happiness', 4)], [st('karma', -2), st('happiness', -1)], 'It contained a ridiculous, wonderful garden gnome.', 'It was a very personal item. You regret everything.')),
    choice('deliver', 'Deliver it to the neighbour', 'safe', [st('karma', 2)]),
  ], { tags: ['mischief', 'luck'], cooldown: 12 }),
  ev('stuck-lift', 'Stuck in the Lift', 'The lift stops between floors. Inside: you, a stranger, and a very awkward silence.', 19, 62, 1.5, [
    choice('chat', 'Start a conversation', 'safe', [st('happiness', 3), st('smarts', 1)]),
    choice('sing', 'Sing to pass the time', 'gamble', [], gm(0.5, [st('happiness', 5)], [st('happiness', -2)], 'The stranger joined in on harmony.', 'The stranger asked you to stop. Politely.')),
    choice('phone', 'Pretend to be busy on your phone', 'safe', [st('energy', 1)]),
  ], { tags: ['mischief'], cooldown: 15 }),
  ev('suit-mishap', 'Wardrobe Malfunction', 'Your trousers split in the middle of an important presentation. Everyone saw. Everyone is being nice about it.', 22, 55, 1.5, [
    choice('joke', 'Make a joke and keep going', 'gamble', [], gm(0.6, [st('happiness', 3), st('looks', 1)], [st('happiness', -4)], 'The room loved it. A legend is born.', 'It was awkward. It was still going on.')),
    choice('exit', 'Excuse yourself with dignity', 'safe', [st('happiness', -2)]),
  ], { needs: ['job'], tags: ['work', 'mischief'], cooldown: 15 }),
  ev('pigeon-war', 'The Pigeon Problem', 'A pigeon has moved onto your balcony and believes the lease is its own.', 20, 60, 1.5, [
    choice('befriend', 'Name him Gerald and feed him', 'safe', [st('happiness', 3), money(-10)]),
    choice('fight', 'Declare war with a tin foil armoury', 'safe', [st('happiness', -1), st('energy', -2)]),
    choice('move', 'Block the balcony off', 'safe', [money(-80)]),
  ], { tags: ['pets', 'mischief'], cooldown: 15 }),
  ev('wrong-reply-all', 'Reply All', 'You hit "reply all" with a message about your boss. It is not flattering.', 22, 55, 2, [
    choice('apologise', 'Send a mortified apology', 'safe', [st('happiness', -3), st('karma', 1)]),
    choice('own', 'Own it completely', 'gamble', [], gm(0.4, [st('happiness', 3), st('karma', 1)], [money(-600), st('happiness', -4)], 'Your boss laughed, you survived.', 'It earned you a written warning.')),
    choice('vanish', 'Call in sick for a week', 'safe', [st('happiness', -1), money(-200)]),
  ], { needs: ['job'], tags: ['work', 'tech', 'mischief'], cooldown: 15 }),
  ev('birthday-surprise', 'Surprise Party', 'You open your door and a dozen faces yell "SURPRISE". You almost throw a shoe.', 25, 64, 2, [
    choice('thank', 'Cry happily and hug everyone', 'safe', [st('happiness', 6), st('karma', 1)]),
    choice('overwhelmed', 'Hide in the bathroom for ten minutes', 'safe', [st('happiness', 2), st('energy', -1)]),
  ], { tags: ['friends'], once: true }),

  // =============== AGES 50-64 ===============
  ev('empty-nest', 'The Quiet House', 'Your youngest has left home. The house is quiet. Suspiciously so.', 46, 64, 3, [
    choice('hobby', 'Pick up a long-lost hobby', 'safe', [st('happiness', 5), st('energy', 1)]),
    choice('travel', 'Plan the trip you always postponed', 'safe', [money(-2000), st('happiness', 5)]),
    choice('mope', 'Mope around the kids’ rooms', 'safe', [st('happiness', -3)]),
  ], { needs: ['child'], tags: ['family'], once: true }),
  ev('retirement-plan', 'The Numbers Talk', 'A financial adviser slides a chart across the table. The chart looks worried.', 50, 64, 3, [
    choice('save', 'Save aggressively', 'safe', [money(-1500), st('smarts', 1), st('happiness', -1)]),
    choice('balanced', 'Balanced plan, and a holiday', 'safe', [money(-600), st('happiness', 2)]),
    choice('wing', 'Wing it', 'risky', [st('happiness', 1)]),
  ], { needs: ['job'], tags: ['money'] }),
  ev('grey-hairs', 'First Grey Hairs', 'You spot a silver strand and then another. They seem to be multiplying while you sleep.', 40, 64, 2, [
    choice('dye', 'Dye it, quietly', 'safe', [money(-60), st('looks', 1)]),
    choice('embrace', 'Embrace the silver fox', 'safe', [st('happiness', 2), st('karma', 1)]),
    choice('laugh', 'Pluck them dramatically', 'safe', [st('happiness', 1), st('looks', -1)]),
  ], { tags: ['health'], once: true }),
  ev('class-reunion', 'Reunion Invitation', 'A school reunion invitation arrives. You wonder who got bald, who got rich, and who got both.', 45, 64, 2, [
    choice('go', 'Go and show off your best self', 'gamble', [money(-120)], gm(0.6, [st('happiness', 5), st('looks', 1)], [st('happiness', -3)], 'You met people you had missed.', 'Your old rival is somehow doing better. Annoying.')),
    choice('skip', 'Skip it and stay in', 'safe', [st('happiness', 0), st('energy', 1)]),
  ], { tags: ['friends', 'school'] }),
  ev('parent-passing', 'Goodbye, Dad', 'Your father has passed away. The house is full of old stories and unopened mail.', 48, 64, 2, [
    choice('eulogy', 'Give the eulogy', 'safe', [st('happiness', -6), st('karma', 3), st('smarts', 1)]),
    choice('quiet', 'Grieve privately', 'safe', [st('happiness', -5), st('energy', -2)]),
    choice('sort', 'Spend days sorting his belongings', 'safe', [st('happiness', -3), st('karma', 2), log('🕯️', 'You said goodbye to your father.')]),
  ], { sensitive: true, tags: ['grief', 'family'], once: true }),
  ev('inheritance-feud', 'The Will', 'The will is read. One relative gets the clock. Another gets the house. A third is purple with rage.', 50, 64, 2, [
    choice('fair', 'Propose splitting things fairly', 'safe', [st('karma', 4), st('happiness', 1), money(-500)]),
    choice('fight', 'Contest the will', 'gamble', [money(-2000), st('karma', -2)], gm(0.4, [money(8000), st('happiness', -1)], [st('happiness', -5)], 'You won more than expected, at a cost.', 'It cost you more than it was worth.')),
    choice('walk', 'Walk away', 'safe', [st('happiness', 1), st('karma', 2)]),
  ], { sensitive: true, tags: ['family', 'money'], once: true, flags: ['ad_caregiver'] }),
  ev('grandchild-news', 'You Will Be a Grandparent', 'Your child announces: you will be a grandparent. You immediately start knitting something tiny.', 50, 64, 3, [
    choice('thrill', 'Throw a family dinner', 'safe', [money(-200), st('happiness', 6)]),
    choice('advice', 'Shower them with advice', 'risky', [st('happiness', 2), st('karma', -1)]),
    choice('gift', 'Buy a ridiculous number of toys', 'safe', [money(-500), st('happiness', 4)]),
  ], { needs: ['child'], tags: ['family'], once: true }),
  ev('menopause-mood', 'The Change', 'Your body is changing again. Hot flashes, mood swings and surprise sweating at the worst moments.', 45, 58, 2, [
    choice('doctor', 'See a doctor about it', 'safe', [money(-150), st('health', 2)]),
    choice('natural', 'Ride it out with exercise and fans', 'safe', [st('health', 1), st('happiness', -1)]),
    choice('joke', 'Turn it into a running joke with friends', 'safe', [st('happiness', 3)]),
  ], { tags: ['health'], cooldown: 8 }),
  ev('knee-op', 'Knee Surgery', 'Your knees filed a formal complaint. The surgeon suggests an operation.', 50, 64, 3, [
    choice('operate', 'Go ahead with the operation', 'gamble', [money(-2500)], gm(0.8, [st('health', 5)], [st('health', -4)], 'You are almost springy again.', 'Recovery was slower than promised.')),
    choice('physio', 'Try physio and patience', 'safe', [money(-500), st('health', 1)]),
    choice('limp', 'Limp on', 'risky', [st('health', -2), st('happiness', -1)]),
  ], { tags: ['health', 'sports'] }),
  ev('heart-scare', 'Chest Tightness', 'A flutter in your chest wakes you at 3am. You sit on the edge of the bed, listening to your own heartbeat.', 50, 64, 2, [
    choice('er', 'Go to the emergency room', 'safe', [money(-900), st('happiness', -2), st('health', 2)]),
    choice('wait', 'Wait until morning', 'gamble', [], gm(0.65, [st('happiness', 1)], [st('health', -10), cond({ id: 'heart-condition', name: 'Heart Condition', icon: '🫀', kind: 'illness', severity: 3, chronic: true, diagnosed: true })], 'It was just indigestion. Embarrassing.', 'Your heart needed urgent attention.')),
  ], { tags: ['health'], sensitive: true, cooldown: 10 }),
  ev('late-career-switch', 'Fresh Start at Fifty', 'You think: maybe it is not too late for something completely different.', 50, 62, 2, [
    choice('go', 'Retrain for a new craft', 'gamble', [money(-2500)], gm(0.55, [st('happiness', 7), st('smarts', 2)], [st('happiness', -3)], 'It felt exciting to be a beginner again.', 'It was harder than expected, and expensive.')),
    choice('stay', 'Stay the course', 'safe', [st('happiness', 0), money(1000)]),
  ], { needs: ['job'], tags: ['work', 'school'], traits: ['curious', 'ambitious', 'creative'] }),
  ev('mentor-youngster', 'The Young Colleague', 'A new graduate admires you. They want advice, coffee, and possibly your secrets.', 50, 64, 3, [
    choice('mentor', 'Take them under your wing', 'safe', [st('karma', 4), st('happiness', 3), st('energy', -1)]),
    choice('polite', 'Share a few tips, keep your distance', 'safe', [st('happiness', 1)]),
    choice('scoff', 'Tell them to figure it out', 'safe', [st('karma', -2), st('energy', 1)]),
  ], { needs: ['job'], tags: ['work'] }),
  ev('tech-forced', 'New System Rollout', 'IT rolls out a new system everyone must use. It has seventeen tabs and no manual.', 50, 64, 3, [
    choice('learn', 'Attend every training session', 'safe', [st('smarts', 2), st('energy', -3)]),
    choice('ask', 'Ask the intern to teach you', 'safe', [st('happiness', 2), st('karma', 1)]),
    choice('resist', 'Keep using the old system secretly', 'risky', [st('happiness', 1), money(-200)]),
  ], { needs: ['job'], tags: ['tech', 'work'] }),
  ev('early-retire-offer', 'Early Retirement Package', 'The company offers a generous package to leave early. The lanyard is already feeling heavy.', 55, 64, 2, [
    choice('take', 'Take it and retire', 'safe', [money(8000), st('happiness', 4), st('energy', 4)]),
    choice('decline', 'Decline and keep working', 'safe', [money(1500), st('happiness', -1)]),
    choice('part-time', 'Negotiate part-time', 'gamble', [], gm(0.5, [money(3500), st('happiness', 4)], [st('happiness', -2)], 'They agreed to a four-day week.', 'They said: all or nothing.')),
  ], { needs: ['job'], tags: ['work', 'money'], once: true }),
  ev('wealth-legacy', 'Thinking About Legacy', 'You wonder what your money will become. A scholarship? A building with your name on it?', 52, 64, 2, [
    choice('foundation', 'Create a small scholarship', 'safe', [money(-5000), st('karma', 6), st('happiness', 5)]),
    choice('family', 'Set up a family trust', 'safe', [money(-1500), st('karma', 2), st('happiness', 2)]),
    choice('enjoy', 'Spend it on yourself while you can', 'safe', [money(-4000), st('happiness', 5), st('karma', -1)]),
  ], { needs: ['wealthy'], tags: ['money', 'family'], once: true }),
  ev('sport-comeback', 'The Old Team', 'Your old sports club is short a player and begging. Your joints are shouting a hard "no".', 50, 62, 2, [
    choice('play', 'Lace up the boots once more', 'gamble', [], gm(0.5, [st('happiness', 6), st('health', 1)], [st('health', -5), st('happiness', -1)], 'A goal at fifty-two. The crowd went wild.', 'You pulled something in minute five.')),
    choice('ref', 'Referee instead', 'safe', [st('happiness', 2), st('karma', 1)]),
  ], { tags: ['sports', 'friends'], traits: ['athletic', 'daredevil', 'life-of-party'] }),
  ev('art-exhibit', 'Your Name on a Wall', 'A local gallery asks you to show your paintings. The pieces have been sitting in your garage.', 45, 64, 2, [
    choice('show', 'Say yes', 'gamble', [], gm(0.5, [money(1200), st('happiness', 7), log('🖼️', 'You held your first small exhibition.')], [st('happiness', -2)], 'You sold three pieces and a lot of wine.', 'Only your relatives came.')),
    choice('decline', 'Decline humbly', 'safe', [st('happiness', -1)]),
  ], { tags: ['creativity', 'fame'], traits: ['creative', 'daydreamer'] }),
  ev('pet-passing', 'Goodbye, Old Friend', 'Your faithful cat of many years slips away quietly, curled up on your lap.', 45, 64, 2, [
    choice('bury', 'Bury him in the garden', 'safe', [st('happiness', -5), st('karma', 1)]),
    choice('adopt', 'Visit a shelter after a while', 'safe', [st('happiness', -2), st('karma', 3), money(-200)]),
    choice('memorial', 'Write a poem and frame his photo', 'safe', [st('happiness', -3), st('smarts', 1)]),
  ], { flags: ['ad_cat'], sensitive: true, tags: ['pets', 'grief'], once: true }),
  ev('couple-renewal', 'Renewing Vows', 'Your marriage has weathered storms. Your partner suggests renewing vows on a beach.', 45, 64, 2, [
    choice('yes', 'Say yes and mean it', 'safe', [money(-1200), st('happiness', 7)]),
    choice('private', 'A quiet dinner instead', 'safe', [money(-150), st('happiness', 4)]),
  ], { flags: ['ad_married'], needs: ['partner'], tags: ['love'], once: true }),
  ev('lonely-evenings', 'Quiet Evenings', 'A quiet evening settles in. You are single and the clock ticks louder than usual.', 50, 64, 2, [
    choice('club', 'Join a walking club', 'safe', [st('happiness', 4), st('health', 2)]),
    choice('date', 'Try a mature dating site', 'gamble', [], gm(0.4, [st('happiness', 5)], [st('happiness', -2)], 'You met someone kind and funny.', 'A parade of strange profile photos.')),
    choice('pet', 'Adopt a rescue dog', 'safe', [money(-250), st('happiness', 5), st('health', 1), flag('has_dog')]),
  ], { needs: ['single'], tags: ['love', 'friends'] }),
  ev('scam-phone-adult', 'Bank Security Call', 'A calm voice says your account was compromised and you must "verify" your PIN.', 50, 64, 2, [
    choice('hang', 'Hang up and call your bank', 'safe', [st('smarts', 1), st('karma', 1)]),
    choice('share', 'Give them what they ask for', 'gamble', [], gm(0.2, [st('happiness', 1)], [money(-3500), st('happiness', -6)], 'It was legitimate. Rarely.', 'They emptied your account.')),
  ], { tags: ['crime', 'money', 'tech'] }),
  ev('fire-alarm', 'Fire Drill at 3am', 'Your smoke alarm shrieks. It is a burnt toast situation. It is always a burnt toast situation.', 28, 64, 1.5, [
    choice('ventilate', 'Open the windows and fan it with a tea towel', 'safe', [st('energy', -1), st('happiness', 1)]),
    choice('evacuate', 'Evacuate the whole building', 'safe', [st('karma', 1), st('happiness', -1)]),
    choice('rip', 'Rip the battery out', 'risky', [st('happiness', 1), st('health', -1)]),
  ], { tags: ['mischief', 'food'], cooldown: 15 }),
  ev('handy-project', 'The Great Shed', 'You decide to build a shed yourself. The instructions are in four languages, none helpful.', 35, 64, 2, [
    choice('build', 'Build it with grit', 'gamble', [money(-300)], gm(0.55, [st('happiness', 5), st('smarts', 1)], [st('health', -3), money(-400)], 'A proud, slightly crooked shed.', 'The roof fell in, and so did your thumb.')),
    choice('hire', 'Hire a carpenter', 'safe', [money(-900), st('happiness', 2)]),
  ], { tags: ['nature'], traits: ['curious', 'disciplined', 'green-thumb'] }),
  ev('wise-moment', 'The Quiet Realisation', 'You realise that most of what you worried about at twenty has already passed. Peacefully.', 50, 64, 2, [
    choice('journal', 'Write it down', 'safe', [st('happiness', 3), st('smarts', 1), trait({ id: 'wise', label: 'Wise', icon: '🦉', temperament: 'gentle' })]),
    choice('share', 'Share it with a younger relative', 'safe', [st('karma', 3), st('happiness', 3)]),
    choice('ignore', 'Shrug and keep worrying', 'safe', [st('happiness', -1)]),
  ], { tags: ['faith'], once: true, traits: ['spiritual', 'stoic-heart', 'kind', 'empath'] }),
];
