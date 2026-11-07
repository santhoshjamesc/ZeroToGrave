import { Condition, Effect, EventChoice, EventDef, StatKey } from '../engine/types';

const st = (stat: StatKey, delta: number): Effect => ({ type: 'stat', stat, delta });
const money = (delta: number): Effect => ({ type: 'money', delta });
const flag = (key: string, value: boolean | number | string = true): Effect => ({ type: 'flag', key, value });
const log = (icon: string, text: string): Effect => ({ type: 'log', icon, text });
const cond = (c: Omit<Condition, 'sinceAge' | 'treated'>): Effect => ({ type: 'addCondition', condition: { ...c, sinceAge: 0, treated: false } });

const choice = (id: string, label: string, riskHint: EventChoice['riskHint'], effects: Effect[], gamble?: EventChoice['gamble']): EventChoice => ({ id, label, riskHint, effects, gamble });
const ev = (id: string, title: string, text: string, minAge: number, maxAge: number, weight: number, choices: EventChoice[], o: Partial<EventDef> = {}): EventDef => ({ id, title, text, minAge, maxAge, weight, mandatory: false, choices, ...o });

/** Teenage events, ages 13-19. IDs prefixed `tn.`. Flags set here: tn_* (see requiresFlags). */
export const teenEvents: EventDef[] = [
  // ---------------- School ----------------
  ev('tn.school.new-term', 'A New Term', 'New timetable, new corridors, same old dread. Everybody seems to have grown a foot over the summer.', 13, 15, 3, [
    choice('reinvent', 'Show up with a whole new look', 'gamble', [], { p: 0.55, win: [st('looks', 2), st('happiness', 4)], lose: [st('happiness', -3), st('looks', -1)], winText: 'Heads turned. Nobody mentioned the old you.', loseText: 'Everybody noticed. Nobody was kind about it.' }),
    choice('lowprofile', 'Keep your head down and survive', 'safe', [st('happiness', -1), st('smarts', 1)]),
    choice('talk', 'Make an effort to talk to someone new', 'safe', [st('happiness', 2), st('karma', 1)]),
  ], { tags: ['school', 'friends'], cooldown: 3 }),
  ev('tn.school.group-project', 'The Group Project', 'Four people, one poster, three days. One of you has not opened a single book.', 13, 18, 3, [
    choice('carry', 'Quietly do all the work yourself', 'safe', [st('smarts', 2), st('energy', -3), st('happiness', -2)]),
    choice('confront', 'Call out the slacker in front of everyone', 'gamble', [], { p: 0.5, win: [st('karma', 1), st('happiness', 2), st('smarts', 1)], lose: [st('karma', -2), st('happiness', -3)], winText: 'They shaped up. The poster was decent.', loseText: 'It turned into a row. The poster was a mess.' }),
    choice('delegate', 'Split it fairly and chase everyone', 'safe', [st('smarts', 1), st('karma', 1), st('energy', -1)]),
  ], { tags: ['school'] }),
  ev('tn.school.exam-stress', 'Exam Season', 'The library is full. Your head is fuller. The timetable on your wall is a wall of red.', 15, 18, 4, [
    choice('allnighter', 'Pull an all-nighter before the big paper', 'gamble', [], { p: 0.5, win: [st('smarts', 3), st('happiness', 2)], lose: [st('smarts', 1), st('health', -3), st('happiness', -3)], winText: 'Caffeine, cold toast and a good grade.', loseText: 'You fell asleep in the exam hall.' }),
    choice('steady', 'Stick to a calm, steady revision plan', 'safe', [st('smarts', 3), st('energy', -2)]),
    choice('breaks', 'Take real breaks and trust yourself', 'safe', [st('smarts', 1), st('happiness', 3), st('health', 1)]),
  ], { tags: ['school'], requiresTraits: ['anxious', 'perfectionist', 'ambitious', 'prodigy'], cooldown: 2 }),
  ev('tn.school.mentor', 'The Teacher Who Believed', 'One teacher has been watching you quietly all year. They stop you after class with a book and a challenge.', 14, 18, 3, [
    choice('accept', 'Take on the challenge', 'safe', [st('smarts', 4), st('energy', -2), st('happiness', 2)]),
    choice('thanks', 'Thank them and tuck the book away', 'safe', [st('happiness', 1), st('smarts', 1)]),
    choice('ask', 'Ask what they see in you', 'safe', [st('smarts', 2), st('happiness', 3), st('karma', 1)]),
  ], { tags: ['school'], once: true }),
  ev('tn.school.detention', 'Detention', 'You wore the wrong tie on purpose, or talked back, or both. Now there is a hall, a clock and a teacher with a crossword.', 13, 17, 3, [
    choice('dream', 'Doodle and daydream for an hour', 'safe', [st('happiness', 1), st('smarts', -1)]),
    choice('petition', 'Start a petition against the dress code', 'gamble', [], { p: 0.4, win: [st('happiness', 5), st('karma', 1), log('✊', 'Your petition changed the school rules.')], lose: [st('happiness', -2), st('karma', -2)], winText: 'Two hundred signatures. The rule was withdrawn.', loseText: 'The head teacher tore it up. More detention.' }),
    choice('apologise', 'Apologise sincerely and keep out of trouble', 'safe', [st('karma', 2), st('smarts', 1)]),
  ], { tags: ['school', 'mischief'], requiresTraits: ['rebel', 'reckless', 'prankster', 'flaky'] }),
  ev('tn.school.fail', 'The Red Pen', 'You open the envelope. There is a lot of red, and one grade you did not expect.', 15, 18, 3, [
    choice('hide', 'Hide the result from your family', 'risky', [st('happiness', -3), st('karma', -2), flag('tn_failed_exam')]),
    choice('tell', 'Show your parents straight away', 'safe', [st('happiness', -2), st('karma', 2), flag('tn_failed_exam')]),
    choice('shrug', 'Shrug it off; it is only a paper', 'safe', [st('happiness', 1), st('smarts', -1), flag('tn_failed_exam')]),
  ], { tags: ['school'], maxStat: { smarts: 50 }, once: true }),
  ev('tn.school.retake', 'Second Chance', 'The retake is in six weeks. Your friends are already moving on.', 16, 19, 3, [
    choice('grind', 'Treat it like a full-time job', 'gamble', [], { p: 0.7, win: [st('smarts', 4), st('happiness', 5), log('📈', 'You turned a failure into a pass.')], lose: [st('smarts', 1), st('happiness', -3)], winText: 'You passed comfortably. The red pen retreated.', loseText: 'Still short. At least you tried.' }),
    choice('tutor', 'Pay for a few tutoring sessions', 'safe', [money(-100), st('smarts', 3)]),
    choice('skip', 'Give it up and move on', 'safe', [st('happiness', 1), st('smarts', -1)]),
  ], { tags: ['school'], requiresFlags: ['tn_failed_exam'], once: true }),
  ev('tn.school.science-fair', 'The Science Fair', 'A gym full of tri-fold boards, baking-soda volcanoes and nervous judges.', 13, 17, 3, [
    choice('rocket', 'Build a working water rocket', 'gamble', [], { p: 0.5, win: [st('smarts', 3), st('happiness', 5), log('🚀', 'Your water rocket won the science fair.')], lose: [st('smarts', 1), st('happiness', -2)], winText: 'It flew thirty metres. The judges cheered.', loseText: 'It fizzled on the pad. Judges were kind.' }),
    choice('data', 'Present a careful survey with graphs', 'safe', [st('smarts', 3), st('happiness', 1)]),
    choice('helper', 'Help a friend whose project fell apart', 'safe', [st('karma', 3), st('happiness', 2), st('smarts', 1)]),
  ], { tags: ['school', 'tech'], requiresTraits: ['curious', 'logical', 'tech-savvy', 'prodigy', 'bookworm'] }),
  ev('tn.school.debate', 'The Debate', 'Your team needs a closer. The motion is that homework should be abolished.', 14, 18, 3, [
    choice('fire', 'Close with a fiery speech', 'gamble', [], { p: 0.55, win: [st('smarts', 2), st('happiness', 4), st('looks', 1)], lose: [st('happiness', -3)], winText: 'The room erupted. Trophy secured.', loseText: 'You lost your place and finished with a cough.' }),
    choice('facts', 'Rely on well-rehearsed statistics', 'safe', [st('smarts', 3)]),
    choice('pass', 'Hand the finale to a teammate', 'safe', [st('karma', 1), st('happiness', -1)]),
  ], { tags: ['school', 'fame'], requiresTraits: ['charming', 'ambitious', 'logical', 'life-of-party'] }),
  ev('tn.school.guilt', 'The Peek', 'You still think about the time you copied. Today, a friend asks how you did so well.', 14, 19, 3, [
    choice('confess', 'Tell them the truth', 'safe', [st('karma', 4), st('happiness', 1), st('smarts', 1)]),
    choice('lie', 'Say it was all hard work', 'safe', [st('karma', -2), st('happiness', -1)]),
    choice('deflect', 'Change the subject quickly', 'safe', [st('happiness', -1)]),
  ], { tags: ['school', 'crime'], requiresFlags: ['cheated'], once: true }),
  ev('tn.school.prom', 'The Big Dance', 'There is a dance. There are posters. Everyone is suddenly deeply interested in what everyone else is wearing.', 16, 18, 3, [
    choice('ask', 'Ask someone special to go with you', 'gamble', [money(-40)], { p: 0.55, win: [st('happiness', 6), st('looks', 1), log('💃', 'You had an unforgettable night at the school dance.')], lose: [st('happiness', -4)], winText: 'They said yes. It was a perfect evening.', loseText: 'They already had a date. You went with friends and pretended it was fine.' }),
    choice('group', 'Go with a gang of friends', 'safe', [money(-30), st('happiness', 4), st('energy', -2)]),
    choice('skip', 'Skip it and watch films instead', 'safe', [st('happiness', 1), st('smarts', 1)]),
  ], { tags: ['school', 'friends', 'love'], once: true }),
  ev('tn.school.graduation', 'Graduation Night', 'The caps fly. The gown itches. Somewhere a speech is dragging on.', 17, 19, 4, [
    choice('cry', 'Hug everyone and cry openly', 'safe', [st('happiness', 4), st('karma', 2)]),
    choice('party', 'Party until dawn', 'gamble', [], { p: 0.75, win: [st('happiness', 6), log('🎓', 'You graduated and partied until sunrise.')], lose: [st('happiness', -1), st('health', -2), money(-60)], winText: 'The best night of your teenage years.', loseText: 'A little too wild. The morning after was brutal.' }),
    choice('quiet', 'Slip out early and walk home alone', 'safe', [st('smarts', 1), st('happiness', 1)]),
  ], { tags: ['school', 'friends'], once: true }),
  ev('tn.school.next-chapter', 'What Comes Next?', 'Everybody keeps asking what you will do after school. You have no idea.', 17, 19, 4, [
    choice('gap', 'Take a year out to work and think', 'safe', [st('happiness', 3), st('smarts', 1), money(200)]),
    choice('trade', 'Look at apprenticeships and trades', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('wander', 'Save up and go see the world', 'safe', [st('happiness', 3), money(-100), st('karma', 1)]),
    choice('drift', 'Drift and see what happens', 'risky', [st('happiness', 1), st('smarts', -1)]),
  ], { tags: ['school', 'work', 'travel'], once: true }),

  // ---------------- Love and heartbreak ----------------
  ev('tn.love.crush', 'The Crush', 'One person in the room gives you a lurch in the chest every time. Your friends have noticed. Everyone has noticed.', 13, 16, 3, [
    choice('hint', 'Drop hints so subtle nobody notices', 'safe', [st('happiness', 1), flag('tn_crush')]),
    choice('friend', 'Become their friend first', 'safe', [st('happiness', 2), st('karma', 1), flag('tn_crush')]),
    choice('brave', 'Confess everything on the walk home', 'gamble', [flag('tn_crush')], { p: 0.45, win: [st('happiness', 6)], lose: [st('happiness', -5)], winText: 'They blushed and said they felt the same.', loseText: 'They said they only saw you as a friend. Ouch.' }),
  ], { tags: ['love'], once: true }),
  ev('tn.love.first-date', 'First Date', 'The cinema, the park, the smell of cheap chips. Neither of you knows what to say.', 14, 18, 3, [
    choice('cinema', 'Hold hands in the dark at the cinema', 'safe', [st('happiness', 5), st('looks', 1), money(-25), flag('tn_dating')]),
    choice('walk', 'Walk around the park, talking for hours', 'safe', [st('happiness', 4), st('smarts', 1), flag('tn_dating')]),
    choice('awkward', 'Spill a drink on yourself and laugh it off', 'safe', [st('happiness', 3), st('looks', -1), flag('tn_dating')]),
  ], { tags: ['love'], requiresFlags: ['tn_crush'], forbidsFlags: ['tn_dating'], once: true }),
  ev('tn.love.jealousy', 'The Green Monster', 'Your partner has been laughing at someone else’s jokes. Your stomach tightens.', 15, 19, 3, [
    choice('ask', 'Ask them calmly about it', 'safe', [st('happiness', 2), st('karma', 1)]),
    choice('snoop', 'Check their messages when they leave the room', 'risky', [st('karma', -3), st('happiness', -2)]),
    choice('ignore', 'Pretend you did not notice', 'safe', [st('happiness', -2)]),
  ], { tags: ['love'], requiresFlags: ['tn_dating'] }),
  ev('tn.love.breakup', 'It Ends', 'It happens in a car park, in a few kind sentences. Neither of you is entirely at fault.', 15, 19, 4, [
    choice('cry', 'Walk home and cry the whole way', 'safe', [st('happiness', -6), st('health', -1), flag('tn_heartbroken')]),
    choice('stoic', 'Say "fine" and hold it all in', 'risky', [st('happiness', -4), st('karma', -1), flag('tn_heartbroken')]),
    choice('friends', 'Call your friends for emergency ice cream', 'safe', [st('happiness', -3), st('karma', 1), flag('tn_heartbroken')]),
  ], { tags: ['love', 'grief'], requiresFlags: ['tn_dating'], once: true, sensitive: true }),
  ev('tn.love.after', 'The Long Playlist', 'Every sad song on the radio is clearly about you. The house is quiet, apart from the speakers.', 15, 19, 3, [
    choice('mixtape', 'Make a mixtape and never send it', 'safe', [st('happiness', 1), st('smarts', 1), log('🎧', 'You made the saddest mixtape in history.')]),
    choice('write', 'Write your feelings into a diary', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('move', 'Go for a punishing run', 'safe', [st('health', 2), st('happiness', 1), st('energy', -2)]),
    choice('text', 'Text them at midnight', 'gamble', [], { p: 0.3, win: [st('happiness', 4)], lose: [st('happiness', -5), st('karma', -1)], winText: 'They wrote back kindly. A little closure.', loseText: 'No reply. A very long night.' }),
  ], { tags: ['love', 'creativity'], requiresFlags: ['tn_heartbroken'], once: true, sensitive: true }),
  ev('tn.love.unrequited', 'Poems for Nobody', 'You keep filling notebooks with someone who does not know how you feel.', 14, 18, 2, [
    choice('letter', 'Send an anonymous letter', 'gamble', [], { p: 0.4, win: [st('happiness', 5)], lose: [st('happiness', -4), st('karma', -1)], winText: 'They guessed it was you, and they smiled.', loseText: 'It was read aloud at lunch. Humiliating.' }),
    choice('hold', 'Keep it your secret', 'safe', [st('happiness', -1), st('smarts', 1)]),
    choice('move', 'Make yourself move on', 'safe', [st('happiness', 1), st('karma', 1)]),
  ], { tags: ['love', 'creativity'], requiresTraits: ['romantic', 'shy', 'daydreamer'] }),
  ev('tn.identity.who-am-i', 'Who Are You, Really?', 'You catch yourself in the mirror and wonder who is looking back. Something inside you is shifting.', 14, 18, 3, [
    choice('journal', 'Write it out in private', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('friend', 'Confide in someone you trust', 'safe', [st('happiness', 3), st('karma', 1)]),
    choice('family', 'Tell your family at the dinner table', 'gamble', [], { p: 0.7, win: [st('happiness', 6), st('karma', 1), log('🌈', 'You shared something true about yourself, and were loved for it.')], lose: [st('happiness', -4), st('health', -1)], winText: 'They hugged you, said they knew, and loved you more.', loseText: 'A hard conversation. It will take time.' }),
  ], { tags: ['family', 'friends'], once: true, sensitive: true }),

  // ---------------- Friends ----------------
  ev('tn.friends.fight', 'The Falling Out', 'You and your closest friend said things in the corridor that cannot be unsaid. Or can they?', 14, 18, 3, [
    choice('storm', 'Storm off and ignore them for weeks', 'safe', [st('happiness', -4), st('karma', -1), flag('tn_friend_fight')]),
    choice('sorry', 'Apologise right away', 'safe', [st('happiness', 1), st('karma', 2), flag('tn_friend_fight')]),
    choice('pride', 'Wait for them to apologise first', 'risky', [st('happiness', -2), flag('tn_friend_fight')]),
  ], { tags: ['friends'], once: true }),
  ev('tn.friends.reconcile', 'The Message', 'You are rummaging in your phone when you find your old friend’s name. It has been a long time.', 15, 19, 3, [
    choice('reach', 'Send a message first', 'gamble', [], { p: 0.7, win: [st('happiness', 5), st('karma', 3), { type: 'addTrait', trait: { id: 'wise', label: 'Wise', icon: '🦉', temperament: 'gentle' } }], lose: [st('happiness', -2)], winText: 'They replied in under a minute. Old jokes returned.', loseText: 'They left you on read.' }),
    choice('wait', 'Hope you bump into each other', 'safe', [st('happiness', -1)]),
    choice('letter', 'Write a long handwritten letter', 'safe', [st('karma', 3), st('smarts', 1), st('happiness', 2)]),
  ], { tags: ['friends'], requiresFlags: ['tn_friend_fight'], once: true }),
  ev('tn.friends.group-chat', 'The Group Chat', 'Forty-seven unread messages and a screenshot that shouldn’t exist.', 13, 19, 3, [
    choice('mute', 'Mute it and live peacefully', 'safe', [st('happiness', 1), st('energy', 1)]),
    choice('defend', 'Defend the person being talked about', 'risky', [st('karma', 3), st('happiness', -1)]),
    choice('join', 'Pile on with a joke', 'risky', [st('happiness', 2), st('karma', -3)]),
  ], { tags: ['friends', 'tech'], cooldown: 4 }),
  ev('tn.friends.mixtape', 'The Mixtape', 'A friend presses a handmade playlist into your hand. The track list is handwritten on a scrap.', 13, 17, 3, [
    choice('love', 'Play it on repeat for a week', 'safe', [st('happiness', 4), st('smarts', 1)]),
    choice('return', 'Make one back, a better one', 'safe', [st('happiness', 3), st('smarts', 1), st('energy', -1)]),
    choice('tease', 'Tease them about the taste', 'safe', [st('happiness', 1), st('karma', -1)]),
  ], { tags: ['friends', 'creativity'] }),
  ev('tn.friends.gossip', 'The Rumour', 'Something false is going around about a girl or boy in your year. It has your name on it, as the source.', 13, 17, 3, [
    choice('deny', 'Deny it loudly in front of everyone', 'safe', [st('karma', 2), st('happiness', -1)]),
    choice('apologise', 'Find the victim and say sorry', 'safe', [st('karma', 3), st('happiness', 1)]),
    choice('ride', 'Let the rumour ride', 'risky', [st('karma', -4), st('happiness', -2)]),
  ], { tags: ['friends', 'school'], requiresTraits: ['empath', 'kind', 'loyal', 'charming'] }),
  ev('tn.friends.house-party', 'House Party', 'The invite said "just a few people". The invite lied.', 15, 19, 3, [
    choice('dj', 'Take over the playlist and dance until dawn', 'safe', [st('happiness', 5), st('energy', -3)]),
    choice('tidy', 'Be the one who cleans up at midnight', 'safe', [st('karma', 3), st('happiness', 1), st('energy', -2)]),
    choice('chaos', 'Join the chaos in the garden', 'gamble', [], { p: 0.6, win: [st('happiness', 6)], lose: [st('happiness', -3), st('health', -2), money(-50)], winText: 'The best night of the year.', loseText: 'Somebody broke something expensive, and you took the blame.' }),
  ], { tags: ['friends'], requiresTraits: ['life-of-party', 'charming', 'daredevil', 'reckless'] }),
  ev('tn.friends.cover', 'Cover for Me', 'A friend begs you to tell their parents they were at your house last night. They were not.', 14, 18, 3, [
    choice('cover', 'Lie to protect them', 'gamble', [], { p: 0.6, win: [st('karma', -1), st('happiness', 3)], lose: [st('karma', -3), st('happiness', -4)], winText: 'Nobody checked. They owe you one.', loseText: 'Their parents called yours. A disaster.' }),
    choice('refuse', 'Refuse and tell them to be honest', 'safe', [st('karma', 3), st('happiness', -2)]),
    choice('advice', 'Cover once, then give them a talking-to', 'safe', [st('karma', 1), st('happiness', 1)]),
  ], { tags: ['friends', 'family'], requiresTraits: ['loyal', 'kind', 'empath'] }),

  // ---------------- Work and money ----------------
  ev('tn.work.cafe', 'Weekend Shifts', 'The corner café needs help on Saturdays. The apron is stained. The coffee smells wonderful.', 14, 17, 3, [
    choice('apply', 'Take the job', 'safe', [money(250), st('smarts', 1), st('energy', -3), flag('worked_teen')]),
    choice('tips', 'Charm the regulars for tips', 'gamble', [flag('worked_teen')], { p: 0.55, win: [money(450), st('happiness', 3)], lose: [money(150), st('energy', -3)], winText: 'The tip jar overflowed. A lucrative summer.', loseText: 'Quiet weeks. Not much made.' }),
    choice('skip', 'Keep your weekends free', 'safe', [st('happiness', 3)]),
  ], { tags: ['work', 'money'], forbidsFlags: ['worked_teen'] }),
  ev('tn.work.boss', 'The Bad Boss', 'Your manager shouts at you, again, in front of customers. The till is jammed.', 15, 19, 3, [
    choice('quit', 'Take off your apron and leave', 'safe', [st('happiness', 3), money(-100), st('karma', -1)]),
    choice('endure', 'Grit your teeth and keep going', 'safe', [money(200), st('happiness', -3), st('energy', -2)]),
    choice('speak', 'Politely demand a bit of respect', 'gamble', [], { p: 0.5, win: [money(200), st('happiness', 3), st('smarts', 1)], lose: [st('happiness', -3), money(-100)], winText: 'Your manager backed down, and gave you a raise.', loseText: 'They cut your shifts. Painful.' }),
  ], { tags: ['work'], requiresFlags: ['worked_teen'] }),
  ev('tn.work.first-wage', 'Payday', 'The first real wages. They look smaller than you imagined, and also incredible.', 15, 19, 3, [
    choice('spend', 'Spend it on trainers and snacks', 'safe', [money(-120), st('happiness', 4), st('looks', 1)]),
    choice('save', 'Stash it in a savings account', 'safe', [money(100), st('smarts', 1)]),
    choice('family', 'Give some to your family', 'safe', [money(-60), st('karma', 3), st('happiness', 2)]),
  ], { tags: ['money', 'work'], requiresFlags: ['worked_teen'], cooldown: 3 }),
  ev('tn.work.tips', 'Regulars', 'An old regular leaves a big tip and a note: "You make mornings better."', 15, 19, 2, [
    choice('keep', 'Keep it', 'safe', [money(40), st('happiness', 3)]),
    choice('pool', 'Share it with the team', 'safe', [st('karma', 3), st('happiness', 2)]),
    choice('write', 'Write them a thank-you card', 'safe', [st('karma', 2), st('happiness', 3)]),
  ], { tags: ['work', 'money'], requiresFlags: ['worked_teen'], requiresTraits: ['charming', 'kind', 'empath'] }),
  ev('tn.work.hustle', 'The Side Hustle', 'You notice you can buy things cheaply from one place and sell them for more somewhere else.', 14, 19, 2, [
    choice('flip', 'Flip bargain finds online and at school', 'gamble', [], { p: 0.6, win: [money(200), st('smarts', 2)], lose: [money(-80), st('happiness', -2)], winText: 'Small profits stack up quickly.', loseText: 'Stuck with a box of unsellable gadgets.' }),
    choice('sell', 'Sell your old games and gear', 'safe', [money(60), st('happiness', 1)]),
    choice('pass', 'Not worth the hassle', 'safe', [st('happiness', 1)]),
  ], { tags: ['money', 'work'], requiresTraits: ['selfish', 'ambitious', 'logical', 'tech-savvy'] }),
  ev('tn.work.babysit', 'Babysitter Wanted', 'The neighbours need someone for Saturday night. Two kids and a laminated list of rules.', 13, 17, 3, [
    choice('accept', 'Accept and be wonderful', 'safe', [money(60), st('karma', 2), st('energy', -2)]),
    choice('movies', 'Let the kids stay up for a movie marathon', 'gamble', [], { p: 0.65, win: [money(90), st('happiness', 4)], lose: [money(30), st('karma', -2), st('happiness', -2)], winText: 'The kids adored you, and the neighbours tipped you well.', loseText: 'They found the popcorn mess. You were not asked back.' }),
    choice('refuse', 'Pass on the offer', 'safe', [st('happiness', 1)]),
  ], { tags: ['work', 'family', 'money'], requiresTraits: ['kind', 'empath', 'loyal'] }),
  ev('tn.money.struggle', 'Hand-me-Downs', 'Everyone else has new trainers. You are wearing your cousin’s old ones with a bit of tape.', 13, 18, 3, [
    choice('proud', 'Wear them proudly and own it', 'safe', [st('karma', 2), st('happiness', 1), st('smarts', 1)]),
    choice('work', 'Take on odd jobs to buy your own pair', 'safe', [money(60), st('energy', -3), st('happiness', 2)]),
    choice('hide', 'Hide your feet under the table', 'safe', [st('happiness', -3)]),
  ], { tags: ['money', 'school'], requiresFlags: ['family_struggling'], sensitive: true, cooldown: 4 }),
  ev('tn.money.privilege', 'The Open Wallet', 'Your parents will happily pay for the trip, the concert and the new gadget. Everyone around you knows it.', 14, 19, 3, [
    choice('take', 'Take it all without a thought', 'safe', [st('happiness', 3), st('karma', -2), money(-100)]),
    choice('earn', 'Insist on earning your own money', 'safe', [money(100), st('karma', 2), st('smarts', 1), st('energy', -2)]),
    choice('share', 'Treat your friends, too', 'safe', [money(-80), st('karma', 3), st('happiness', 2)]),
  ], { tags: ['money', 'family'], requiresFlags: ['family_wealthy'], cooldown: 5 }),

  // ---------------- Sports ----------------
  ev('tn.sports.tryouts', 'Team Tryouts', 'The coach holds a clipboard and a whistle. There are two places left.', 13, 17, 3, [
    choice('allin', 'Throw yourself into every drill', 'gamble', [], { p: 0.6, win: [st('health', 3), st('happiness', 5), st('looks', 1), log('🏀', 'You made the school team.')], lose: [st('happiness', -3), st('health', -1)], winText: 'Your name was on the list the next morning.', loseText: 'You missed out by a hair.' }),
    choice('manager', 'Offer to help as team manager instead', 'safe', [st('smarts', 1), st('karma', 1), st('happiness', 1)]),
    choice('skip', 'Skip it; sport is not for you', 'safe', [st('happiness', 1)]),
  ], { tags: ['sports', 'school'], requiresTraits: ['athletic', 'daredevil', 'tough', 'ambitious'], once: true }),
  ev('tn.sports.sprain', 'The Wrong Landing', 'A sharp twist, a pop, and then a strange silence on the pitch.', 14, 18, 3, [
    choice('walk', 'Play on through the pain', 'gamble', [], { p: 0.5, win: [st('happiness', 3), st('karma', 1)], lose: [st('health', -6), cond({ id: 'torn-ligament', name: 'Torn Ligament', icon: '🦵', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], winText: 'Adrenaline carried you through. Just a sprain.', loseText: 'Torn ligament. A long recovery ahead.' }),
    choice('subs', 'Get substituted and ice it', 'safe', [st('health', -1), st('happiness', -1)]),
    choice('doctor', 'See the physio straight away', 'safe', [money(-60), st('health', 1)]),
  ], { tags: ['sports', 'health'], requiresTraits: ['athletic', 'daredevil', 'reckless', 'tough'] }),
  ev('tn.sports.captain', 'Captain Material', 'Your coach is choosing a captain. You are on the shortlist.', 16, 18, 2, [
    choice('lead', 'Lead by example, training every morning', 'safe', [st('health', 2), st('smarts', 1), st('energy', -3), st('happiness', 3)]),
    choice('speech', 'Give the team a rousing speech', 'gamble', [], { p: 0.55, win: [st('happiness', 5), st('karma', 1), log('🏅', 'You were named captain of the team.')], lose: [st('happiness', -2)], winText: 'Chosen by a landslide.', loseText: 'Passed over for a friend. It stung.' }),
    choice('decline', 'Say you would rather play than lead', 'safe', [st('happiness', 2)]),
  ], { tags: ['sports'], requiresTraits: ['athletic', 'ambitious', 'charming', 'loyal'], once: true }),

  // ---------------- Creative ----------------
  ev('tn.creative.band', 'The Bedroom Band', 'You and three friends start noisily making music in someone’s bedroom. The neighbours knock.', 14, 18, 3, [
    choice('commit', 'Practise every day after school', 'safe', [st('happiness', 3), st('smarts', 1), st('energy', -2), flag('tn_band')]),
    choice('name', 'Spend three weeks arguing about the name', 'safe', [st('happiness', 2), flag('tn_band')]),
    choice('quit', 'Walk away after the first argument', 'safe', [st('happiness', -1)]),
  ], { tags: ['creativity', 'friends'], requiresTraits: ['creative', 'daydreamer', 'charming', 'rebel'], forbidsFlags: ['tn_band'], once: true }),
  ev('tn.creative.gig', 'The First Gig', 'The village hall has a free slot on Friday night. Your band has four songs and one fully tuned guitar.', 15, 19, 3, [
    choice('play', 'Play your hearts out', 'gamble', [], { p: 0.5, win: [st('happiness', 6), money(80), log('🎸', 'Your band played its first real gig, and the crowd stayed.')], lose: [st('happiness', -2)], winText: 'The crowd roared for an encore.', loseText: 'The amp died on the second song. Cheers for effort.' }),
    choice('covers', 'Play it safe with covers', 'safe', [st('happiness', 3), money(40)]),
    choice('cancel', 'Cancel at the last minute', 'safe', [st('happiness', -3), st('karma', -1)]),
  ], { tags: ['creativity', 'fame'], requiresFlags: ['tn_band'], once: true }),
  ev('tn.creative.novel', 'The Notebook Novel', 'A story has been bubbling in the margins of your schoolbooks for weeks. It wants to be a book.', 13, 19, 3, [
    choice('write', 'Write a chapter every night', 'safe', [st('smarts', 2), st('happiness', 2), st('energy', -2), flag('tn_writing')]),
    choice('share', 'Show it to a friend', 'safe', [st('happiness', 3), st('karma', 1), flag('tn_writing')]),
    choice('burn', 'Throw it away; it is not good enough', 'safe', [st('happiness', -3), st('smarts', 1)]),
  ], { tags: ['creativity', 'school'], requiresTraits: ['bookworm', 'creative', 'daydreamer', 'curious'], forbidsFlags: ['tn_writing'], once: true }),
  ev('tn.creative.contest', 'The Writing Contest', 'A local competition is accepting short stories. The deadline is tonight.', 15, 19, 3, [
    choice('send', 'Send it in, flaws and all', 'gamble', [], { p: 0.35, win: [money(150), st('happiness', 7), st('smarts', 2), log('✍️', 'Your story won a local writing contest.')], lose: [st('happiness', -2), st('smarts', 1)], winText: 'Third place, a certificate and a cheque.', loseText: 'A polite rejection. You framed it anyway.' }),
    choice('polish', 'Spend another month polishing', 'safe', [st('smarts', 2), st('energy', -2)]),
    choice('hide', 'Keep it a private treasure', 'safe', [st('happiness', 1)]),
  ], { tags: ['creativity', 'fame'], requiresFlags: ['tn_writing'], once: true }),
  ev('tn.creative.film', 'The Short Film', 'A borrowed camera, three friends and a plot that makes sense only to you.', 14, 19, 2, [
    choice('shoot', 'Shoot it over a single chaotic weekend', 'gamble', [], { p: 0.5, win: [st('happiness', 6), st('smarts', 2), log('🎬', 'Your short film was shown at the school hall.')], lose: [st('happiness', -2), st('energy', -3)], winText: 'The screening got a standing ovation.', loseText: 'The footage was corrupted. Back to the drawing board.' }),
    choice('storyboard', 'Draw storyboards and plan everything', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('skip', 'Leave it as a daydream', 'safe', [st('happiness', 1)]),
  ], { tags: ['creativity', 'tech', 'friends'], requiresTraits: ['creative', 'tech-savvy', 'daydreamer'] }),
  ev('tn.tech.code', 'The Back Door', 'You discover a flaw in the school’s computer system. Teachers seem not to know, or care.', 13, 18, 2, [
    choice('report', 'Report it to the IT teacher', 'safe', [st('karma', 3), st('smarts', 2), st('happiness', 1)]),
    choice('change', 'Change your own grades; just a little', 'gamble', [], { p: 0.4, win: [st('smarts', 1), st('karma', -4), flag('cheated')], lose: [st('karma', -6), st('happiness', -5)], winText: 'Nobody noticed. Your conscience did.', loseText: 'The logs showed everything. Suspension.' }),
    choice('build', 'Use the knowledge to build something useful', 'safe', [st('smarts', 3), st('happiness', 2), log('💻', 'You built a tool that made your school life easier.')]),
  ], { tags: ['tech', 'school', 'crime'], requiresTraits: ['tech-savvy', 'logical', 'curious', 'rebel'] }),

  // ---------------- Family ----------------
  ev('tn.family.curfew', 'The Curfew', 'Your parents have set a curfew. Everyone else’s are later. Yours are suspiciously strict.', 13, 17, 3, [
    choice('obey', 'Obey it and take the moral high ground', 'safe', [st('karma', 2), st('happiness', -1)]),
    choice('window', 'Sneak back in through the window', 'gamble', [], { p: 0.55, win: [st('happiness', 3), st('karma', -1)], lose: [st('happiness', -4), st('karma', -2)], winText: 'Nobody noticed. Heart pounding.', loseText: 'Your dad was waiting in the kitchen, arms folded.' }),
    choice('negotiate', 'Make a serious case for an extra hour', 'safe', [st('smarts', 1), st('happiness', 1)]),
  ], { tags: ['family', 'mischief'], cooldown: 4 }),
  ev('tn.family.argument', 'The Blazing Row', 'It starts with a dirty plate and ends with doors slamming. You both say things.', 14, 18, 3, [
    choice('apologise', 'Knock on the door and apologise', 'safe', [st('happiness', 1), st('karma', 3)]),
    choice('escape', 'Go for a long walk until you cool off', 'safe', [st('health', 1), st('happiness', -1)]),
    choice('sulk', 'Refuse to speak for a week', 'risky', [st('happiness', -4), st('karma', -2)]),
  ], { tags: ['family'], cooldown: 3 }),
  ev('tn.family.split', 'The Kitchen Table Talk', 'Your parents ask you to sit down. They say they will be living apart. They say it is not your fault.', 13, 18, 3, [
    choice('listen', 'Listen quietly and ask questions', 'safe', [st('happiness', -5), st('karma', 1), st('smarts', 1)]),
    choice('rage', 'Storm out; you are furious', 'risky', [st('happiness', -6), st('karma', -1)]),
    choice('friend', 'Lean on your closest friend', 'safe', [st('happiness', -3), st('karma', 1)]),
    choice('support', 'Take care of a younger sibling', 'safe', [st('happiness', -3), st('karma', 4), st('energy', -2)]),
  ], { tags: ['family', 'grief'], sensitive: true, once: true }),
  ev('tn.family.sibling', 'The Little One Needs You', 'Your younger brother or sister is having a tough time at school. They have come to you, of all people.', 14, 19, 3, [
    choice('help', 'Sit with them and help with homework', 'safe', [st('karma', 3), st('happiness', 2), st('energy', -2)]),
    choice('fight', 'Go to the school and confront the bully', 'gamble', [], { p: 0.5, win: [st('karma', 2), st('happiness', 4)], lose: [st('karma', -2), st('happiness', -3)], winText: 'The bully backed off, and your sibling beamed.', loseText: 'It made things worse. Both of you were in trouble.' }),
    choice('talk', 'Take them for ice cream and let them talk', 'safe', [st('karma', 2), st('happiness', 3), money(-10)]),
  ], { tags: ['family'], requiresFlags: ['ch_sibling'], once: true }),

  // ---------------- Risk ----------------
  ev('tn.risk.cigarette', 'Behind the Gym', 'A friend flicks open a packet. Everyone else is sharing. You can feel the eyes on you.', 13, 17, 3, [
    choice('try', 'Take a drag, because everyone else is', 'risky', [st('health', -2), st('happiness', 1), flag('smoker')]),
    choice('refuse', 'Say no and stay anyway', 'safe', [st('karma', 2), st('health', 1)]),
    choice('leave', 'Make an excuse and head home', 'safe', [st('happiness', -1), st('health', 1)]),
  ], { tags: ['friends', 'health'], forbidsFlags: ['smoker'], cooldown: 4 }),
  ev('tn.risk.quit', 'The Habit', 'Climbing the stairs leaves you out of breath. Your clothes smell of smoke. A voice says, maybe you should stop.', 15, 19, 3, [
    choice('quit', 'Throw the packet in the bin', 'gamble', [], { p: 0.55, win: [st('health', 4), st('happiness', 2), st('karma', 1)], lose: [st('happiness', -3), st('health', -1)], winText: 'Hard weeks, but you did it.', loseText: 'The cravings won. You went back.' }),
    choice('cut', 'Try to cut down slowly', 'safe', [st('health', 1), st('happiness', -1)]),
    choice('ignore', 'Pretend you did not hear it', 'risky', [st('health', -2)]),
  ], { tags: ['health'], requiresFlags: ['smoker'], cooldown: 4 }),
  ev('tn.risk.first-drink', 'The First Drink', 'Somebody’s older cousin has brought a bag of bottles to the party. Everybody is giddy.', 15, 19, 3, [
    choice('sip', 'Take a drink and see what the fuss is about', 'gamble', [flag('drinker')], { p: 0.6, win: [st('happiness', 3), st('looks', 0)], lose: [st('health', -4), st('happiness', -3), st('karma', -1)], winText: 'A pleasant, giggly night.', loseText: 'You were sick before midnight. Never again, you swear.' }),
    choice('soft', 'Stick to lemonade', 'safe', [st('health', 1), st('karma', 1)]),
    choice('drive', 'Be the sober friend who looks after everyone', 'safe', [st('karma', 3), st('energy', -2), st('happiness', 1)]),
  ], { tags: ['friends', 'health'], forbidsFlags: ['drinker'], cooldown: 4 }),
  ev('tn.risk.hangover', 'The Morning After', 'The ceiling is spinning. Your mouth tastes of regret. Your parents have questions.', 16, 19, 3, [
    choice('confess', 'Tell the truth to your parents', 'safe', [st('karma', 3), st('happiness', -2), st('health', -1)]),
    choice('lie', 'Claim it was food poisoning', 'gamble', [], { p: 0.5, win: [st('happiness', 1), st('karma', -1)], lose: [st('happiness', -4), st('karma', -3)], winText: 'They believed you. Mostly.', loseText: 'They found the bottle in your bag.' }),
    choice('promise', 'Promise yourself never to do that again', 'safe', [st('health', 1), st('smarts', 1)]),
  ], { tags: ['health', 'family'], requiresFlags: ['drinker'], cooldown: 5 }),
  ev('tn.risk.pills', 'Something Offered', 'Someone at a party holds out a small pill. They say it will make everything feel brilliant.', 15, 19, 2, [
    choice('take', 'Take it, just once', 'risky', [st('health', -4), st('happiness', 2), flag('drugs')]),
    choice('no', 'Say no firmly and leave', 'safe', [st('karma', 2), st('health', 1), { type: 'addTrait', trait: { id: 'streetwise', label: 'Streetwise', icon: '🕶️', temperament: 'smug' } }]),
    choice('call', 'Call a trusted adult to pick you up', 'safe', [st('karma', 3), st('happiness', -1)]),
  ], { tags: ['crime', 'friends', 'health'], sensitive: true, forbidsFlags: ['drugs'], cooldown: 6 }),
  ev('tn.risk.intervention', 'The Conversation', 'A friend, then your parents, sit you down. They say they have noticed. They say they are scared.', 16, 19, 3, [
    choice('listen', 'Listen and agree to get help', 'gamble', [], { p: 0.7, win: [st('health', 4), st('happiness', 3), st('karma', 3)], lose: [st('happiness', -3), st('health', -1)], winText: 'It was the hardest and best choice you made.', loseText: 'You tried, but the pull was strong.' }),
    choice('deny', 'Deny everything and storm out', 'risky', [st('health', -3), st('happiness', -4), st('karma', -2)]),
    choice('half', 'Promise to cut down, but do not mean it', 'risky', [st('happiness', -2), st('karma', -1)]),
  ], { tags: ['health', 'family', 'friends'], sensitive: true, requiresFlags: ['drugs'], once: true }),
  ev('tn.risk.shoplift', 'The Easy Target', 'The shop assistant is busy. The gadget is small. Your pocket is big.', 13, 17, 3, [
    choice('swipe', 'Slip it into your coat', 'gamble', [], { p: 0.5, win: [st('happiness', 1), st('karma', -4)], lose: [st('karma', -4), st('happiness', -5), money(-60)], winText: 'You walked out. Your heart pounded for an hour.', loseText: 'A hand on your shoulder. Your parents were called.' }),
    choice('walk', 'Put it back and walk out', 'safe', [st('karma', 2)]),
    choice('pay', 'Save up and buy it fairly', 'safe', [money(-40), st('happiness', 2), st('karma', 1)]),
  ], { tags: ['crime', 'mischief'], requiresTraits: ['rebel', 'reckless', 'selfish', 'flaky'] }),
  ev('tn.risk.cliff', 'The Dare', 'A high rock above a quarry lake. Your friends are already counting down.', 13, 18, 3, [
    choice('jump', 'Jump', 'gamble', [], { p: 0.75, win: [st('happiness', 6), st('health', 1), log('🌊', 'You jumped from the rock at the quarry lake.')], lose: [st('health', -7), st('happiness', -2), cond({ id: 'sprained-back', name: 'Back Injury', icon: '🦴', kind: 'injury', severity: 2, chronic: false, diagnosed: true })], winText: 'Cold water, wild whoop, immortal.', loseText: 'You landed flat. A very bad day.' }),
    choice('count', 'Count down for your friends but stay on the ledge', 'safe', [st('karma', 1), st('happiness', 1)]),
    choice('home', 'Head home before anyone jumps', 'safe', [st('happiness', -1), st('health', 1)]),
  ], { tags: ['adventure', 'friends'], requiresTraits: ['daredevil', 'reckless', 'athletic', 'rebel'] }),

  // ---------------- Driving ----------------
  ev('tn.drive.joyride', 'The Fast Road', 'A friend with a borrowed car has an empty road and a very foolish idea.', 17, 19, 3, [
    choice('speed', 'Floor it with your friends cheering', 'gamble', [], { p: 0.65, win: [st('happiness', 5)], lose: [st('health', -6), money(-400), st('karma', -2)], winText: 'Wind, whoops, nobody hurt. This time.', loseText: 'A clipped kerb, a dented car and a very large bill.' }),
    choice('slow', 'Drive carefully and refuse to be rushed', 'safe', [st('karma', 2), st('happiness', 1)]),
    choice('walk', 'Take the bus and let them go', 'safe', [st('health', 1), st('happiness', -1)]),
  ], { tags: ['adventure', 'friends'], requiresFlags: ['can_drive'], cooldown: 4 }),
  ev('tn.drive.first-car', 'The First Car', 'A rusty hatchback for sale. It runs. Mostly.', 17, 19, 3, [
    choice('buy', 'Buy it with your savings', 'gamble', [money(-400)], { p: 0.6, win: [st('happiness', 6), log('🚗', 'You bought your first car.')], lose: [money(-300), st('happiness', -2)], winText: 'It runs like a dream. Freedom!', loseText: 'The gearbox died in the first month.' }),
    choice('borrow', 'Share your parents’ car', 'safe', [st('happiness', 1), st('karma', 1)]),
    choice('bike', 'Stick with your bike', 'safe', [st('health', 2), st('happiness', 1)]),
  ], { tags: ['money', 'adventure'], requiresFlags: ['can_drive'], once: true }),

  // ---------------- Bullying ----------------
  ev('tn.bully.group', 'The Group Who Laughed', 'A little clique has chosen you. They have names for you. They are not nice names.', 13, 17, 3, [
    choice('tell', 'Tell a trusted adult', 'safe', [st('happiness', -1), st('karma', 1), flag('tn_bullied_teen')]),
    choice('endure', 'Endure it quietly', 'risky', [st('happiness', -5), st('health', -1), flag('tn_bullied_teen')]),
    choice('block', 'Block them and spend time elsewhere', 'safe', [st('happiness', -2), st('smarts', 1), flag('tn_bullied_teen')]),
  ], { tags: ['school', 'friends'], sensitive: true, once: true }),
  ev('tn.bully.standup', 'Enough', 'You are tired of keeping quiet. Today, something in you decides to change.', 14, 18, 3, [
    choice('speak', 'Speak up loudly in the dinner hall', 'gamble', [], { p: 0.55, win: [st('happiness', 6), st('karma', 2), log('📣', 'You stood up to the people who bullied you.')], lose: [st('happiness', -3), st('health', -1)], winText: 'A hush fell. Then someone applauded.', loseText: 'It got worse before it got better.' }),
    choice('group', 'Gather others who have been bullied', 'safe', [st('karma', 3), st('happiness', 3), flag('helpful')]),
    choice('train', 'Take up martial arts to build confidence', 'safe', [st('health', 3), st('happiness', 2), money(-60)]),
  ], { tags: ['school'], sensitive: true, requiresFlags: ['tn_bullied_teen'], once: true }),

  // ---------------- Travel, nature, faith, health ----------------
  ev('tn.travel.camp', 'Summer Camp', 'Two weeks in the woods with strangers, bunk beds and terrible singing.', 13, 16, 3, [
    choice('mingle', 'Join in every activity', 'safe', [st('happiness', 5), st('health', 1), st('energy', -2), money(-120)]),
    choice('homesick', 'Spend the first week homesick', 'safe', [st('happiness', -2), st('karma', 1), money(-120)]),
    choice('prank', 'Lead the midnight raid on the other cabin', 'gamble', [money(-120)], { p: 0.55, win: [st('happiness', 6), st('karma', -1)], lose: [st('happiness', -2), st('karma', -2)], winText: 'Legendary. Nobody was caught.', loseText: 'The counsellors caught everyone.' }),
  ], { tags: ['travel', 'friends', 'nature'], once: true }),
  ev('tn.travel.interrail', 'The Big Trip', 'A rail pass, a backpack and three friends who have never been further than the coast.', 17, 19, 3, [
    choice('go', 'Say yes and pack a tiny bag', 'gamble', [money(-350)], { p: 0.75, win: [st('happiness', 7), st('smarts', 2), log('🚆', 'You travelled Europe by train with friends.')], lose: [st('happiness', -3), money(-100)], winText: 'Six countries in a month. You grew up.', loseText: 'You lost your wallet in the first week.' }),
    choice('weekend', 'Do a short weekend version instead', 'safe', [money(-80), st('happiness', 3)]),
    choice('stay', 'Stay and work', 'safe', [money(300), st('smarts', 1), st('happiness', -1)]),
  ], { tags: ['travel', 'adventure', 'friends'], requiresTraits: ['wanderer', 'daredevil', 'charming', 'curious'], once: true }),
  ev('tn.travel.relatives', 'Summer Abroad', 'Your family sends you to stay with relatives in another country for the summer.', 13, 17, 3, [
    choice('embrace', 'Embrace the food and language', 'safe', [st('smarts', 2), st('happiness', 3), st('karma', 1)]),
    choice('sulk', 'Sulk for a month and miss your friends', 'safe', [st('happiness', -3)]),
    choice('explore', 'Explore alone every day', 'gamble', [], { p: 0.7, win: [st('happiness', 5), st('smarts', 2)], lose: [st('happiness', -2), st('health', -2)], winText: 'You found hidden cafes and lifelong friends.', loseText: 'You got lost for hours, and sunburned too.' }),
  ], { tags: ['travel', 'family'], cooldown: 5 }),
  ev('tn.nature.camp-out', 'Under the Stars', 'A backpack, a tent and a sky that looks like spilled sugar.', 15, 19, 2, [
    choice('hike', 'Hike to a distant summit', 'safe', [st('health', 3), st('happiness', 4), st('energy', -3)]),
    choice('stargaze', 'Lie on your back counting shooting stars', 'safe', [st('happiness', 4), st('smarts', 1)]),
    choice('rain', 'Get caught in a thunderstorm', 'gamble', [], { p: 0.5, win: [st('happiness', 4), st('health', 1)], lose: [st('health', -3), st('happiness', -1)], winText: 'Soaked, laughing and unforgettable.', loseText: 'You caught a nasty cold.' }),
  ], { tags: ['nature', 'adventure'], requiresTraits: ['green-thumb', 'wanderer', 'athletic', 'curious'] }),
  ev('tn.faith.doubt', 'The Doubt', 'You sit in the pew, or the circle, or the quiet room, and wonder what you believe.', 14, 18, 2, [
    choice('question', 'Ask the hard questions out loud', 'safe', [st('smarts', 2), st('happiness', 1)]),
    choice('deepen', 'Commit to practice with new eyes', 'safe', [st('karma', 3), st('happiness', 2)]),
    choice('drift', 'Step away for a while', 'safe', [st('happiness', -1), st('smarts', 1)]),
  ], { tags: ['faith'], requiresTraits: ['spiritual', 'curious', 'empath'] }),
  ev('tn.health.mirror', 'The Mirror Problem', 'Spots, braces, a growth spurt and a voice that cracks. Everything you hated about yourself arrives at once.', 13, 16, 3, [
    choice('laugh', 'Laugh about it with friends', 'safe', [st('happiness', 2), st('karma', 1), st('looks', -1)]),
    choice('hide', 'Hide in baggy hoodies', 'safe', [st('happiness', -3), st('looks', -1)]),
    choice('care', 'Build a skincare routine and be patient', 'safe', [st('looks', 3), money(-30), st('happiness', 1)]),
  ], { tags: ['health', 'school'], cooldown: 4 }),
  ev('tn.health.low', 'The Grey Weeks', 'Everything feels heavy, and nobody can say why. Even the music sounds flat.', 15, 19, 3, [
    choice('talk', 'Talk to someone you trust', 'safe', [st('happiness', 3), st('karma', 1), st('health', 1)]),
    choice('counsellor', 'Visit the school counsellor', 'safe', [st('happiness', 4), st('smarts', 1)]),
    choice('hide', 'Keep it hidden and push through', 'risky', [st('happiness', -5), st('health', -2), cond({ id: 'low-mood', name: 'Low Mood', icon: '☁️', kind: 'mental', severity: 1, chronic: false, diagnosed: false })]),
  ], { tags: ['health', 'grief'], sensitive: true, requiresTraits: ['anxious', 'pessimist', 'perfectionist', 'empath', 'shy'], cooldown: 5 }),
  ev('tn.health.sleep', 'Night Owl', 'It is 3am. Your screen glows. Your alarm is in four hours.', 13, 19, 3, [
    choice('sleep', 'Put the screen away and sleep', 'safe', [st('energy', 3), st('health', 1)]),
    choice('one', 'Just one more episode', 'safe', [st('happiness', 2), st('energy', -3)]),
    choice('study', 'Use the quiet hours to learn something new', 'safe', [st('smarts', 2), st('energy', -3)]),
  ], { tags: ['health', 'tech'], requiresTraits: ['lazy', 'daydreamer', 'homebody', 'tech-savvy', 'creative'] }),
];
