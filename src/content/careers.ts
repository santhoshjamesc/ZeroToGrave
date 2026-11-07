import { CareerDef, MajorDef } from '../engine/content';

/** Build a ladder where each rung pays `step`× the last (rounded to $100). */
const ladder = (titles: string[], start: number, step = 1.32): CareerDef['ladder'] =>
  titles.map((title, i) => ({ title, salary: Math.round((start * step ** i) / 100) * 100 }));

export const majors: MajorDef[] = [
  { id: 'medicine', name: 'Medicine', icon: '🩺', minSmarts: 80, yearlyCost: 22000 },
  { id: 'law', name: 'Law', icon: '⚖️', minSmarts: 72, yearlyCost: 18000 },
  { id: 'engineering', name: 'Engineering', icon: '⚙️', minSmarts: 68, yearlyCost: 14000 },
  { id: 'cs', name: 'Computer Science', icon: '💻', minSmarts: 65, yearlyCost: 14000 },
  { id: 'science', name: 'Science', icon: '🔬', minSmarts: 62, yearlyCost: 12000 },
  { id: 'business', name: 'Business', icon: '📊', minSmarts: 50, yearlyCost: 13000 },
  { id: 'nursing', name: 'Nursing', icon: '💉', minSmarts: 55, yearlyCost: 11000 },
  { id: 'education', name: 'Education', icon: '🍎', minSmarts: 45, yearlyCost: 9000 },
  { id: 'psychology', name: 'Psychology', icon: '🧠', minSmarts: 55, yearlyCost: 10000 },
  { id: 'arts', name: 'Arts & Media', icon: '🎭', minSmarts: 35, yearlyCost: 9000 },
];

const teen = { minAge: 14, minEdu: 0, partTime: true } as const;
const hs = { minAge: 18, minEdu: 2 } as const;
const degree = { minAge: 21, minEdu: 3 } as const;

export const careers: CareerDef[] = [
  // ---- Teen / part-time ----
  { id: 'paper-round', name: 'Paper Round', icon: '🗞️', sector: 'Part-time', blurb: 'Early mornings, pocket money.', ...teen, ladder: ladder(['Paper Boy/Girl', 'Route Lead'], 4000, 1.2) },
  { id: 'fast-food', name: 'Fast Food Crew', icon: '🍔', sector: 'Part-time', blurb: 'Fries, fryers, and fluorescent lights.', ...teen, ladder: ladder(['Crew Member', 'Shift Leader', 'Assistant Manager'], 9000, 1.3) },
  { id: 'babysitter', name: 'Babysitter', icon: '🧸', sector: 'Part-time', blurb: 'Other people’s kids, your money.', ...teen, minSmarts: 30, ladder: ladder(['Babysitter', 'Nanny'], 5000, 1.5) },
  { id: 'retail-assistant', name: 'Retail Assistant', icon: '🛍️', sector: 'Part-time', blurb: 'Folding clothes nobody buys.', ...teen, ladder: ladder(['Sales Assistant', 'Senior Assistant', 'Supervisor'], 9500, 1.25) },
  { id: 'barista', name: 'Barista', icon: '☕', sector: 'Part-time', blurb: 'Latte art and morning regulars.', ...teen, ladder: ladder(['Barista', 'Head Barista', 'Café Manager'], 10000, 1.3) },

  // ---- High school entry ----
  { id: 'warehouse', name: 'Warehouse Worker', icon: '📦', sector: 'Trades', blurb: 'Steady hours, sore back.', ...hs, ladder: ladder(['Picker', 'Forklift Driver', 'Team Lead', 'Warehouse Manager'], 26000, 1.25) },
  { id: 'construction', name: 'Construction Worker', icon: '🏗️', sector: 'Trades', blurb: 'Hard hats and early starts.', ...hs, ladder: ladder(['Labourer', 'Skilled Builder', 'Site Foreman', 'Contractor'], 30000, 1.3) },
  { id: 'electrician', name: 'Electrician', icon: '💡', sector: 'Trades', blurb: 'Good money, mind the wires.', ...hs, minSmarts: 45, ladder: ladder(['Apprentice', 'Electrician', 'Master Electrician', 'Business Owner'], 28000, 1.38) },
  { id: 'mechanic', name: 'Mechanic', icon: '🔧', sector: 'Trades', blurb: 'You can always hear the engine.', ...hs, minSmarts: 40, ladder: ladder(['Mechanic’s Assistant', 'Mechanic', 'Head Mechanic', 'Garage Owner'], 27000, 1.3) },
  { id: 'driver', name: 'Rideshare Driver', icon: '🚕', sector: 'Service', blurb: 'Be your own boss, in someone else’s car.', ...hs, ladder: ladder(['Driver', 'Top-Rated Driver', 'Fleet Owner'], 24000, 1.3) },
  { id: 'cook', name: 'Chef', icon: '👨‍🍳', sector: 'Service', blurb: 'Heat, hustle, and flavour.', ...hs, minSmarts: 35, ladder: ladder(['Line Cook', 'Sous Chef', 'Head Chef', 'Restaurateur'], 24000, 1.4) },
  { id: 'call-centre', name: 'Call Centre Agent', icon: '🎧', sector: 'Service', blurb: 'Thank you for holding.', ...hs, ladder: ladder(['Agent', 'Senior Agent', 'Team Lead', 'Centre Manager'], 25000, 1.25) },
  { id: 'security', name: 'Security Guard', icon: '🛡️', sector: 'Service', blurb: 'Nights are quiet. Mostly.', ...hs, cleanRecord: true, ladder: ladder(['Guard', 'Site Supervisor', 'Security Manager'], 26000, 1.28) },
  { id: 'barber', name: 'Barber / Stylist', icon: '💈', sector: 'Service', blurb: 'Everyone tells you their secrets.', ...hs, minLooks: 40, ladder: ladder(['Junior Stylist', 'Stylist', 'Senior Stylist', 'Salon Owner'], 24000, 1.35) },
  { id: 'police', name: 'Police Officer', icon: '👮', sector: 'Public service', blurb: 'Protect, serve, paperwork.', minAge: 21, minEdu: 2, minSmarts: 45, cleanRecord: true, ladder: ladder(['Constable', 'Sergeant', 'Inspector', 'Chief'], 42000, 1.3) },
  { id: 'firefighter', name: 'Firefighter', icon: '🚒', sector: 'Public service', blurb: 'Run toward the fire.', minAge: 20, minEdu: 2, cleanRecord: true, ladder: ladder(['Recruit', 'Firefighter', 'Lieutenant', 'Fire Chief'], 40000, 1.3) },
  { id: 'soldier', name: 'Soldier', icon: '🎖️', sector: 'Public service', blurb: 'Serve your country.', minAge: 18, minEdu: 2, cleanRecord: true, ladder: ladder(['Private', 'Corporal', 'Sergeant', 'Captain', 'General'], 30000, 1.35) },
  { id: 'realtor', name: 'Real Estate Agent', icon: '🏠', sector: 'Business', blurb: 'Location, location, commission.', ...hs, minSmarts: 40, minLooks: 40, ladder: ladder(['Trainee Agent', 'Agent', 'Senior Agent', 'Broker', 'Agency Owner'], 28000, 1.45) },
  { id: 'musician', name: 'Musician', icon: '🎸', sector: 'Creative', blurb: 'Gigs, groupies, and unpaid invoices.', ...hs, minLooks: 45, ladder: ladder(['Busker', 'Gigging Musician', 'Signed Artist', 'Headliner', 'Superstar'], 14000, 1.9) },
  { id: 'actor', name: 'Actor', icon: '🎬', sector: 'Creative', blurb: 'Waiting tables between auditions.', ...hs, minLooks: 60, ladder: ladder(['Extra', 'Bit Part', 'Supporting Actor', 'Leading Actor', 'A-List Star'], 15000, 1.95) },
  { id: 'influencer', name: 'Content Creator', icon: '📱', sector: 'Creative', blurb: 'Like, comment, subscribe.', ...hs, minLooks: 55, ladder: ladder(['Hobbyist', 'Micro-Influencer', 'Influencer', 'Mega-Influencer'], 12000, 2.1) },

  // ---- Degree careers ----
  { id: 'doctor', name: 'Doctor', icon: '🩺', sector: 'Medicine', blurb: 'Saving lives, mostly on four hours of sleep.', ...degree, major: 'medicine', ladder: ladder(['Intern', 'Resident', 'Physician', 'Specialist', 'Chief of Medicine'], 55000, 1.4) },
  { id: 'nurse', name: 'Nurse', icon: '💉', sector: 'Medicine', blurb: 'The backbone of every hospital.', ...degree, minAge: 21, major: 'nursing', ladder: ladder(['Junior Nurse', 'Registered Nurse', 'Charge Nurse', 'Matron'], 42000, 1.25) },
  { id: 'lawyer', name: 'Lawyer', icon: '⚖️', sector: 'Law', blurb: 'Billable hours and big opinions.', ...degree, major: 'law', ladder: ladder(['Paralegal', 'Associate', 'Senior Associate', 'Partner', 'Managing Partner'], 50000, 1.45) },
  { id: 'engineer', name: 'Engineer', icon: '⚙️', sector: 'Tech', blurb: 'Build things that stay built.', ...degree, major: 'engineering', ladder: ladder(['Junior Engineer', 'Engineer', 'Senior Engineer', 'Principal', 'Director of Engineering'], 52000, 1.32) },
  { id: 'developer', name: 'Software Developer', icon: '💻', sector: 'Tech', blurb: 'It works on my machine.', ...degree, major: 'cs', ladder: ladder(['Junior Dev', 'Developer', 'Senior Dev', 'Staff Engineer', 'CTO'], 58000, 1.38) },
  { id: 'scientist', name: 'Scientist', icon: '🔬', sector: 'Research', blurb: 'Curiosity, funded by grants.', ...degree, major: 'science', ladder: ladder(['Lab Assistant', 'Researcher', 'Senior Scientist', 'Lead Scientist'], 44000, 1.3) },
  { id: 'professor', name: 'Professor', icon: '🎓', sector: 'Research', blurb: 'Publish, teach, repeat.', minAge: 27, minEdu: 5, major: 'science', ladder: ladder(['Lecturer', 'Associate Professor', 'Professor', 'Dean'], 60000, 1.3) },
  { id: 'accountant', name: 'Accountant', icon: '🧮', sector: 'Business', blurb: 'The numbers always add up. Eventually.', ...degree, major: 'business', ladder: ladder(['Junior Accountant', 'Accountant', 'Senior Accountant', 'Finance Director', 'CFO'], 46000, 1.34) },
  { id: 'banker', name: 'Investment Banker', icon: '🏦', sector: 'Business', blurb: 'Eat what you kill.', ...degree, major: 'business', minSmarts: 65, ladder: ladder(['Analyst', 'Associate', 'Vice President', 'Director', 'Managing Director'], 70000, 1.5) },
  { id: 'manager', name: 'Business Manager', icon: '📈', sector: 'Business', blurb: 'Meetings about meetings.', ...degree, major: 'business', ladder: ladder(['Management Trainee', 'Manager', 'Senior Manager', 'VP', 'CEO'], 48000, 1.5) },
  { id: 'teacher', name: 'Teacher', icon: '🍎', sector: 'Education', blurb: 'Shaping minds, buying your own supplies.', ...degree, major: 'education', ladder: ladder(['Teaching Assistant', 'Teacher', 'Head of Department', 'Principal'], 36000, 1.25) },
  { id: 'psychologist', name: 'Psychologist', icon: '🛋️', sector: 'Medicine', blurb: 'And how does that make you feel?', ...degree, major: 'psychology', ladder: ladder(['Assistant', 'Psychologist', 'Senior Therapist', 'Clinic Owner'], 45000, 1.35) },
  { id: 'journalist', name: 'Journalist', icon: '📰', sector: 'Media', blurb: 'Deadlines and difficult questions.', ...degree, major: 'arts', ladder: ladder(['Reporter', 'Correspondent', 'Editor', 'Editor-in-Chief'], 34000, 1.32) },
  { id: 'designer', name: 'Designer', icon: '🎨', sector: 'Creative', blurb: 'Make it pop. Then make it pop less.', ...degree, major: 'arts', ladder: ladder(['Junior Designer', 'Designer', 'Art Director', 'Creative Director'], 36000, 1.34) },
];
