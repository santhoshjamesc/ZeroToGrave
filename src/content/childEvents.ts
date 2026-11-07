import { Condition, Effect, EventChoice, EventDef, StatKey } from '../engine/types';

const st = (stat: StatKey, delta: number): Effect => ({ type: 'stat', stat, delta });
const money = (delta: number): Effect => ({ type: 'money', delta });
const flag = (key: string, value: boolean | number | string = true): Effect => ({ type: 'flag', key, value });
const log = (icon: string, text: string): Effect => ({ type: 'log', icon, text });
const cond = (c: Omit<Condition, 'sinceAge' | 'treated'>): Effect => ({ type: 'addCondition', condition: { ...c, sinceAge: 0, treated: false } });

const choice = (id: string, label: string, riskHint: EventChoice['riskHint'], effects: Effect[], gamble?: EventChoice['gamble']): EventChoice => ({ id, label, riskHint, effects, gamble });
const ev = (id: string, title: string, text: string, minAge: number, maxAge: number, weight: number, choices: EventChoice[], o: Partial<EventDef> = {}): EventDef => ({ id, title, text, minAge, maxAge, weight, mandatory: false, choices, ...o });

/** Childhood events, ages 0-12. IDs prefixed `ch.`. Flags set here: ch_* (see requiresFlags). */
export const childEvents: EventDef[] = [
  // ---------------- Ages 0-4: parents, home, play, health ----------------
  ev('ch.baby.first-smile', 'The First Smile', 'Someone leans over your cot making a ridiculous face.', 0, 1, 3, [
    choice('giggle', 'Break into a huge gummy grin', 'safe', [st('happiness', 4), st('looks', 1), log('😊', 'Your first real smile melted the whole household.')]),
    choice('stare', 'Stare back, deeply unimpressed', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('grab', 'Grab their nose and refuse to let go', 'safe', [st('happiness', 2), st('health', 1)]),
  ], { tags: ['family'], once: true }),
  ev('ch.baby.night-wail', 'Three in the Morning', 'The house is dark and quiet. You have decided this must change.', 0, 2, 3, [
    choice('wail', 'Wail until the lights come on', 'safe', [st('happiness', 1), st('energy', -2), st('karma', -1)]),
    choice('babble', 'Babble happily to the ceiling until you drift off', 'safe', [st('happiness', 2), st('health', 1)]),
    choice('cuddle', 'Cry until someone picks you up and sways', 'safe', [st('happiness', 3), st('looks', -1)]),
  ], { tags: ['family'], cooldown: 2 }),
  ev('ch.baby.first-steps', 'Wobble, Wobble', 'The coffee table is right there. So is the sofa. So are your parents, holding out their arms.', 1, 2, 3, [
    choice('walk', 'Toddle across the room towards open arms', 'gamble', [], { p: 0.75, win: [st('happiness', 5), st('health', 1), log('👣', 'You took your first steps. Someone cried. Someone filmed it badly.')], lose: [st('happiness', -1), st('health', -1)], winText: 'Three whole steps! The room erupts.', loseText: 'You sat down hard. Dignity bruised, nothing worse.' }),
    choice('crawl', 'Crawl instead; it is faster', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('furniture', 'Cruise along the furniture, one hand at a time', 'safe', [st('happiness', 3), st('health', 1)]),
  ], { tags: ['family', 'health'], once: true }),
  ev('ch.baby.first-word', 'The First Word', 'Everyone has been waiting for this. Everyone has an opinion on what it should be.', 1, 2, 3, [
    choice('mama', 'Say "Mama" and watch a grown adult weep', 'safe', [st('happiness', 4), st('karma', 1)]),
    choice('no', 'Shout "No!" with total confidence', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('spoon', 'Announce "Spoon", for reasons known only to you', 'safe', [st('smarts', 2), st('happiness', 2)]),
  ], { tags: ['family'], once: true }),
  ev('ch.tod.peas', 'The Pea Incident', 'A small green mountain sits on your tray, daring you.', 1, 4, 3, [
    choice('eat', 'Eat every single pea', 'safe', [st('health', 2), st('karma', 1)]),
    choice('throw', 'Launch them across the kitchen', 'safe', [st('happiness', 3), st('karma', -1)]),
    choice('smear', 'Smear them into your hair as an art project', 'safe', [st('happiness', 2), st('looks', -1)]),
  ], { tags: ['food', 'family'] }),
  ev('ch.tod.meltdown', 'Supermarket Meltdown', 'You wanted the red box. The red box was not purchased. The aisle shall know.', 2, 4, 3, [
    choice('scream', 'Collapse on the floor and scream', 'gamble', [st('energy', -2)], { p: 0.4, win: [st('happiness', 3), st('karma', -2)], lose: [st('happiness', -3)], winText: 'Your parent caves. The red box is yours.', loseText: 'They calmly carried you out. No box. Big sad.' }),
    choice('sulk', 'Sulk silently in the trolley', 'safe', [st('happiness', -1), st('karma', 1)]),
    choice('charm', 'Wave at everyone until a stranger gives you a sticker', 'safe', [st('happiness', 3), st('looks', 1)]),
  ], { tags: ['family', 'mischief'] }),
  ev('ch.tod.fever', 'The Hot Night', 'You feel sticky, cranky and strange. Your forehead is a radiator.', 0, 4, 2, [
    choice('rocked', 'Cling to your parent while they rock you', 'safe', [st('happiness', 2), st('health', -2)]),
    choice('doctor', 'Get bundled off to the doctor at dawn', 'safe', [money(-20), st('health', 1)]),
    choice('remedy', 'Endure the family cure: warm broth and a damp flannel', 'gamble', [], { p: 0.75, win: [st('health', 1), st('happiness', 2)], lose: [st('health', -4), cond({ id: 'ear-infection', name: 'Ear Infection', icon: '👂', kind: 'illness', severity: 1, chronic: false, diagnosed: true })], winText: 'By morning you were back to full volume.', loseText: 'It turned into an ear infection. Sleepless nights for all.' }),
  ], { tags: ['health', 'family'], cooldown: 3 }),
  ev('ch.tod.stairs', 'The Forbidden Staircase', 'The baby gate is open. Just for a second. The stairs glow with possibility.', 1, 4, 2, [
    choice('climb', 'Climb to the very top', 'gamble', [], { p: 0.7, win: [st('happiness', 4), log('🪜', 'You conquered the stairs while no one was looking.')], lose: [st('health', -4), st('happiness', -2)], winText: 'You reached the summit and beamed down at everyone.', loseText: 'You tumbled a few steps. Lots of tears, a few bruises.' }),
    choice('bumslide', 'Bump down on your bottom, one at a time', 'safe', [st('happiness', 1)]),
    choice('wait', 'Wait for someone to notice and carry you', 'safe', [st('happiness', 1), st('karma', 1)]),
  ], { tags: ['adventure', 'health'], requiresTraits: ['daredevil', 'reckless', 'curious', 'wanderer'] }),
  ev('ch.tod.crayon-wall', 'The Blank Wall', 'Someone left a crayon on the floor. Next to it, a beautiful, pristine wall.', 2, 4, 3, [
    choice('mural', 'Draw an enormous masterpiece', 'safe', [st('smarts', 1), st('happiness', 3), st('karma', -1)]),
    choice('paper', 'Politely draw on paper', 'safe', [st('happiness', 1), st('karma', 1)]),
    choice('eat', 'Taste the crayon', 'safe', [st('happiness', 1), st('health', -1)]),
  ], { tags: ['creativity', 'mischief'], requiresTraits: ['creative', 'daydreamer', 'rebel', 'prankster'] }),
  ev('ch.tod.imaginary-friend', 'Someone Invisible', 'You keep talking to the empty chair at the table. The chair, apparently, answers.', 3, 5, 2, [
    choice('welcome', 'Insist everybody sets a place for them', 'safe', [st('happiness', 3), st('smarts', 1), flag('ch_imaginary_friend')]),
    choice('whisper', 'Keep them a secret, just for you', 'safe', [st('happiness', 2), flag('ch_imaginary_friend')]),
    choice('blame', 'Blame them for the broken cup', 'safe', [st('happiness', 1), st('karma', -2), flag('ch_imaginary_friend')]),
  ], { tags: ['creativity', 'family'], once: true }),
  ev('ch.tod.bedtime-story', 'One More Story', 'The same picture book, for the ninth night running. You know every page.', 2, 4, 2, [
    choice('again', 'Demand it again, word for word', 'safe', [st('smarts', 2), st('happiness', 2)]),
    choice('swap', 'Insist on a brand-new story every night', 'safe', [st('smarts', 1), st('happiness', 1), st('energy', -1)]),
    choice('skip', 'Fall asleep halfway through', 'safe', [st('health', 1), st('energy', 2)]),
  ], { tags: ['family', 'creativity'], requiresTraits: ['bookworm', 'curious', 'prodigy', 'daydreamer'] }),

  // ---------------- Ages 5-12 ----------------
  ev('ch.school.first-day', 'First Day of School', 'A too-big backpack, a squeaky pair of shoes, and a very big building.', 5, 6, 4, [
    choice('march', 'March in like you own the place', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('cling', 'Cling to your parent’s leg for ten minutes', 'safe', [st('happiness', -1), st('karma', 1)]),
    choice('hide', 'Hide under the reading table', 'gamble', [], { p: 0.5, win: [st('happiness', 3), st('smarts', 1)], lose: [st('happiness', -2)], winText: 'A kind kid crawled under to join you. Friends for life.', loseText: 'A teacher spotted your shoes. Mortifying.' }),
  ], { tags: ['school'], once: true }),
  ev('ch.school.show-and-tell', 'Show and Tell', 'Everybody has to bring something to talk about. You have a whole evening to decide.', 5, 9, 3, [
    choice('frog', 'Bring a live frog in a lunchbox', 'gamble', [], { p: 0.5, win: [st('happiness', 5), st('karma', 1)], lose: [st('happiness', -3), st('karma', -2)], winText: 'The class is spellbound. The frog is a hero.', loseText: 'The frog escaped. A teacher screamed. You were blamed.' }),
    choice('drawing', 'Show your best drawing', 'safe', [st('smarts', 1), st('happiness', 2)]),
    choice('nothing', 'Claim you forgot and make something up', 'safe', [st('karma', -1), st('smarts', 1)]),
  ], { tags: ['school', 'mischief'], cooldown: 3 }),
  ev('ch.school.spelling-bee', 'The Spelling Bee', 'A hall of nervous kids, a microphone and a very long word.', 6, 11, 2, [
    choice('compete', 'Step up to the microphone', 'gamble', [], { p: 0.5, win: [st('smarts', 3), st('happiness', 5), log('🏆', 'You won the school spelling bee.')], lose: [st('happiness', -2), st('smarts', 1)], winText: 'You spelled "rhythm" without a blink. Trophy time.', loseText: 'You dropped a letter in "necessary". The crowd sighed.' }),
    choice('coach', 'Quietly help a friend practise instead', 'safe', [st('karma', 3), st('smarts', 1)]),
    choice('skip', 'Pretend you have a stomach ache', 'safe', [st('happiness', 1), st('karma', -1)]),
  ], { tags: ['school'], requiresTraits: ['bookworm', 'curious', 'prodigy', 'perfectionist', 'logical'] }),
  ev('ch.school.bully', 'The Corner of the Playground', 'A bigger kid keeps taking your seat, your snack and your good mood.', 7, 12, 3, [
    choice('tell', 'Tell a teacher', 'safe', [st('happiness', -1), st('karma', 1), flag('ch_bullied')]),
    choice('ignore', 'Keep your head down and say nothing', 'risky', [st('happiness', -4), flag('ch_bullied')]),
    choice('fight', 'Stand up to them yourself', 'gamble', [flag('ch_bullied')], { p: 0.4, win: [st('happiness', 4), st('karma', 1)], lose: [st('happiness', -5), st('health', -2)], winText: 'They backed off, surprised. You stood taller all week.', loseText: 'It went badly, and everyone saw.' }),
  ], { tags: ['school', 'friends'], sensitive: true, cooldown: 5 }),
  ev('ch.school.bully-aftermath', 'Something Changed', 'It has been a while since the playground trouble. Things feel different now.', 8, 13, 3, [
    choice('forgive', 'Offer the bully a place on your team', 'gamble', [], { p: 0.55, win: [st('karma', 4), st('happiness', 4), log('🤝', 'You turned a bully into a teammate.')], lose: [st('happiness', -3)], winText: 'They looked ashamed, then grateful. Trouble over.', loseText: 'It was a trick. They laughed, and so did their friends.' }),
    choice('avoid', 'Stay well out of their way', 'safe', [st('happiness', 1)]),
    choice('mentor', 'Help another new kid who is being picked on', 'safe', [st('karma', 4), st('happiness', 2), flag('helpful')]),
  ], { tags: ['school', 'friends'], sensitive: true, requiresFlags: ['ch_bullied'], once: true }),
  ev('ch.friends.bestie', 'The Best Friend', 'You and another kid keep ending up side by side. Soon, it feels like you have a twin.', 6, 10, 3, [
    choice('inseparable', 'Declare yourselves official best friends', 'safe', [st('happiness', 5), st('karma', 1), flag('ch_bestie')]),
    choice('secret', 'Invent a secret handshake', 'safe', [st('happiness', 4), st('smarts', 1), flag('ch_bestie')]),
    choice('rival', 'Keep competing over everything', 'safe', [st('happiness', 2), st('smarts', 1), flag('ch_bestie')]),
  ], { tags: ['friends'], once: true }),
  ev('ch.friends.bestie-moves', 'The Moving Van', 'Your best friend is moving across the country. The van is already in their driveway.', 8, 12, 3, [
    choice('letters', 'Promise to write every week', 'safe', [st('happiness', -2), st('karma', 2), st('smarts', 1)]),
    choice('gift', 'Give them your favourite thing to remember you by', 'safe', [st('happiness', -1), st('karma', 4)]),
    choice('mad', 'Refuse to say goodbye', 'safe', [st('happiness', -4), st('karma', -1)]),
  ], { tags: ['friends', 'grief'], requiresFlags: ['ch_bestie'], once: true }),
  ev('ch.friends.sleepover', 'The Sleepover', 'Sleeping bags, popcorn, and a flashlight tucked under someone’s chin.', 7, 12, 3, [
    choice('story', 'Tell the scariest story you know', 'gamble', [], { p: 0.6, win: [st('happiness', 4), st('smarts', 1)], lose: [st('happiness', -2), st('energy', -3)], winText: 'Everybody squealed. Legend status.', loseText: 'You scared yourself far worse than anyone else. No sleep.' }),
    choice('pillow', 'Start the great pillow war', 'safe', [st('happiness', 4), st('energy', -2)]),
    choice('quiet', 'Sneak out to the kitchen for midnight snacks', 'safe', [st('happiness', 2), st('health', -1)]),
  ], { tags: ['friends'], cooldown: 3 }),
  ev('ch.friends.den', 'The Den', 'Cardboard boxes, old sheets and a rule: no grown-ups allowed.', 6, 11, 2, [
    choice('build', 'Build a proper fortress with a secret door', 'safe', [st('smarts', 2), st('happiness', 3)]),
    choice('kingdom', 'Declare yourselves a tiny kingdom with laws', 'safe', [st('happiness', 3), st('karma', -1)]),
    choice('stew', 'Cook "stew" from mud and leaves', 'safe', [st('happiness', 3), st('health', -1)]),
  ], { tags: ['friends', 'creativity', 'nature'] }),
  ev('ch.friends.secret-club', 'The Secret Club', 'Somebody has drawn a skull on a piece of card. Apparently, you are now in a gang.', 6, 10, 2, [
    choice('join', 'Join and take the oath with a straight face', 'safe', [st('happiness', 3), st('karma', -1)]),
    choice('lead', 'Make yourself president', 'gamble', [], { p: 0.5, win: [st('happiness', 4), st('smarts', 1)], lose: [st('happiness', -2), st('karma', -1)], winText: 'Your word is law. For one glorious week.', loseText: 'A coup. You were voted out before lunch.' }),
    choice('refuse', 'Start a rival club for everyone left out', 'safe', [st('karma', 3), st('happiness', 2)]),
  ], { tags: ['friends', 'mischief'], requiresTraits: ['rebel', 'prankster', 'charming', 'life-of-party'] }),
  ev('ch.friends.lunch-alone', 'The Kid Alone at Lunch', 'A new kid sits by themselves every day, eating slowly, pretending to be busy.', 7, 12, 3, [
    choice('sit', 'Carry your tray over and sit with them', 'safe', [st('karma', 4), st('happiness', 3), flag('helpful')]),
    choice('wave', 'Smile and wave from your own table', 'safe', [st('karma', 1)]),
    choice('look', 'Look away; it is not your problem', 'safe', [st('karma', -3), st('happiness', -1)]),
  ], { tags: ['friends', 'school'], requiresTraits: ['empath', 'kind', 'loyal'] }),
  ev('ch.friends.crush', 'The Note', 'Someone in your class makes your stomach do a strange flip every time they glance your way.', 9, 12, 2, [
    choice('note', 'Pass them a folded-up note', 'gamble', [], { p: 0.5, win: [st('happiness', 5), log('💌', 'Your very first crush wrote back.')], lose: [st('happiness', -4)], winText: 'They wrote "yes" in purple pen. You floated home.', loseText: 'They passed it to the whole class. You wished the floor would swallow you.' }),
    choice('poem', 'Write a long poem and never show anyone', 'safe', [st('smarts', 1), st('happiness', 1)]),
    choice('deny', 'Insist you simply cannot stand them', 'safe', [st('happiness', -1), st('karma', -1)]),
  ], { tags: ['love', 'school'], once: true, requiresTraits: ['romantic', 'charming', 'daydreamer'] }),
  ev('ch.family.new-baby', 'A New Arrival', 'Your parents sit you down with very serious faces. There is going to be a baby in the house.', 5, 10, 3, [
    choice('thrilled', 'Be an enthusiastic big kid', 'safe', [st('happiness', 3), st('karma', 2), flag('ch_sibling')]),
    choice('jealous', 'Feel the spotlight slipping away', 'safe', [st('happiness', -3), st('karma', -1), flag('ch_sibling')]),
    choice('helper', 'Become the official nappy-fetcher', 'safe', [st('karma', 3), st('energy', -2), st('happiness', 1), flag('ch_sibling')]),
  ], { tags: ['family'], once: true }),
  ev('ch.family.sibling-rivalry', 'The Sibling Situation', 'Your little brother or sister has, apparently, borrowed your best things without permission.', 6, 12, 3, [
    choice('tattle', 'Tattle to the nearest adult', 'safe', [st('happiness', -1), st('karma', -1)]),
    choice('share', 'Show them how to play properly', 'safe', [st('karma', 3), st('happiness', 2)]),
    choice('revenge', 'Plot a gentle, elaborate revenge', 'gamble', [], { p: 0.5, win: [st('happiness', 3), st('karma', -1)], lose: [st('happiness', -3), st('karma', -3)], winText: 'The plan went off without a hitch. Beautiful.', loseText: 'The plan backfired. You are in so much trouble.' }),
  ], { tags: ['family', 'mischief'], requiresFlags: ['ch_sibling'] }),
  ev('ch.family.shouting', 'The Raised Voices', 'Through the wall, grown-ups argue in low, hard voices. You pretend not to hear.', 6, 12, 2, [
    choice('headphones', 'Hide under the covers with a book', 'safe', [st('happiness', -2), st('smarts', 1)]),
    choice('peek', 'Creep to the stairs and listen', 'risky', [st('happiness', -4), st('smarts', 1)]),
    choice('knock', 'Knock and ask for a hot chocolate', 'safe', [st('happiness', 1), st('karma', 1)]),
  ], { tags: ['family'], sensitive: true, cooldown: 4 }),
  ev('ch.family.grandparent-stories', 'Grandma’s Kitchen', 'Your grandparent tells you stories from long ago while you shell peas at the table.', 5, 11, 3, [
    choice('listen', 'Listen to every word', 'safe', [st('smarts', 2), st('happiness', 3), st('karma', 1), flag('ch_grandparent_close')]),
    choice('help', 'Learn the family recipe by heart', 'safe', [st('smarts', 1), st('happiness', 3), flag('ch_grandparent_close')]),
    choice('wander', 'Wander off to play instead', 'safe', [st('happiness', 1)]),
  ], { tags: ['family', 'food'], cooldown: 3 }),
  ev('ch.family.grandparent-passes', 'The Empty Chair', 'The grandparent you love is not coming home. Grown-ups use soft words. It does not help.', 8, 12, 4, [
    choice('funeral', 'Go to the funeral and hold someone’s hand', 'safe', [st('happiness', -6), st('karma', 2), st('smarts', 1)]),
    choice('picture', 'Draw them a picture and keep it forever', 'safe', [st('happiness', -3), st('smarts', 1), log('🖼️', 'You kept the picture you drew for your grandparent for the rest of your life.')]),
    choice('hide', 'Shut your bedroom door and refuse to talk', 'risky', [st('happiness', -7), st('health', -1), { type: 'addTrait', trait: { id: 'scarred', label: 'Scarred', icon: '🩹', temperament: 'gloomy' } }]),
  ], { tags: ['grief', 'family'], sensitive: true, once: true, requiresFlags: ['ch_grandparent_close'] }),
  ev('ch.family.chores', 'Pocket Money Deal', 'Your parents offer a deal: do the washing-up all week and earn real coins.', 6, 12, 3, [
    choice('deal', 'Take the deal and scrub with pride', 'safe', [money(15), st('energy', -2), st('karma', 1)]),
    choice('haggle', 'Haggle for double the pay', 'gamble', [], { p: 0.4, win: [money(30), st('smarts', 1)], lose: [st('karma', -1), st('happiness', -1)], winText: 'They were impressed by your negotiating. Double!', loseText: 'They took the offer off the table. Chores for free.' }),
    choice('refuse', 'Refuse; childhood is for play', 'safe', [st('happiness', 2)]),
  ], { tags: ['family', 'money'] }),
  ev('ch.family.road-trip', 'The Long Drive', 'Seven hours in the back seat. A bag of snacks, a game of spot the lorry, and nowhere to hide.', 6, 12, 3, [
    choice('window', 'Stare out of the window and daydream', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('sing', 'Lead the whole car in a terrible sing-along', 'safe', [st('happiness', 4), st('energy', -1)]),
    choice('snacks', 'Eat all the snacks by lunchtime', 'safe', [st('happiness', 2), st('health', -2)]),
    choice('sick', 'Be violently carsick at the first lay-by', 'safe', [st('happiness', -2), st('health', -1)]),
  ], { tags: ['family', 'travel'], cooldown: 4 }),
  ev('ch.family.moving', 'The Boxes Are Packed', 'Cardboard boxes line the hallway. Your parents say you are moving somewhere new.', 6, 12, 3, [
    choice('excited', 'Pick your new bedroom in advance', 'safe', [st('happiness', 2), st('smarts', 1), flag('ch_moved')]),
    choice('sulk', 'Refuse to pack your things', 'safe', [st('happiness', -3), flag('ch_moved')]),
    choice('map', 'Draw a map of the old street so you never forget it', 'safe', [st('happiness', -1), st('smarts', 2), flag('ch_moved')]),
  ], { tags: ['family'], once: true }),
  ev('ch.school.new-school', 'The New Classroom', 'Everyone seems to know each other already. You know nobody.', 7, 13, 3, [
    choice('introduce', 'Introduce yourself with a joke', 'gamble', [], { p: 0.55, win: [st('happiness', 4), st('karma', 1)], lose: [st('happiness', -3)], winText: 'They laughed in the right place. You found a seat and a friend.', loseText: 'Silence. Somebody coughed. You wanted to melt.' }),
    choice('observe', 'Watch from the back and wait', 'safe', [st('smarts', 1), st('happiness', -1)]),
    choice('book', 'Bury yourself in a book at break time', 'safe', [st('smarts', 2), st('happiness', -2)]),
  ], { tags: ['school', 'friends'], requiresFlags: ['ch_moved'], once: true }),
  ev('ch.family.tight-budget', 'The School Trip Form', 'Everyone is going to the zoo. The form says the trip costs more than your family can easily spare.', 6, 12, 3, [
    choice('ask', 'Hand it over and hope for the best', 'gamble', [], { p: 0.5, win: [st('happiness', 4), st('karma', 1)], lose: [st('happiness', -4)], winText: 'Your parents found the money somehow. You never forgot it.', loseText: 'They could not. You stayed behind in the library.' }),
    choice('hide', 'Hide the form and say you are not interested', 'safe', [st('happiness', -3), st('karma', -1), st('smarts', 1)]),
    choice('fund', 'Sell your old toys to cover it', 'safe', [money(10), st('happiness', 1), st('karma', 2)]),
  ], { tags: ['money', 'school', 'family'], sensitive: true, requiresFlags: ['family_struggling'], cooldown: 5 }),
  ev('ch.family.big-present', 'The Enormous Present', 'A huge, gleaming gift sits under the tree. It cost more than most kids’ bikes.', 6, 12, 3, [
    choice('flaunt', 'Show it off to every kid on the street', 'safe', [st('happiness', 3), st('karma', -2)]),
    choice('share', 'Invite everyone to play with it', 'safe', [st('karma', 3), st('happiness', 3)]),
    choice('bored', 'Play with the box instead', 'safe', [st('smarts', 2), st('happiness', 2)]),
  ], { tags: ['money', 'family'], requiresFlags: ['family_wealthy'], cooldown: 5 }),
  ev('ch.pets.hamster', 'A Pet of Your Own', 'You have begged for months. Today, your parents say yes to something small and furry.', 6, 11, 3, [
    choice('hamster', 'Bring home a hamster and name it Biscuit', 'safe', [money(-15), st('happiness', 5), st('karma', 1), flag('ch_pet')]),
    choice('goldfish', 'Win a goldfish at the fair', 'safe', [st('happiness', 3), flag('ch_pet')]),
    choice('wait', 'Decide you are not ready for the responsibility', 'safe', [st('smarts', 1)]),
  ], { tags: ['pets', 'family'], forbidsFlags: ['ch_pet'], once: true }),
  ev('ch.pets.stray', 'The Stray', 'A scruffy cat follows you home from school and sits on your doorstep with an expectant face.', 6, 12, 3, [
    choice('feed', 'Sneak out a bowl of milk', 'safe', [st('happiness', 4), st('karma', 3), flag('ch_pet')]),
    choice('plead', 'Beg your parents to keep it', 'gamble', [], { p: 0.5, win: [st('happiness', 6), st('karma', 2), flag('ch_pet'), log('🐈', 'A stray cat became yours.')], lose: [st('happiness', -3)], winText: 'They gave in. The cat moved in that night.', loseText: 'They said no. You watched the cat go with a heavy heart.' }),
    choice('shoo', 'Shoo it away; it might be dirty', 'safe', [st('karma', -2)]),
  ], { tags: ['pets', 'nature'], forbidsFlags: ['ch_pet'], requiresTraits: ['green-thumb', 'kind', 'empath'], once: true }),
  ev('ch.pets.trick', 'A Very Clever Animal', 'Your pet has figured out how to open the cage, the gate or the cupboard. They will go further.', 7, 12, 3, [
    choice('train', 'Teach them a proper trick with treats', 'safe', [st('smarts', 2), st('happiness', 3)]),
    choice('film', 'Hold a neighbourhood show', 'gamble', [], { p: 0.5, win: [money(8), st('happiness', 4)], lose: [st('happiness', -1), st('karma', -1)], winText: 'Fifteen kids paid in sweets. Fame!', loseText: 'The animal froze, then fled under the sofa.' }),
    choice('hide', 'Keep it a delightful secret', 'safe', [st('happiness', 2)]),
  ], { tags: ['pets'], requiresFlags: ['ch_pet'] }),
  ev('ch.pets.goodbye', 'Saying Goodbye', 'Your pet is old now, slower than they were. Today the vet says it is time.', 9, 12, 4, [
    choice('stay', 'Stay with them until the very end', 'safe', [st('happiness', -5), st('karma', 3), st('smarts', 1)]),
    choice('garden', 'Bury them under the old tree with a small cross', 'safe', [st('happiness', -4), st('karma', 2), log('🪦', 'You buried your first pet in the garden.')]),
    choice('avoid', 'Pretend nothing happened and play outside', 'risky', [st('happiness', -6), st('karma', -1)]),
  ], { tags: ['pets', 'grief'], sensitive: true, once: true, requiresFlags: ['ch_pet'] }),
  ev('ch.imaginary-goodbye', 'The Chair is Empty', 'You realise you have not talked to your invisible friend in a long time.', 6, 9, 3, [
    choice('farewell', 'Say a gentle goodbye and thank them', 'safe', [st('happiness', 1), st('karma', 2), st('smarts', 1)]),
    choice('keep', 'Keep them for rainy days', 'safe', [st('happiness', 2)]),
    choice('write', 'Write the adventures down in a notebook', 'safe', [st('smarts', 2), st('happiness', 2), st('looks', -1)]),
  ], { tags: ['creativity'], once: true, requiresFlags: ['ch_imaginary_friend'] }),
  ev('ch.hobby.piano', 'Music Lessons', 'Somebody has put a battered piano in the hall. It comes with a stern, kind teacher.', 6, 10, 3, [
    choice('practise', 'Practise every single day', 'safe', [st('smarts', 2), st('energy', -2), st('happiness', 1), flag('ch_music')]),
    choice('wing', 'Fake it and hope no one notices', 'safe', [st('happiness', 1), st('smarts', 1), flag('ch_music')]),
    choice('quit', 'Quit after three lessons', 'safe', [st('happiness', 2), st('karma', -1)]),
  ], { tags: ['creativity', 'school'], once: true }),
  ev('ch.hobby.recital', 'The Recital', 'The hall is full of chairs, and the chairs are full of parents. You are next.', 8, 12, 4, [
    choice('play', 'Walk up and play your piece', 'gamble', [], { p: 0.6, win: [st('happiness', 6), st('smarts', 1), log('🎹', 'You played a solo to a standing ovation of eleven people.')], lose: [st('happiness', -3)], winText: 'Every note landed. Your teacher cried.', loseText: 'Your fingers froze at bar nine. You started over twice.' }),
    choice('duet', 'Ask a friend to play alongside you', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('faint', 'Fake a stomach bug and slip away', 'safe', [st('happiness', -2), st('karma', -1)]),
  ], { tags: ['creativity'], requiresFlags: ['ch_music'], once: true }),
  ev('ch.hobby.football', 'Saturday Match', 'The local team needs one more kid. It is pouring rain.', 6, 12, 3, [
    choice('goalie', 'Volunteer to be goalkeeper', 'gamble', [], { p: 0.5, win: [st('health', 2), st('happiness', 4), st('karma', 1)], lose: [st('health', -2), st('happiness', -1)], winText: 'A diving save! The sideline went wild.', loseText: 'Eleven goals. You will not speak of it.' }),
    choice('striker', 'Insist on playing up front', 'safe', [st('health', 2), st('energy', -3), st('happiness', 2)]),
    choice('mud', 'Spend the whole match in the mud', 'safe', [st('happiness', 4), st('looks', -1)]),
  ], { tags: ['sports'], requiresTraits: ['athletic', 'daredevil', 'tough'] }),
  ev('ch.hobby.drawing', 'The Sketchbook', 'You fill a whole sketchbook with creatures that do not exist.', 6, 12, 3, [
    choice('show', 'Show it to the art teacher', 'safe', [st('smarts', 1), st('happiness', 4)]),
    choice('hide', 'Keep it a secret under the mattress', 'safe', [st('happiness', 2), st('smarts', 1)]),
    choice('sell', 'Sell little drawings at break time', 'gamble', [], { p: 0.55, win: [money(12), st('happiness', 3)], lose: [st('karma', -1), st('happiness', -1)], winText: 'Four sold for sweets, then a pound coin.', loseText: 'A teacher confiscated your wares.' }),
  ], { tags: ['creativity', 'school'], requiresTraits: ['creative', 'daydreamer', 'shy'] }),
  ev('ch.hobby.chess', 'The Chess Club', 'A dusty box of pieces appears in the library. Someone says there is a tournament.', 7, 12, 2, [
    choice('learn', 'Learn the openings from a book', 'safe', [st('smarts', 3), st('energy', -1)]),
    choice('enter', 'Enter the tournament anyway', 'gamble', [], { p: 0.4, win: [st('smarts', 3), st('happiness', 5), log('♟️', 'You won your school chess tournament.')], lose: [st('smarts', 1), st('happiness', -2)], winText: 'Checkmate in nine moves! Medals for everyone, but yours is shinier.', loseText: 'Lost to a seven-year-old. Painful but educational.' }),
    choice('pieces', 'Use the pieces for a battle game instead', 'safe', [st('happiness', 3), st('karma', -1)]),
  ], { tags: ['school'], requiresTraits: ['logical', 'curious', 'prodigy', 'perfectionist'] }),
  ev('ch.hobby.collection', 'The Collection', 'Rocks, cards, shells, stickers. Something has taken over your bedroom shelf.', 6, 12, 3, [
    choice('trade', 'Trade shrewdly in the playground', 'gamble', [], { p: 0.5, win: [money(10), st('smarts', 1), st('happiness', 2)], lose: [st('happiness', -2), st('karma', -1)], winText: 'You got a shiny one for three common ones.', loseText: 'You were swindled by a nine-year-old.' }),
    choice('catalogue', 'Label and catalogue every item', 'safe', [st('smarts', 2), st('happiness', 2)]),
    choice('share', 'Give half of it to a friend who loves it too', 'safe', [st('karma', 3), st('happiness', 3)]),
  ], { tags: ['money', 'friends'] }),
  ev('ch.mischief.sweets', 'The Sweet Shop', 'The sweets are right there. The shopkeeper is looking away. Your pocket is open.', 6, 10, 3, [
    choice('take', 'Slip a handful into your pocket', 'gamble', [flag('ch_stole_candy')], { p: 0.55, win: [st('happiness', 2), st('karma', -3)], lose: [st('happiness', -4), st('karma', -3)], winText: 'Nobody saw. Your stomach felt strange anyway.', loseText: 'A hand landed on your shoulder. Your mum was called.' }),
    choice('buy', 'Spend your pocket money properly', 'safe', [money(-3), st('happiness', 2), st('health', -1)]),
    choice('walk', 'Walk straight out', 'safe', [st('karma', 2)]),
  ], { tags: ['mischief', 'crime', 'food'], cooldown: 5 }),
  ev('ch.mischief.guilt', 'The Sticky Secret', 'You have been thinking about the stolen sweets for weeks. It is a pebble in your shoe.', 7, 12, 3, [
    choice('confess', 'Confess and offer to pay it back', 'safe', [money(-5), st('karma', 5), st('happiness', 2)]),
    choice('bury', 'Bury it and never mention it again', 'safe', [st('karma', -2), st('happiness', -1)]),
    choice('note', 'Leave coins and a note at the shop', 'safe', [money(-3), st('karma', 3), st('happiness', 2)]),
  ], { tags: ['mischief', 'crime'], requiresFlags: ['ch_stole_candy'], once: true }),
  ev('ch.mischief.prank', 'The Perfect Prank', 'You have a plastic spider, a clear shelf and a very jumpy teacher.', 7, 12, 3, [
    choice('spider', 'Plant the spider on their desk', 'gamble', [], { p: 0.5, win: [st('happiness', 5), st('karma', -1)], lose: [st('happiness', -3), st('karma', -3)], winText: 'The scream was legendary. The class cheered.', loseText: 'It was the head teacher’s chair. Detention for a week.' }),
    choice('bucket', 'Rig a door with a bucket of water', 'risky', [st('karma', -4), st('happiness', 2)]),
    choice('applause', 'Have the class clap as they enter', 'safe', [st('happiness', 3), st('karma', 1)]),
  ], { tags: ['mischief', 'school'], requiresTraits: ['prankster', 'rebel', 'reckless'] }),
  ev('ch.mischief.window', 'The Broken Window', 'A football, a neighbour’s window and a very loud crash.', 6, 12, 3, [
    choice('confess', 'Knock and own up', 'safe', [money(-12), st('karma', 4), st('happiness', -1)]),
    choice('run', 'Sprint away and hide', 'gamble', [], { p: 0.5, win: [st('happiness', 1), st('karma', -3)], lose: [st('karma', -4), st('happiness', -4), money(-20)], winText: 'Nobody saw you. You avoided the neighbour for a month.', loseText: 'They saw you. Double the trouble.' }),
    choice('blame', 'Blame the cat', 'safe', [st('karma', -3), st('happiness', 1)]),
  ], { tags: ['mischief', 'crime'] }),
  ev('ch.mischief.whopper', 'The Tall Tale', 'You told everyone you were friends with a famous footballer. The tale is growing.', 6, 12, 2, [
    choice('double', 'Embellish with details', 'gamble', [], { p: 0.4, win: [st('happiness', 4), st('smarts', 1)], lose: [st('happiness', -4), st('karma', -3)], winText: 'The whole class hung on your every word.', loseText: 'Someone asked for proof. You had none. Total humiliation.' }),
    choice('admit', 'Admit it was a joke', 'safe', [st('karma', 2), st('happiness', -1)]),
    choice('story', 'Turn it into a proper story and write it down', 'safe', [st('smarts', 2), st('happiness', 2)]),
  ], { tags: ['mischief', 'school', 'creativity'] }),
  ev('ch.nature.bugs', 'Bug Hunt', 'Under every stone in the garden, a tiny world is happening.', 5, 12, 3, [
    choice('jar', 'Collect specimens in a jar', 'safe', [st('smarts', 2), st('happiness', 3), st('karma', -1)]),
    choice('watch', 'Lie on your stomach and watch for an hour', 'safe', [st('smarts', 2), st('happiness', 3)]),
    choice('release', 'Build a tiny hotel for them under the shed', 'safe', [st('karma', 3), st('happiness', 3)]),
  ], { tags: ['nature'], requiresTraits: ['curious', 'green-thumb', 'wanderer'] }),
  ev('ch.nature.pond', 'The Pond', 'The village pond looks cold, green and magnificent. Your friends dare you in.', 7, 12, 3, [
    choice('dive', 'Jump in with all your clothes on', 'gamble', [], { p: 0.7, win: [st('happiness', 5), st('health', 1)], lose: [st('health', -4), st('happiness', -2), cond({ id: 'chest-cold', name: 'Chest Cold', icon: '🤧', kind: 'illness', severity: 1, chronic: false, diagnosed: true })], winText: 'Freezing, glorious and unforgettable.', loseText: 'You caught a terrible cold. Worth it? Debatable.' }),
    choice('dip', 'Dip in a toe and refuse to go further', 'safe', [st('happiness', 1)]),
    choice('frogs', 'Spend the afternoon hunting for tadpoles', 'safe', [st('smarts', 1), st('happiness', 3)]),
  ], { tags: ['nature', 'adventure'], requiresTraits: ['daredevil', 'wanderer', 'reckless', 'athletic'] }),
  ev('ch.nature.snow-day', 'Snow Day', 'You wake up to a world that has gone white and silent. School is closed.', 5, 12, 3, [
    choice('snowman', 'Build the biggest snowman on the street', 'safe', [st('happiness', 4), st('energy', -2), st('health', 1)]),
    choice('sledge', 'Race down the hill on a tea tray', 'gamble', [], { p: 0.75, win: [st('happiness', 5), st('health', 1)], lose: [st('health', -3), st('happiness', -1)], winText: 'Fastest run of the day. You crowed with joy.', loseText: 'Face-first into a snowdrift. And a bruised wrist.' }),
    choice('cocoa', 'Stay in with hot cocoa and a book', 'safe', [st('happiness', 3), st('smarts', 1)]),
  ], { tags: ['nature', 'family'], cooldown: 4 }),
  ev('ch.nature.sunflower', 'The Sunflower', 'A packet of seeds, a pot, a windowsill. A dare from your teacher: whoever grows the tallest wins.', 6, 12, 3, [
    choice('tend', 'Water it daily and sing to it', 'safe', [st('happiness', 3), st('karma', 1), st('smarts', 1)]),
    choice('cheat', 'Add a splash of your mum’s plant food', 'gamble', [], { p: 0.5, win: [st('happiness', 4), st('smarts', 1), log('🌻', 'You grew the tallest sunflower in class.')], lose: [st('happiness', -2), st('karma', -1)], winText: 'Two metres tall by the summer holidays.', loseText: 'You overdid it. The poor thing wilted.' }),
    choice('forget', 'Forget about it entirely', 'safe', [st('happiness', -1)]),
  ], { tags: ['nature', 'school'], requiresTraits: ['green-thumb', 'curious', 'kind', 'disciplined'] }),
  ev('ch.money.tooth', 'The Wobbly Tooth', 'It has hung by a thread for a week. Tonight, it is coming out.', 5, 8, 3, [
    choice('pull', 'Yank it out yourself at breakfast', 'safe', [money(5), st('happiness', 3), st('health', -1)]),
    choice('wait', 'Wait for it to fall out in an apple', 'safe', [money(5), st('happiness', 2)]),
    choice('trap', 'Set a trap to catch the tooth fairy', 'gamble', [], { p: 0.35, win: [money(10), st('smarts', 1), st('happiness', 3)], lose: [st('happiness', -2), st('smarts', 1)], winText: 'You saw a glimmer of wings. Or maybe your dad. Double coins!', loseText: 'You fell asleep and missed everything.' }),
  ], { tags: ['family', 'money', 'health'], cooldown: 2 }),
  ev('ch.money.stickers', 'The Sticker Market', 'You have noticed other kids will pay almost anything for a shiny sticker.', 7, 12, 2, [
    choice('trade', 'Hoard the rare ones and sell high', 'gamble', [], { p: 0.55, win: [money(25), st('smarts', 2)], lose: [st('karma', -2), st('happiness', -2)], winText: 'You earned more than your weekly pocket money.', loseText: 'The craze ended overnight. Your hoard is worthless.' }),
    choice('swap', 'Swap fairly and keep everyone happy', 'safe', [st('karma', 2), st('happiness', 2)]),
    choice('give', 'Give your favourites to a friend', 'safe', [st('karma', 3), st('happiness', 3)]),
  ], { tags: ['money', 'friends'], requiresTraits: ['selfish', 'ambitious', 'logical', 'charming'] }),
  ev('ch.money.birthday-cash', 'Birthday Money', 'Great aunts, grandparents and a neighbour or two have slipped coins into your hands.', 6, 12, 3, [
    choice('spend', 'Spend it all on sweets and a toy', 'safe', [money(-20), st('happiness', 4), st('health', -1)]),
    choice('save', 'Put it in the piggy bank', 'safe', [money(10), st('smarts', 1), st('karma', 1)]),
    choice('give', 'Buy a gift for your best friend', 'safe', [money(-10), st('karma', 3), st('happiness', 2)]),
  ], { tags: ['money', 'family'], cooldown: 3 }),
  ev('ch.health.flu', 'The Sick Week', 'You have been home, wrapped in a duvet, for six days. The couch is your whole kingdom.', 5, 12, 3, [
    choice('rest', 'Rest properly and drink all the juice', 'safe', [st('health', 1), st('energy', 3), st('happiness', 1)]),
    choice('study', 'Read every book in the house', 'safe', [st('smarts', 2), st('health', -1)]),
    choice('school', 'Insist on going back too early', 'gamble', [], { p: 0.5, win: [st('smarts', 1), st('karma', 1)], lose: [st('health', -4), st('happiness', -2)], winText: 'You pushed through and nobody noticed.', loseText: 'You relapsed in the middle of lessons.' }),
  ], { tags: ['health', 'school'], requiresTraits: ['sickly', 'bookworm', 'anxious', 'homebody'] }),
  ev('ch.health.monkey-bars', 'The Monkey Bars', 'Three bars, then four, then five. The record belongs to a sixth-grader.', 6, 12, 3, [
    choice('skip', 'Skip two bars at once', 'gamble', [], { p: 0.6, win: [st('happiness', 5), st('health', 1), st('karma', 1)], lose: [st('health', -6), st('happiness', -3), cond({ id: 'broken-arm', name: 'Broken Arm', icon: '🦴', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], winText: 'Record broken! The playground chanted your name.', loseText: 'You landed wrong. The cast got signed by everybody.' }),
    choice('careful', 'Take it one bar at a time', 'safe', [st('health', 1), st('happiness', 1)]),
    choice('referee', 'Appoint yourself referee', 'safe', [st('smarts', 1), st('happiness', 2)]),
  ], { tags: ['sports', 'health', 'adventure'], requiresTraits: ['daredevil', 'reckless', 'athletic', 'rebel'] }),
  ev('ch.health.glasses', 'The Eye Test', 'The board is fuzzy. The teacher’s face is fuzzy. The school nurse gives you a letter to take home.', 6, 11, 3, [
    choice('proud', 'Pick the boldest frames in the shop', 'safe', [money(-30), st('happiness', 3), st('smarts', 1), st('looks', 1)]),
    choice('hate', 'Hide them in your bag whenever you can', 'safe', [st('happiness', -2), st('looks', -1)]),
    choice('superhero', 'Insist they give you secret powers', 'safe', [st('happiness', 3), st('smarts', 1)]),
  ], { tags: ['health', 'school'], once: true }),
  ev('ch.health.dentist', 'The Dentist’s Chair', 'The ceiling light is blinding. The drill makes sounds you do not like.', 5, 12, 2, [
    choice('brave', 'Count the ceiling tiles and be brave', 'safe', [st('health', 1), st('happiness', -1), st('karma', 1)]),
    choice('panic', 'Refuse to open your mouth', 'gamble', [], { p: 0.45, win: [st('happiness', 1)], lose: [st('health', -2), st('happiness', -3), money(-30)], winText: 'The dentist gave up and sent you home with a sticker.', loseText: 'The tooth got worse. A much longer visit followed.' }),
    choice('distract', 'Hum your favourite song through it', 'safe', [st('happiness', 1), st('health', 1)]),
  ], { tags: ['health'], requiresTraits: ['anxious', 'shy', 'sickly', 'cautious'] }),
  ev('ch.school.exam-nerves', 'The Big Test', 'The first real exam. Your hands are damp and your pencil is trembling.', 8, 12, 3, [
    choice('revise', 'Revise until midnight', 'safe', [st('smarts', 2), st('energy', -3), st('happiness', -2)]),
    choice('breathe', 'Take a deep breath and hope for the best', 'gamble', [], { p: 0.55, win: [st('smarts', 2), st('happiness', 3)], lose: [st('smarts', -1), st('happiness', -3)], winText: 'You flew through the paper. Calm worked wonders.', loseText: 'Your mind went blank on the second page.' }),
    choice('sick', 'Fake a headache and hope to skip it', 'safe', [st('happiness', 1), st('karma', -2), st('smarts', -1)]),
  ], { tags: ['school'], requiresTraits: ['anxious', 'perfectionist', 'prodigy'] }),
  ev('ch.school.talent-show', 'The Talent Show', 'A stage, a spotlight and a sign-up sheet that is suspiciously empty.', 8, 12, 3, [
    choice('perform', 'Put your name down for a comedy routine', 'gamble', [], { p: 0.55, win: [st('happiness', 6), st('looks', 1), log('🎤', 'You killed it at the school talent show.')], lose: [st('happiness', -4)], winText: 'The hall roared. You took a bow.', loseText: 'Crickets. A teacher clapped alone.' }),
    choice('curtain', 'Work the curtains and lights', 'safe', [st('smarts', 1), st('happiness', 2)]),
    choice('watch', 'Sit in the audience and clap loudly', 'safe', [st('happiness', 2)]),
  ], { tags: ['school', 'fame', 'creativity'], requiresTraits: ['charming', 'life-of-party', 'creative', 'shy'] }),
  ev('ch.school.homework', 'The Homework Mountain', 'Maths, spelling and a project on volcanoes. The sofa, meanwhile, is calling.', 7, 12, 3, [
    choice('sofa', 'Lie on the sofa and promise "later"', 'gamble', [], { p: 0.4, win: [st('happiness', 3), st('energy', 2)], lose: [st('smarts', -1), st('karma', -1), st('happiness', -2)], winText: 'A snow day saved you. Lucky.', loseText: 'You rushed it at breakfast and got caught.' }),
    choice('half', 'Do half now, half before school', 'safe', [st('smarts', 1), st('energy', -1)]),
    choice('all', 'Smash it out right away', 'safe', [st('smarts', 2), st('energy', -2)]),
  ], { tags: ['school'], requiresTraits: ['lazy', 'flaky', 'daydreamer', 'laid-back'] }),
  ev('ch.school.teacher', 'The Teacher Who Noticed', 'A teacher keeps you behind after class. You braced for trouble. It was not trouble.', 7, 12, 3, [
    choice('listen', 'Listen to their advice', 'safe', [st('smarts', 3), st('happiness', 2), st('karma', 1)]),
    choice('shrug', 'Nod politely and forget it', 'safe', [st('happiness', 1)]),
    choice('ask', 'Ask them to recommend a book', 'safe', [st('smarts', 2), st('happiness', 2)]),
  ], { tags: ['school'], cooldown: 5 }),
  ev('ch.faith.big-questions', 'The Big Questions', 'Lying awake, you wonder where we go when we are gone. Nobody around you has a satisfying answer.', 7, 12, 2, [
    choice('ask', 'Ask the grown-ups at the dinner table', 'safe', [st('smarts', 1), st('happiness', 1)]),
    choice('pray', 'Whisper a wish to the dark and trust someone is listening', 'safe', [st('happiness', 3), st('karma', 2)]),
    choice('journal', 'Write your questions in a notebook', 'safe', [st('smarts', 2), st('happiness', 1)]),
  ], { tags: ['faith'], requiresTraits: ['spiritual', 'curious', 'empath', 'daydreamer'] }),
  ev('ch.tech.radio', 'The Broken Radio', 'The old radio in the garage has not worked in years. You have a screwdriver and no fear.', 7, 12, 3, [
    choice('fix', 'Take it apart and try to repair it', 'gamble', [], { p: 0.5, win: [st('smarts', 3), st('happiness', 4), log('📻', 'You fixed the old radio, and kept it for years.')], lose: [st('smarts', 1), st('happiness', -2), st('karma', -1)], winText: 'A crackle, then a song. You beamed all evening.', loseText: 'It sparked, fizzled and died forever. Your dad is not thrilled.' }),
    choice('listen', 'Ask your parent to show you how it works', 'safe', [st('smarts', 2), st('happiness', 2)]),
    choice('toy', 'Use the parts to build a robot', 'safe', [st('smarts', 1), st('happiness', 3)]),
  ], { tags: ['tech'], requiresTraits: ['tech-savvy', 'curious', 'logical', 'creative'] }),
  ev('ch.food.kitchen', 'The Kitchen Experiment', 'There is flour, sugar and an oven. Nobody is home yet.', 7, 12, 3, [
    choice('cake', 'Bake a cake with whatever is in the cupboard', 'gamble', [], { p: 0.55, win: [st('happiness', 5), st('karma', 1), st('smarts', 1)], lose: [st('happiness', -2), st('karma', -1)], winText: 'It rose. It was edible. It was glorious.', loseText: 'It collapsed into a sad, burnt puddle. The smoke alarm sang.' }),
    choice('recipe', 'Read the recipe carefully and follow every step', 'safe', [st('smarts', 2), st('happiness', 2)]),
    choice('taste', 'Taste every ingredient raw', 'safe', [st('happiness', 2), st('health', -1)]),
  ], { tags: ['food'], requiresTraits: ['foodie', 'creative', 'curious'] }),
  ev('ch.luck.raffle', 'The Raffle Ticket', 'The school fair has a raffle. The prize is a giant teddy bear and a hamper of treats.', 6, 12, 2, [
    choice('buy', 'Buy five tickets', 'gamble', [money(-5)], { p: 0.35, win: [money(20), st('happiness', 6), log('🎟️', 'You won the school fair raffle.')], lose: [st('happiness', -1)], winText: 'Ticket 217! That is you! The whole school clapped.', loseText: 'Not even a consolation prize.' }),
    choice('one', 'Buy a single ticket', 'safe', [money(-1), st('happiness', 1)]),
    choice('skip', 'Spend the coins on the tombola instead', 'safe', [money(-2), st('happiness', 2)]),
  ], { tags: ['luck', 'money', 'school'], requiresTraits: ['lucky', 'life-of-party', 'daredevil'] }),
];
