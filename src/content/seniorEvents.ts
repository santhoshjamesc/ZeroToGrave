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
  const def: EventDef = { id: `sr.${id}`, title, text, minAge, maxAge, weight, mandatory: false, choices };
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
 * Senior life (62-110).
 * Flags SET: sr_retired, sr_memoir, sr_estranged, sr_reconciled, sr_bucket, sr_lonely, sr_scammed, sr_cane,
 *   sr_lost_friend, sr_grandkid_bond, sr_garden, sr_will_done.
 * Flags REQUIRED (all set above): sr_retired, sr_memoir, sr_estranged, sr_reconciled, sr_bucket, sr_lonely,
 *   sr_scammed, sr_cane, sr_lost_friend, sr_grandkid_bond.
 */
export const seniorEvents: EventDef[] = [
  // ---------- Retirement ----------
  ev('retire-day', 'Last Day', 'You clear your desk. Someone hands you a card signed by forty people, three of whom you have never met.', 62, 70, 4, [
    choice('party', 'Hold a big leaving party', 'safe', [money(-300), st('happiness', 5), flag('sr_retired')]),
    choice('quiet', 'Slip out with a cup of tea', 'safe', [st('happiness', 2), flag('sr_retired')]),
    choice('stay', 'Ask to stay on part-time', 'safe', [money(1500), st('energy', -2), st('happiness', -1)]),
  ], { needs: ['job'], tags: ['work'], once: true }),
  ev('retire-boredom', 'Too Much Tuesday', 'Every day feels like a Sunday afternoon. You have reorganised the spice rack twice.', 63, 85, 3, [
    choice('hobby', 'Take up something new', 'safe', [money(-150), st('happiness', 4), st('smarts', 1)]),
    choice('volunteer', 'Volunteer a few days a week', 'safe', [st('karma', 3), st('happiness', 3), st('energy', -2)]),
    choice('nap', 'Embrace the afternoon nap', 'safe', [st('energy', 3), st('happiness', 1), st('health', -1)]),
  ], { flags: ['sr_retired'], tags: ['work'], cooldown: 8 }),
  ev('pension-letter', 'The Pension Letter', 'A letter explains your pension in six pages. Page four contains the actual number.', 62, 80, 3, [
    choice('budget', 'Make a careful budget', 'safe', [st('smarts', 1), st('happiness', -1), money(500)]),
    choice('treat', 'Treat yourself first', 'safe', [money(-400), st('happiness', 4)]),
    choice('advice', 'Pay for professional advice', 'safe', [money(-200), st('happiness', 1), money(900)]),
  ], { tags: ['money'], cooldown: 12 }),
  ev('downsize', 'Too Many Rooms', 'The big family house is quiet and expensive. You count how many rooms you never use.', 65, 90, 3, [
    choice('sell', 'Sell and downsize', 'safe', [money(8000), st('happiness', -2), st('energy', 2)]),
    choice('stay', 'Stay and enjoy the memories', 'safe', [money(-500), st('happiness', 3)]),
    choice('lodger', 'Rent out a room to a student', 'gamble', [], gm(0.6, [money(2000), st('happiness', 4)], [st('happiness', -3), money(-300)], 'The student brings life, and surprisingly good cooking.', 'The student plays the saxophone.')),
  ], { tags: ['money', 'family'], once: true }),
  ev('seniors-discount', 'Senior Discount', 'The cashier smiles and offers you a senior discount. You wonder if you should feel insulted.', 62, 90, 2, [
    choice('accept', 'Take it gladly', 'safe', [money(50), st('happiness', 2)]),
    choice('flatter', 'Decline with a wink', 'safe', [st('looks', 1), st('happiness', 1)]),
  ], { tags: ['money'], cooldown: 10 }),

  // ---------- Grandchildren & family ----------
  ev('grandkid-visit', 'Little Visitors', 'The grandchildren arrive for the weekend. The house erupts in joyful chaos.', 62, 100, 4, [
    choice('bake', 'Bake with them', 'safe', [st('happiness', 5), st('energy', -2), flag('sr_grandkid_bond')]),
    choice('stories', 'Tell them wild stories from your youth', 'safe', [st('happiness', 4), st('karma', 1), flag('sr_grandkid_bond')]),
    choice('spoil', 'Spoil them with sweets and toys', 'safe', [money(-150), st('happiness', 4), st('health', -1)]),
  ], { needs: ['child'], tags: ['family'], cooldown: 3 }),
  ev('grandkid-letter', 'A Drawing in the Post', 'A crayon drawing arrives. It shows you, a cat, and a house with a very ambitious chimney.', 62, 105, 3, [
    choice('fridge', 'Put it on the fridge with pride', 'safe', [st('happiness', 4)]),
    choice('reply', 'Reply with a drawing of your own', 'safe', [st('happiness', 3), st('smarts', 1)]),
  ], { flags: ['sr_grandkid_bond'], tags: ['family', 'creativity'], cooldown: 5 }),
  ev('grandkid-wedding', 'Dancing at the Wedding', 'Your grandchild gets married. They ask you for the first dance after the couple.', 70, 100, 2, [
    choice('dance', 'Dance like nobody is watching', 'gamble', [], gm(0.7, [st('happiness', 7), st('health', 1)], [st('health', -3), st('happiness', 2)], 'The whole room cheered.', 'You twisted a hip, but it was worth it.')),
    choice('speech', 'Give a toast instead', 'safe', [st('happiness', 5), st('karma', 1)]),
  ], { flags: ['sr_grandkid_bond'], tags: ['family', 'love'], once: true }),
  ev('babysit-chaos', 'Babysitting Duty', 'Your child asks you to babysit for an evening. The grandchildren have formed a union.', 62, 85, 3, [
    choice('rules', 'Enforce strict bedtime', 'safe', [st('energy', -2), st('karma', 1)]),
    choice('fun', 'Throw out the rules and build a blanket fort', 'safe', [st('happiness', 5), st('energy', -4)]),
    choice('tv', 'Let the telly do the babysitting', 'safe', [st('energy', 1), st('karma', -1)]),
  ], { needs: ['child'], tags: ['family'] }),
  ev('family-dinner-clash', 'Sunday Dinner Argument', 'The family dinner starts with politics and ends with a pie flying across the table.', 62, 90, 2, [
    choice('peace', 'Make peace with a joke', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('leave', 'Leave and take a walk', 'safe', [st('health', 1), st('happiness', -1)]),
    choice('join', 'Pick a side', 'risky', [st('happiness', -2), st('karma', -1)]),
  ], { needs: ['child'], tags: ['family', 'food'] }),
  ev('old-rift', 'The Old Rift', 'You think about the sibling you have not spoken to in twenty years. The reason now feels very small.', 62, 90, 2, [
    choice('write', 'Write them a letter', 'safe', [st('happiness', 1), flag('sr_estranged')]),
    choice('pride', 'Keep your pride', 'safe', [st('happiness', -3), st('karma', -1)]),
  ], { tags: ['family', 'grief'], sensitive: true, once: true, forbids: ['sr_estranged'] }),
  ev('rift-reply', 'An Envelope in the Post', 'Weeks after your letter, a reply arrives in handwriting you would know anywhere.', 63, 95, 3, [
    choice('call', 'Pick up the phone and call', 'gamble', [], gm(0.75, [st('happiness', 7), st('karma', 3), flag('sr_reconciled')], [st('happiness', -4)], 'You both cried a little and laughed a lot.', 'The old anger flared up. You hung up, shaking.')),
    choice('letter', 'Write back slowly', 'safe', [st('happiness', 3), st('smarts', 1), flag('sr_reconciled')]),
    choice('ignore', 'Put it in a drawer', 'safe', [st('happiness', -3)]),
  ], { flags: ['sr_estranged'], sensitive: true, once: true, tags: ['family'] }),
  ev('rift-reunion', 'Kitchen Table Reunion', 'Your sibling sits at your kitchen table for the first time in decades. You both look older. Neither of you says so.', 64, 100, 3, [
    choice('tea', 'Pour tea and talk all afternoon', 'safe', [st('happiness', 7), st('karma', 2), log('🫖', 'You made peace with your family after years of silence.')]),
    choice('photos', 'Bring out the old photo albums', 'safe', [st('happiness', 6), st('smarts', 1)]),
  ], { flags: ['sr_reconciled'], sensitive: true, once: true, tags: ['family'] }),
  ev('write-will', 'The Will', 'A solicitor lays out forms. You think about who gets the clock, the house, the jar of buttons.', 62, 95, 3, [
    choice('fair', 'Split things evenly', 'safe', [money(-300), st('karma', 2), flag('sr_will_done')]),
    choice('charity', 'Leave a gift to charity', 'safe', [money(-300), st('karma', 5), st('happiness', 2), flag('sr_will_done')]),
    choice('mischief', 'Leave the clock to the cousin who always wanted it, and a note', 'safe', [money(-300), st('happiness', 3), flag('sr_will_done')]),
  ], { tags: ['family', 'money'], once: true }),
  ev('family-photo', 'Four Generations', 'The whole family gathers for a photograph. The photographer tries to get everyone to look at the lens.', 70, 105, 2, [
    choice('smile', 'Smile and hold the youngest', 'safe', [st('happiness', 6)]),
    choice('joke', 'Pull a face at the last second', 'safe', [st('happiness', 4), st('karma', 1)]),
  ], { needs: ['child'], tags: ['family'], once: true }),

  // ---------- Legacy & memoirs ----------
  ev('start-memoir', 'The Memoir', 'Your grandchildren ask about the old days. You realise nobody has written any of it down.', 62, 95, 3, [
    choice('write', 'Start writing it all down', 'safe', [st('happiness', 3), st('smarts', 1), st('energy', -2), flag('sr_memoir')]),
    choice('record', 'Record stories on your phone', 'safe', [st('happiness', 3), flag('sr_memoir')]),
    choice('later', 'Maybe next year', 'safe', []),
  ], { tags: ['creativity', 'family'], traits: ['creative', 'bookworm', 'wise', 'curious'], once: true }),
  ev('memoir-finish', 'The Last Page', 'You write the final sentence of your memoir. Your pen hovers a moment before the full stop.', 64, 100, 3, [
    choice('print', 'Print copies for the family', 'safe', [money(-250), st('happiness', 6), st('karma', 2), log('📖', 'You finished your life story and shared it with your family.')]),
    choice('publish', 'Send it to a small publisher', 'gamble', [], gm(0.35, [money(1200), st('happiness', 7)], [st('happiness', -2)], 'A small press published it. It sells a surprising number.', 'Rejection politely worded.')),
    choice('keep', 'Keep it private in a drawer', 'safe', [st('happiness', 2)]),
  ], { flags: ['sr_memoir'], once: true, tags: ['creativity'] }),
  ev('heirloom', 'The Heirloom', 'You dig out your mother’s old brooch. Who should have it?', 62, 100, 2, [
    choice('give', 'Give it to a grandchild now', 'safe', [st('happiness', 4), st('karma', 2)]),
    choice('wait', 'Keep it a little longer', 'safe', [st('happiness', 1)]),
    choice('sell', 'Sell it quietly', 'risky', [money(900), st('karma', -3), st('happiness', -2)]),
  ], { tags: ['family'] }),
  ev('life-advice', 'What Would You Tell Them?', 'A teenage relative asks for one piece of advice. The room goes quiet. All eyes on you.', 65, 105, 3, [
    choice('wisdom', 'Share something true and gentle', 'safe', [st('karma', 3), st('happiness', 3), trait({ id: 'wise', label: 'Wise', icon: '🦉', temperament: 'gentle' })]),
    choice('joke', 'Say "never trust a fart"', 'safe', [st('happiness', 4)]),
    choice('long', 'Launch into a forty-minute story', 'safe', [st('happiness', 1), st('energy', -2)]),
  ], { tags: ['family'], traits: ['wise', 'kind', 'spiritual', 'empath'], cooldown: 12 }),
  ev('interview-history', 'Oral History Project', 'A student is interviewing local elders for a history project. They ask what the town used to be like.', 65, 105, 2, [
    choice('talk', 'Talk for hours', 'safe', [st('happiness', 4), st('karma', 2), st('energy', -2)]),
    choice('embellish', 'Embellish a little', 'safe', [st('happiness', 3), st('karma', -1)]),
  ], { tags: ['school', 'creativity'] }),

  // ---------- Health & mobility ----------
  ev('cane', 'The Walking Stick', 'Your knees suggest a walking stick. You choose a handsome one, with a silver tip.', 65, 100, 3, [
    choice('accept', 'Use it proudly', 'safe', [money(-80), st('health', 1), flag('sr_cane')]),
    choice('refuse', 'Refuse stubbornly', 'gamble', [], gm(0.5, [st('happiness', 2)], [st('health', -4), st('happiness', -1)], 'Today, the knees behaved.', 'You stumbled, but only the pride was bruised.')),
  ], { tags: ['health'], once: true, maxStat: { health: 75 } }),
  ev('scooter', 'A Mobility Scooter', 'The family suggests a mobility scooter. You imagine a very slow but extremely stylish getaway.', 70, 105, 2, [
    choice('buy', 'Buy one and decorate it', 'safe', [money(-1200), st('happiness', 5), st('energy', 3)]),
    choice('walk', 'Keep walking, thank you', 'safe', [st('health', 1), st('energy', -2)]),
  ], { flags: ['sr_cane'], tags: ['health'], once: true }),
  ev('hip-op', 'New Hip', 'Your hip wears out. The surgeon says modern replacements practically include a free tango lesson.', 65, 95, 3, [
    choice('surgery', 'Go ahead with the surgery', 'gamble', [money(-1500)], gm(0.8, [st('health', 5), st('happiness', 3)], [st('health', -5), cond({ id: 'hip-complication', name: 'Hip Complication', icon: '🦴', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], 'You are pain-free and unstoppable.', 'Complications slowed your recovery.')),
    choice('manage', 'Manage with pain relief', 'safe', [money(-300), st('health', -1), st('happiness', -1)]),
  ], { tags: ['health'], once: true, needs: ['sick'] }),
  ev('pill-box', 'The Pill Organiser', 'You now own a seven-day pill box with little doors. Monday’s door sticks.', 65, 105, 3, [
    choice('routine', 'Set a routine and alarms', 'safe', [st('health', 2), st('smarts', 1)]),
    choice('muddle', 'Muddle through', 'gamble', [], gm(0.6, [st('happiness', 1)], [st('health', -4)], 'Somehow it all worked out.', 'You doubled one tablet and skipped another.')),
  ], { needs: ['sick'], tags: ['health'], cooldown: 8 }),
  ev('doctor-visit', 'Annual Check-Up', 'The doctor reads your results, nodding, then humming, then writing something down.', 65, 105, 3, [
    choice('listen', 'Follow every instruction', 'safe', [st('health', 3), money(-150), st('happiness', -1)]),
    choice('half', 'Follow some of it', 'safe', [st('health', 1)]),
    choice('ignore', 'Eat what you like, it is too late to stop', 'risky', [st('happiness', 3), st('health', -3)]),
  ], { tags: ['health'], cooldown: 4 }),
  ev('memory-slip', 'Where Are My Keys?', 'You find your keys in the fridge. And your glasses in the freezer. Your memory has gone on holiday.', 68, 105, 3, [
    choice('notes', 'Start leaving yourself notes', 'safe', [st('smarts', 1), st('happiness', 1)]),
    choice('doctor', 'Ask a doctor about it', 'safe', [money(-200), st('health', 1), st('happiness', -2)]),
    choice('laugh', 'Laugh about it with the family', 'safe', [st('happiness', 3)]),
  ], { tags: ['health'], sensitive: true, cooldown: 8 }),
  ev('hearing-aid', 'What Was That?', 'The family says you have turned the television up to window-shaking levels.', 65, 105, 3, [
    choice('aid', 'Try a hearing aid', 'safe', [money(-700), st('happiness', 3), st('smarts', 1)]),
    choice('pretend', 'Nod and smile', 'risky', [st('happiness', -2), st('karma', -1)]),
    choice('selective', 'Develop selective hearing', 'safe', [st('happiness', 2)]),
  ], { tags: ['health', 'family'], once: true }),
  ev('fall-ice', 'The Icy Step', 'You slip on a frozen step. A neighbour rushes out with a blanket and a kind scolding.', 68, 105, 2, [
    choice('hospital', 'Get checked out', 'safe', [money(-500), st('health', -1), st('karma', 1)]),
    choice('tough', 'Brush it off', 'gamble', [], gm(0.55, [st('happiness', 2)], [st('health', -7), cond({ id: 'fractured-wrist', name: 'Fractured Wrist', icon: '🦴', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], 'Just a bruise, and a story.', 'A fractured wrist. You should have gone.')),
  ], { tags: ['health'], sensitive: true, cooldown: 8 }),
  ev('swim-class', 'Aqua Aerobics', 'The community pool runs a gentle aquatic class for seniors. The instructor wears a neon cap.', 62, 95, 3, [
    choice('join', 'Join the class', 'safe', [money(-80), st('health', 3), st('happiness', 3)]),
    choice('skip', 'Stay dry', 'safe', [st('energy', 1)]),
  ], { tags: ['sports', 'health', 'friends'] }),
  ev('long-walk', 'Morning Constitutional', 'The sun is low and gold. Your dog tugs the lead. A walk beckons.', 62, 100, 3, [
    choice('long', 'Take the long route', 'safe', [st('health', 2), st('happiness', 3)]),
    choice('bench', 'Sit on the bench and watch the world', 'safe', [st('happiness', 2), st('karma', 1)]),
  ], { flags: ['has_dog'], tags: ['nature', 'pets'] }),

  // ---------- Friends & loss ----------
  ev('friend-passing', 'An Old Friend Is Gone', 'A friend of fifty years has passed away. The phone call was short. The silence after it was not.', 65, 105, 3, [
    choice('funeral', 'Attend the funeral and say a few words', 'safe', [st('happiness', -5), st('karma', 2), flag('sr_lost_friend')]),
    choice('family', 'Comfort their family privately', 'safe', [st('happiness', -4), st('karma', 3), flag('sr_lost_friend')]),
    choice('stay', 'Stay home and remember', 'safe', [st('happiness', -4), flag('sr_lost_friend')]),
  ], { sensitive: true, tags: ['grief', 'friends'], cooldown: 5 }),
  ev('friend-memorial', 'In Their Memory', 'You find a photograph of you and your lost friend, laughing at something no one remembers.', 66, 105, 3, [
    choice('plant', 'Plant a tree in their name', 'safe', [money(-60), st('happiness', 3), st('karma', 3), log('🌳', 'You planted a tree for an old friend.')]),
    choice('toast', 'Raise a toast in their honour', 'safe', [st('happiness', 2), st('health', -1)]),
    choice('letter', 'Write a letter you will never send', 'safe', [st('happiness', 1), st('smarts', 1)]),
  ], { flags: ['sr_lost_friend'], sensitive: true, tags: ['grief', 'friends'], once: true }),
  ev('lonely-house', 'Quiet House', 'Days pass with only the clock for company. You realise you have not spoken to anyone since Thursday.', 65, 105, 3, [
    choice('club', 'Join a seniors’ club', 'safe', [st('happiness', 4), st('karma', 1), flag('sr_lonely')]),
    choice('call', 'Call an old friend', 'safe', [st('happiness', 3)]),
    choice('tv', 'Turn the television up', 'safe', [st('happiness', -2)]),
  ], { needs: ['single'], tags: ['friends'], sensitive: true, cooldown: 5 }),
  ev('club-join', 'The Tuesday Club', 'A friendly group meets on Tuesdays for tea and dominoes. They are fiercely competitive.', 65, 100, 3, [
    choice('compete', 'Take the dominoes very seriously', 'safe', [st('happiness', 4), st('smarts', 1)]),
    choice('cake', 'Bring a legendary cake', 'safe', [money(-20), st('happiness', 4), st('karma', 1)]),
  ], { flags: ['sr_lonely'], tags: ['friends', 'food'], cooldown: 8 }),
  ev('new-neighbour', 'New Neighbour', 'A young family moves in next door. The child waves from the window with a toy dinosaur.', 62, 100, 3, [
    choice('welcome', 'Bring over a welcome basket', 'safe', [money(-30), st('happiness', 4), st('karma', 2)]),
    choice('wave', 'Wave back, from your chair', 'safe', [st('happiness', 2)]),
    choice('grump', 'Grumble about noise before they unpack', 'safe', [st('karma', -2), st('happiness', -1)]),
  ], { tags: ['friends', 'family'], traits: ['grumpy', 'kind'] }),
  ev('late-love', 'Late-Blooming Romance', 'At the garden club you meet someone with a warm laugh and a dreadful sense of humour. You like both.', 62, 90, 2, [
    choice('ask', 'Ask them to dinner', 'gamble', [money(-80)], gm(0.6, [st('happiness', 7), st('looks', 1)], [st('happiness', -3)], 'It felt like being twenty again, with better manners.', 'A polite friendship, nothing more.')),
    choice('friends', 'Keep it as friendship', 'safe', [st('happiness', 2)]),
  ], { needs: ['single'], tags: ['love'], traits: ['romantic', 'charming', 'optimist'] }),

  // ---------- Nostalgia, humour, hobbies ----------
  ev('old-song', 'That Song', 'A tune from the radio drags you back fifty years. You find yourself swaying in the kitchen.', 62, 105, 3, [
    choice('dance', 'Dance around the kitchen', 'safe', [st('happiness', 5), st('health', 1)]),
    choice('tears', 'Let yourself cry a little', 'safe', [st('happiness', 2)]),
  ], { tags: ['creativity'], cooldown: 5 }),
  ev('attic', 'The Attic Box', 'In the attic you find a box of letters, a dented trumpet, and a photograph of a person you will not name.', 62, 100, 3, [
    choice('read', 'Read every letter', 'safe', [st('happiness', 3), st('smarts', 1), st('energy', -1)]),
    choice('trumpet', 'Try the trumpet', 'gamble', [], gm(0.35, [st('happiness', 5)], [st('happiness', 1), st('karma', -1)], 'Rusty but oddly lovely.', 'Neighbours called to ask what died.')),
    choice('tidy', 'Seal it up again', 'safe', [st('happiness', -1)]),
  ], { tags: ['family', 'creativity'], once: true }),
  ev('old-town', 'The Old Neighbourhood', 'You drive past the street where you grew up. The corner shop is a coffee bar now.', 62, 100, 2, [
    choice('walk', 'Walk the old streets', 'safe', [st('happiness', 4), st('health', 1)]),
    choice('knock', 'Knock on the door of your childhood house', 'gamble', [], gm(0.5, [st('happiness', 6), st('karma', 1)], [st('happiness', -2)], 'The owner invited you in for tea.', 'Nobody answered. Perhaps for the best.')),
  ], { tags: ['family'], once: true }),
  ev('rediscover-hobby', 'The Dusty Easel', 'You find your old easel, brushes stiff with age. A blank canvas stares back.', 62, 100, 3, [
    choice('paint', 'Paint something every morning', 'safe', [st('happiness', 4), st('smarts', 1)]),
    choice('class', 'Join a community art class', 'safe', [money(-80), st('happiness', 3), st('karma', 1)]),
  ], { tags: ['creativity'], traits: ['creative', 'daydreamer', 'bookworm'] }),
  ev('garden-bliss', 'Garden Glory', 'Your garden is in full bloom: roses, tomatoes, and a rebellious zucchini the size of a toddler.', 62, 105, 3, [
    choice('show', 'Enter the village show', 'gamble', [flag('sr_garden')], gm(0.4, [st('happiness', 6), st('karma', 1)], [st('happiness', -1)], 'First prize in the marrow category!', 'Second place to a cabbage. Scandal.')),
    choice('share', 'Give away baskets of vegetables', 'safe', [st('karma', 3), st('happiness', 3)]),
  ], { tags: ['nature'], traits: ['green-thumb', 'homebody', 'kind'] }),
  ev('cooking-legend', 'The Recipe Everyone Wants', 'Your signature dish is requested at every family gathering. Nobody can replicate it.', 62, 105, 2, [
    choice('teach', 'Teach it to the grandkids', 'safe', [st('happiness', 5), st('karma', 2)]),
    choice('secret', 'Take the recipe to your grave', 'safe', [st('happiness', 2), st('karma', -1)]),
    choice('book', 'Write a family cookbook', 'safe', [money(-100), st('happiness', 4), st('smarts', 1)]),
  ], { tags: ['food', 'family'], traits: ['foodie', 'kind'] }),
  ev('crossword', 'The Crossword Champion', 'You solve the cryptic crossword in a record ten minutes. You tell everyone.', 62, 105, 2, [
    choice('brag', 'Tell everyone you meet', 'safe', [st('happiness', 3), st('karma', -1)]),
    choice('quiet', 'Quietly start the next one', 'safe', [st('smarts', 2), st('happiness', 1)]),
  ], { tags: ['school'], traits: ['curious', 'logical', 'bookworm'] }),
  ev('gossip-bench', 'Park Bench Gossip', 'A bench, two flasks of tea, and a perfectly scandalous piece of local news.', 62, 105, 3, [
    choice('listen', 'Lean in and listen', 'safe', [st('happiness', 3)]),
    choice('add', 'Add a juicy detail of your own', 'safe', [st('happiness', 4), st('karma', -1)]),
    choice('correct', 'Correct the facts', 'safe', [st('smarts', 1), st('happiness', 1)]),
  ], { tags: ['friends', 'mischief'] }),
  ev('prank-senior', 'The Last Prank', 'You find a rubber spider. The grandkid’s bedroom door is slightly open.', 62, 100, 2, [
    choice('prank', 'Place it on their pillow', 'gamble', [], gm(0.7, [st('happiness', 6)], [st('happiness', -1), st('karma', -1)], 'The scream was glorious.', 'They found it and put it in your slippers.')),
    choice('restrain', 'Sigh and put the spider away', 'safe', [st('happiness', -1)]),
  ], { needs: ['child'], tags: ['mischief', 'family'], traits: ['prankster', 'life-of-party'] }),

  // ---------- Scams & tech ----------
  ev('scam-prize', 'Congratulations, Winner', 'A cheerful voice announces that you have won a holiday, and only need to pay the taxes upfront.', 62, 100, 3, [
    choice('pay', 'Pay the taxes', 'gamble', [], gm(0.05, [st('happiness', 3)], [money(-2500), st('happiness', -6), flag('sr_scammed')], 'Somehow a real holiday.', 'The holiday never came, nor did the money.')),
    choice('hang', 'Hang up firmly', 'safe', [st('smarts', 1), st('karma', 1)]),
    choice('play', 'Keep them on the phone for an hour', 'safe', [st('happiness', 3), st('karma', 1)]),
  ], { tags: ['money', 'tech'], cooldown: 8 }),
  ev('romance-scam', 'Sweet Messages', 'A charming stranger online says lovely things, then mentions a short-term financial emergency.', 62, 95, 2, [
    choice('send', 'Send the money, just this once', 'gamble', [], gm(0.1, [st('happiness', 2)], [money(-4000), st('happiness', -8), flag('sr_scammed')], 'It was real, miracle of miracles.', 'It was a fraud. The heartbreak was worse than the loss.')),
    choice('family', 'Show the messages to your family', 'safe', [st('smarts', 1), st('karma', 1), st('happiness', -1)]),
  ], { needs: ['single'], tags: ['love', 'money', 'tech'], sensitive: true, cooldown: 10 }),
  ev('scam-aftermath', 'Picking Up the Pieces', 'After being scammed, you feel foolish and angry. Your family hugs you, then helps you change every password.', 63, 105, 3, [
    choice('report', 'Report it to the police', 'safe', [st('karma', 2), st('smarts', 1), st('happiness', 1)]),
    choice('talk', 'Tell your story at a seniors’ safety talk', 'safe', [st('karma', 4), st('happiness', 3)]),
    choice('hide', 'Keep it a secret', 'safe', [st('happiness', -3)]),
  ], { flags: ['sr_scammed'], sensitive: true, once: true, tags: ['money'] }),
  ev('video-call', 'The Video Call', 'The grandchildren’s faces appear on a tablet. You appear to them as an extreme close-up of your nose.', 62, 105, 3, [
    choice('learn', 'Ask them to teach you properly', 'safe', [st('smarts', 1), st('happiness', 3)]),
    choice('nose', 'Embrace the nose', 'safe', [st('happiness', 4)]),
    choice('phone', 'Insist on a phone call instead', 'safe', [st('happiness', 1)]),
  ], { needs: ['child'], tags: ['tech', 'family'], cooldown: 8 }),
  ev('smart-speaker', 'The Talking Box', 'Your child installs a smart speaker. You argue with it for an hour before it plays your favourite song.', 62, 105, 2, [
    choice('befriend', 'Make friends with it', 'safe', [st('happiness', 3), st('smarts', 1)]),
    choice('unplug', 'Unplug it and stare coldly', 'safe', [st('happiness', 1)]),
  ], { tags: ['tech'], traits: ['grumpy', 'tech-savvy', 'curious'], once: true }),
  ev('online-shopping', 'Accidental Order', 'You were trying to read the news. Somehow you have ordered forty garden gnomes.', 62, 105, 2, [
    choice('keep', 'Keep them and start a gnome colony', 'safe', [money(-250), st('happiness', 4)]),
    choice('return', 'Return them with effort', 'safe', [st('energy', -2), st('smarts', 1)]),
  ], { tags: ['tech', 'mischief'], cooldown: 12 }),

  // ---------- Travel & bucket list ----------
  ev('bucket-list', 'The Bucket List', 'Over tea you write a list of things you want to do before the last page. It runs to two sides.', 62, 95, 3, [
    choice('commit', 'Pick the first item and start planning', 'safe', [st('happiness', 4), st('energy', -1), flag('sr_bucket')]),
    choice('modest', 'Tick off small joys first', 'safe', [st('happiness', 3), money(-100), flag('sr_bucket')]),
    choice('toss', 'Throw the list away', 'safe', [st('happiness', -1)]),
  ], { tags: ['adventure', 'travel'], once: true }),
  ev('bucket-trip', 'The Trip of a Lifetime', 'Your bucket list says: see the northern lights. The tickets are open in your hands.', 62, 95, 3, [
    choice('go', 'Book the trip', 'gamble', [money(-4000)], gm(0.8, [st('happiness', 9), st('health', 1), log('🌌', 'You finally saw the northern lights.')], [st('health', -4), st('happiness', 2)], 'The sky danced green and purple just for you.', 'Cloud all week. The hotel was lovely though.')),
    choice('cheap', 'Pick a cheaper destination', 'safe', [money(-1200), st('happiness', 4)]),
    choice('skip', 'Postpone it again', 'safe', [st('happiness', -2)]),
  ], { flags: ['sr_bucket'], tags: ['travel', 'adventure'], once: true, minStat: { health: 30 } }),
  ev('cruise', 'The Cruise', 'Your friends book a cruise. The brochure promises sunsets and unlimited buffets.', 62, 90, 3, [
    choice('go', 'Pack your sunhat', 'safe', [money(-2200), st('happiness', 5), st('health', -1)]),
    choice('cheap', 'Take a small riverboat instead', 'safe', [money(-500), st('happiness', 3)]),
    choice('home', 'Stay home with a good book', 'safe', [st('happiness', 1), st('energy', 2)]),
  ], { tags: ['travel', 'friends', 'food'], cooldown: 10 }),
  ev('parachute-gift', 'Skydive Dare', 'For your birthday, your grandchild presents you with a tandem skydive voucher.', 65, 85, 1.5, [
    choice('jump', 'Jump out of the plane', 'gamble', [], gm(0.9, [st('happiness', 10), st('health', 1), log('🪂', 'You skydived at an age when others stay in the armchair.')], [st('health', -6)], 'You screamed all the way down, then laughed forever.', 'A rough landing, but you laughed anyway.')),
    choice('watch', 'Watch from the ground with a flask', 'safe', [st('happiness', 3)]),
  ], { tags: ['adventure'], traits: ['daredevil', 'wanderer', 'reckless'], once: true, minStat: { health: 45 } }),
  ev('final-adventure', 'One Last Adventure', 'You feel the years but also a spark. Why not do something wildly out of character, just once more?', 75, 110, 2, [
    choice('road', 'Take a road trip to the coast', 'safe', [money(-800), st('happiness', 7), st('energy', -3)]),
    choice('visit', 'Visit everyone you love, one by one', 'safe', [money(-600), st('happiness', 6), st('karma', 3)]),
    choice('mischief', 'Do something outrageous and unrepentant', 'gamble', [], gm(0.6, [st('happiness', 8), log('🎉', 'You pulled off one last wild adventure.')], [st('happiness', 1), st('health', -3)], 'People still talk about it.', 'A little embarrassing, a lot of fun.')),
  ], { tags: ['adventure', 'travel'], once: true }),

  // ---------- Community & faith & wisdom ----------
  ev('volunteer-school', 'Reading Buddy', 'A local primary school needs volunteers to listen to children read. You can do voices.', 62, 95, 3, [
    choice('volunteer', 'Sign up', 'safe', [st('karma', 4), st('happiness', 4), st('energy', -2)]),
    choice('donate', 'Donate books instead', 'safe', [money(-120), st('karma', 2)]),
  ], { tags: ['school', 'family'], traits: ['kind', 'empath', 'bookworm'] }),
  ev('charity-shop', 'Charity Shop Shift', 'The charity shop needs help on Saturdays. The job comes with tea and surprisingly hot gossip.', 62, 95, 3, [
    choice('shift', 'Take a Saturday shift', 'safe', [st('karma', 3), st('happiness', 3), st('energy', -1)]),
    choice('donate', 'Donate your old clothes', 'safe', [st('karma', 2), st('happiness', 1)]),
  ], { tags: ['friends'], cooldown: 8 }),
  ev('faith-comfort', 'A Quiet Pew', 'You find yourself sitting in a quiet place of worship. Nobody is there. You are listening.', 62, 105, 2, [
    choice('pray', 'Sit in silence', 'safe', [st('happiness', 4), st('karma', 2)]),
    choice('community', 'Join the community lunch afterwards', 'safe', [st('happiness', 3), st('karma', 1), money(-10)]),
  ], { tags: ['faith'], traits: ['spiritual', 'kind', 'stoic-heart'] }),
  ev('mentor-young', 'The Eager Neighbour', 'A young neighbour asks if you could teach them to fix a bike, a tap, or a broken heart.', 62, 100, 2, [
    choice('teach', 'Teach them everything', 'safe', [st('karma', 4), st('happiness', 4), st('energy', -2)]),
    choice('tips', 'Share a few tips over tea', 'safe', [st('karma', 2), st('happiness', 2)]),
  ], { tags: ['friends', 'school'], traits: ['wise', 'kind', 'curious'] }),
  ev('birthday-100', 'Many Happy Returns', 'You reach a birthday most people only hear about. The cake has more candles than the fire marshal approves.', 85, 110, 3, [
    choice('blow', 'Blow them all out in one go', 'gamble', [], gm(0.6, [st('happiness', 8), st('health', 1)], [st('happiness', 4), st('energy', -3)], 'Everyone applauded. You had to sit down.', 'It took three tries and a fan. Still glorious.')),
    choice('speech', 'Give a short speech', 'safe', [st('happiness', 6), st('karma', 2)]),
    choice('nap', 'Take a nap during the party', 'safe', [st('happiness', 3), st('energy', 3)]),
  ], { tags: ['family'], once: true }),
  ev('letters-to-grandkids', 'Letters for Later', 'You begin writing letters for each grandchild to open on their milestone birthdays.', 65, 105, 2, [
    choice('write', 'Write each one carefully', 'safe', [st('happiness', 4), st('karma', 3), st('energy', -2), log('✉️', 'You wrote letters for your grandchildren to open in the future.')]),
    choice('short', 'Write one short joint letter', 'safe', [st('happiness', 2), st('karma', 1)]),
  ], { needs: ['child'], flags: ['sr_grandkid_bond'], tags: ['family'], once: true }),
  ev('peace-sunset', 'A Good Day', 'Nothing special happens. The light is lovely. Tea is warm. You feel, quite simply, content.', 65, 110, 3, [
    choice('savour', 'Sit on the porch and savour it', 'safe', [st('happiness', 5), st('health', 1)]),
    choice('share', 'Call someone to share the moment', 'safe', [st('happiness', 4), st('karma', 1)]),
  ], { tags: ['nature'], cooldown: 4 }),
];
