import { CareerDef, MajorDef } from '../engine/content';

/** Build a ladder where each rung pays `step`× the last (rounded to $100). */
const ladder = (titles: string[], start: number, step = 1.3): CareerDef['ladder'] =>
  titles.map((title, i) => ({ title, salary: Math.round((start * step ** i) / 100) * 100 }));

export const moreMajors: MajorDef[] = [
  { id: 'architecture', name: 'Architecture', icon: '📐', minSmarts: 60, yearlyCost: 13000 },
  { id: 'agriculture', name: 'Agriculture', icon: '🌾', minSmarts: 40, yearlyCost: 8000 },
  { id: 'veterinary', name: 'Veterinary Science', icon: '🐾', minSmarts: 70, yearlyCost: 17000 },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', minSmarts: 65, yearlyCost: 15000 },
  { id: 'environmental', name: 'Environmental Studies', icon: '🌍', minSmarts: 50, yearlyCost: 10000 },
  { id: 'performing', name: 'Performing Arts', icon: '🎻', minSmarts: 30, yearlyCost: 9500 },
  { id: 'economics', name: 'Economics', icon: '💹', minSmarts: 60, yearlyCost: 12000 },
  { id: 'criminology', name: 'Criminology', icon: '🕵️', minSmarts: 50, yearlyCost: 10000 },
];

const teen = { minAge: 14, minEdu: 0, partTime: true } as const;
const trade = { minAge: 17, minEdu: 2 } as const;
const hs = { minAge: 18, minEdu: 2 } as const;
const degree = { minAge: 21, minEdu: 3 } as const;
const senior = { minAge: 60, minEdu: 0, partTime: true } as const;

export const moreCareers: CareerDef[] = [
  // ---- Teen part-time ----
  { id: 'dog-walker', name: 'Dog Walker', icon: '🐕', sector: 'Part-time', blurb: 'Paid to be dragged around the park by a beagle.', ...teen, ladder: ladder(['Dog Walker', 'Pet Sitter', 'Pet Care Business'], 5500, 1.45) },
  { id: 'lifeguard', name: 'Lifeguard', icon: '🏊', sector: 'Part-time', blurb: 'Whistle, tan, and one very dramatic rescue of a pool noodle.', ...teen, minAge: 15, ladder: ladder(['Lifeguard', 'Head Guard', 'Pool Manager'], 9500, 1.3) },
  { id: 'cinema-usher', name: 'Cinema Usher', icon: '🎞️', sector: 'Part-time', blurb: 'You have seen the same trailer 4,000 times.', ...teen, ladder: ladder(['Usher', 'Projectionist', 'Cinema Supervisor'], 8000, 1.3) },
  { id: 'supermarket-clerk', name: 'Supermarket Clerk', icon: '🛒', sector: 'Part-time', blurb: 'Price checks on aisle nine, forever.', ...teen, ladder: ladder(['Stocker', 'Cashier', 'Department Lead', 'Store Manager'], 9000, 1.3) },
  { id: 'lawn-mowing', name: 'Lawn Mowing Crew', icon: '🌱', sector: 'Part-time', blurb: 'Neat stripes, sunburnt neck.', ...teen, ladder: ladder(['Mower', 'Landscaper', 'Lawn Business Owner'], 6500, 1.6) },
  { id: 'tutor', name: 'Tutor', icon: '📚', sector: 'Part-time', blurb: 'Explaining fractions to someone who would rather be elsewhere.', ...teen, minAge: 16, minSmarts: 60, ladder: ladder(['Peer Tutor', 'Private Tutor', 'Tutoring Centre Owner'], 8000, 1.5) },
  { id: 'pizza-delivery', name: 'Pizza Delivery', icon: '🍕', sector: 'Part-time', blurb: 'Thirty minutes or it is somebody else’s problem.', ...teen, minAge: 16, ladder: ladder(['Delivery Rider', 'Dispatcher', 'Store Manager'], 9500, 1.3) },
  { id: 'bike-courier', name: 'Bike Courier', icon: '🚲', sector: 'Part-time', blurb: 'Red lights are a suggestion. Quads are not.', ...teen, minAge: 16, ladder: ladder(['Courier', 'Express Courier', 'Courier Dispatcher'], 10500, 1.28) },
  { id: 'farm-hand', name: 'Farm Hand', icon: '🚜', sector: 'Nature & Farming', blurb: 'Up before the rooster, who resents you for it.', ...teen, minAge: 15, ladder: ladder(['Farm Hand', 'Tractor Operator', 'Farm Manager', 'Farm Owner'], 9000, 1.4) },
  { id: 'museum-guide', name: 'Museum Guide', icon: '🏛️', sector: 'Arts', blurb: 'You know three facts about every statue and invent the rest.', ...teen, minAge: 16, minSmarts: 45, ladder: ladder(['Guide', 'Senior Guide', 'Education Officer'], 9500, 1.3) },
  { id: 'theme-park-host', name: 'Theme Park Host', icon: '🎡', sector: 'Part-time', blurb: 'Smile for ten hours inside a costume that smells like regret.', ...teen, minAge: 16, ladder: ladder(['Ride Host', 'Costumed Character', 'Park Supervisor'], 9500, 1.25) },

  // ---- Food & Hospitality ----
  { id: 'baker', name: 'Baker', icon: '🥖', sector: 'Food & Hospitality', blurb: 'Clock in at 3 a.m. for the smell alone.', ...hs, ladder: ladder(['Baker’s Assistant', 'Baker', 'Head Baker', 'Bakery Owner'], 25000, 1.35) },
  { id: 'butcher', name: 'Butcher', icon: '🥩', sector: 'Food & Hospitality', blurb: 'Knife skills and strong opinions on sausages.', ...hs, ladder: ladder(['Counter Hand', 'Butcher', 'Master Butcher', 'Shop Owner'], 26000, 1.3) },
  { id: 'bartender', name: 'Bartender', icon: '🍸', sector: 'Food & Hospitality', blurb: 'Free therapy, tips optional.', minAge: 21, minEdu: 2, ladder: ladder(['Barback', 'Bartender', 'Head Bartender', 'Bar Owner'], 24000, 1.35) },
  { id: 'sommelier', name: 'Sommelier', icon: '🍷', sector: 'Food & Hospitality', blurb: 'Hints of oak, cherry, and quiet judgement.', minAge: 23, minEdu: 3, minSmarts: 55, ladder: ladder(['Wine Waiter', 'Sommelier', 'Head Sommelier', 'Master Sommelier'], 34000, 1.4) },
  { id: 'cheese-grader', name: 'Cheese Grader', icon: '🧀', sector: 'Food & Hospitality', blurb: 'You can tell a Tuesday cheddar from a Friday cheddar.', ...hs, minSmarts: 40, ladder: ladder(['Dairy Hand', 'Cheese Grader', 'Master Affineur', 'Creamery Owner'], 27000, 1.33) },
  { id: 'hotel-concierge', name: 'Hotel Concierge', icon: '🛎️', sector: 'Food & Hospitality', blurb: 'You can find a pony at midnight. Do not ask how.', ...hs, minLooks: 40, ladder: ladder(['Bellhop', 'Front Desk Agent', 'Concierge', 'Hotel General Manager'], 26000, 1.38) },
  { id: 'food-truck', name: 'Food Truck Owner', icon: '🚚', sector: 'Food & Hospitality', blurb: 'Your taco has a following and a parking ticket.', ...hs, minSmarts: 35, ladder: ladder(['Truck Cook', 'Truck Owner', 'Truck Fleet Owner', 'Franchise Founder'], 22000, 1.6) },
  { id: 'event-planner', name: 'Event Planner', icon: '🎉', sector: 'Food & Hospitality', blurb: 'Bridezilla is your Tuesday.', ...hs, minSmarts: 40, ladder: ladder(['Assistant Planner', 'Event Planner', 'Senior Planner', 'Agency Owner'], 29000, 1.4) },
  { id: 'tour-guide', name: 'Tour Guide', icon: '🧭', sector: 'Food & Hospitality', blurb: 'Hold the umbrella high and keep the tourists alive.', ...hs, minLooks: 35, ladder: ladder(['Walking Guide', 'Tour Leader', 'Head of Tours'], 24000, 1.3) },
  { id: 'flight-attendant', name: 'Flight Attendant', icon: '✈️', sector: 'Transport', blurb: 'Seatbelts, smiles, and a crying toddler at 38,000 feet.', minAge: 20, minEdu: 2, minLooks: 40, ladder: ladder(['Cabin Crew', 'Senior Crew', 'Purser', 'Cabin Director'], 32000, 1.3) },

  // ---- Trades ----
  { id: 'plumber', name: 'Plumber', icon: '🪠', sector: 'Trades', blurb: 'Your emergencies are everyone’s worst day.', ...trade, minSmarts: 40, ladder: ladder(['Apprentice', 'Plumber', 'Master Plumber', 'Plumbing Firm Owner'], 28000, 1.4) },
  { id: 'carpenter', name: 'Carpenter', icon: '🪚', sector: 'Trades', blurb: 'Measure twice, curse once.', ...trade, ladder: ladder(['Apprentice', 'Carpenter', 'Master Carpenter', 'Workshop Owner'], 27000, 1.33) },
  { id: 'welder', name: 'Welder', icon: '🔥', sector: 'Trades', blurb: 'Sparks fly. Eyebrows do not survive.', ...trade, ladder: ladder(['Welder’s Helper', 'Welder', 'Pipe Welder', 'Welding Supervisor'], 29000, 1.38) },
  { id: 'roofer', name: 'Roofer', icon: '🏠', sector: 'Trades', blurb: 'Great views, no fear of heights allowed.', ...trade, ladder: ladder(['Roofer’s Mate', 'Roofer', 'Roofing Lead', 'Roofing Contractor'], 28000, 1.35) },
  { id: 'hvac-tech', name: 'HVAC Technician', icon: '❄️', sector: 'Trades', blurb: 'Everyone loves you in July.', ...trade, minSmarts: 40, ladder: ladder(['Trainee', 'HVAC Tech', 'Senior Tech', 'Service Company Owner'], 30000, 1.35) },
  { id: 'painter-decorator', name: 'Painter & Decorator', icon: '🖌️', sector: 'Trades', blurb: 'Magnolia, again.', ...trade, ladder: ladder(['Painter’s Mate', 'Painter', 'Decorator', 'Decorating Firm Owner'], 25000, 1.3) },
  { id: 'tiler', name: 'Tiler', icon: '🧱', sector: 'Trades', blurb: 'You have strong feelings about grout.', ...trade, ladder: ladder(['Tiler’s Mate', 'Tiler', 'Master Tiler'], 26000, 1.4) },
  { id: 'locksmith', name: 'Locksmith', icon: '🔑', sector: 'Trades', blurb: 'You get called when someone is very locked out.', ...trade, minSmarts: 45, cleanRecord: true, ladder: ladder(['Trainee', 'Locksmith', 'Security Specialist', 'Locksmith Firm Owner'], 28000, 1.35) },
  { id: 'crane-operator', name: 'Crane Operator', icon: '🏗️', sector: 'Trades', blurb: 'Fifty metres up, with a thermos and a radio.', minAge: 20, minEdu: 2, ladder: ladder(['Signaller', 'Crane Operator', 'Tower Crane Operator', 'Lifting Supervisor'], 38000, 1.35) },
  { id: 'wind-turbine-tech', name: 'Wind Turbine Technician', icon: '🌬️', sector: 'Trades', blurb: 'A commute that includes a 90-metre ladder.', minAge: 19, minEdu: 2, minSmarts: 45, ladder: ladder(['Trainee Tech', 'Turbine Tech', 'Lead Tech', 'Site Manager'], 36000, 1.3) },
  { id: 'stonemason', name: 'Stonemason', icon: '🗿', sector: 'Trades', blurb: 'Cathedrals take a while. You are patient.', ...trade, ladder: ladder(['Mason’s Apprentice', 'Stonemason', 'Master Mason'], 26000, 1.4) },
  { id: 'tailor', name: 'Tailor', icon: '🧵', sector: 'Trades', blurb: 'Pins in the mouth, perfection in the hem.', ...trade, ladder: ladder(['Seamster', 'Tailor', 'Master Tailor', 'Atelier Owner'], 24000, 1.4) },

  // ---- Transport ----
  { id: 'truck-driver', name: 'Long-Haul Trucker', icon: '🚛', sector: 'Transport', blurb: 'Eight hundred miles, one radio station.', minAge: 21, minEdu: 2, cleanRecord: true, ladder: ladder(['Trainee Driver', 'Long-Haul Driver', 'Owner-Operator', 'Haulage Firm Owner'], 38000, 1.3) },
  { id: 'bus-driver', name: 'Bus Driver', icon: '🚌', sector: 'Transport', blurb: 'Mind the gap. And the lady with the stroller.', minAge: 21, minEdu: 2, cleanRecord: true, ladder: ladder(['Bus Driver', 'Senior Driver', 'Route Supervisor', 'Depot Manager'], 33000, 1.25) },
  { id: 'train-driver', name: 'Train Driver', icon: '🚆', sector: 'Transport', blurb: 'Two levers, ten thousand opinions from commuters.', minAge: 21, minEdu: 2, minSmarts: 50, cleanRecord: true, ladder: ladder(['Trainee Driver', 'Train Driver', 'Senior Driver', 'Driver Instructor'], 45000, 1.3) },
  { id: 'pilot', name: 'Airline Pilot', icon: '🛩️', sector: 'Transport', blurb: 'This is your captain speaking, mostly to the autopilot.', minAge: 23, minEdu: 3, minSmarts: 65, cleanRecord: true, ladder: ladder(['Cadet', 'First Officer', 'Captain', 'Senior Captain', 'Chief Pilot'], 50000, 1.45) },
  { id: 'ship-captain', name: 'Ship Captain', icon: '🚢', sector: 'Transport', blurb: 'The sea does not care about your schedule.', minAge: 22, minEdu: 2, minSmarts: 55, ladder: ladder(['Deckhand', 'Mate', 'First Officer', 'Captain'], 32000, 1.4) },
  { id: 'air-traffic-controller', name: 'Air Traffic Controller', icon: '🗼', sector: 'Transport', blurb: 'Fifty blips, zero room for sneezing.', minAge: 21, minEdu: 3, minSmarts: 75, cleanRecord: true, ladder: ladder(['Trainee', 'Controller', 'Senior Controller', 'Tower Chief'], 60000, 1.3) },
  { id: 'taxi-dispatcher', name: 'Dispatcher', icon: '📻', sector: 'Transport', blurb: 'Car 12, where are you and why is there a goat?', ...hs, ladder: ladder(['Call Taker', 'Dispatcher', 'Control Room Lead'], 28000, 1.25) },

  // ---- Nature & Farming ----
  { id: 'beekeeper', name: 'Beekeeper', icon: '🐝', sector: 'Nature & Farming', blurb: 'Thousands of coworkers, all of them armed.', ...hs, ladder: ladder(['Hive Hand', 'Beekeeper', 'Apiary Manager', 'Honey Brand Owner'], 22000, 1.4) },
  { id: 'farmer', name: 'Farmer', icon: '🌽', sector: 'Nature & Farming', blurb: 'Weather is your boss and it never answers email.', minAge: 18, minEdu: 1, ladder: ladder(['Farm Worker', 'Tenant Farmer', 'Landowner', 'Agri-Business Owner'], 24000, 1.45) },
  { id: 'fisher', name: 'Fisherman', icon: '🎣', sector: 'Nature & Farming', blurb: 'The big one is always the one that got away.', minAge: 17, minEdu: 1, ladder: ladder(['Deck Hand', 'Fisher', 'Boat Skipper', 'Trawler Owner'], 24000, 1.4) },
  { id: 'forest-ranger', name: 'Park Ranger', icon: '🌲', sector: 'Nature & Farming', blurb: 'Bears, tourists, and the occasional bear-tourist.', minAge: 21, minEdu: 3, major: 'environmental', cleanRecord: true, ladder: ladder(['Seasonal Ranger', 'Park Ranger', 'Senior Ranger', 'Park Superintendent'], 36000, 1.3) },
  { id: 'lighthouse-keeper', name: 'Lighthouse Keeper', icon: '🗼', sector: 'Nature & Farming', blurb: 'Wind, waves, and a very good book collection.', minAge: 25, minEdu: 2, minSmarts: 40, ladder: ladder(['Assistant Keeper', 'Lighthouse Keeper', 'Coastal Station Warden'], 26000, 1.3) },
  { id: 'arborist', name: 'Tree Surgeon', icon: '🪓', sector: 'Nature & Farming', blurb: 'Chainsaw in one hand, harness in the other, mother worried.', ...trade, ladder: ladder(['Ground Crew', 'Climber', 'Tree Surgeon', 'Tree Care Owner'], 27000, 1.38) },
  { id: 'agronomist', name: 'Agronomist', icon: '🌾', sector: 'Nature & Farming', blurb: 'You talk to soil for a living; it listens.', ...degree, major: 'agriculture', ladder: ladder(['Field Technician', 'Agronomist', 'Senior Agronomist', 'Director of Agriculture'], 42000, 1.3) },
  { id: 'veterinarian', name: 'Veterinarian', icon: '🐾', sector: 'Health', blurb: 'Patients cannot complain. They can bite, though.', ...degree, major: 'veterinary', ladder: ladder(['Vet Assistant', 'Veterinarian', 'Senior Vet', 'Practice Owner'], 52000, 1.38) },

  // ---- Health ----
  { id: 'pharmacist', name: 'Pharmacist', icon: '💊', sector: 'Health', blurb: 'You can read any doctor’s handwriting. It is a curse.', ...degree, major: 'pharmacy', ladder: ladder(['Pharmacy Intern', 'Pharmacist', 'Senior Pharmacist', 'Pharmacy Owner'], 70000, 1.3) },
  { id: 'paramedic', name: 'Paramedic', icon: '🚑', sector: 'Health', blurb: 'The first person on the scene who knows what to do.', minAge: 20, minEdu: 3, minSmarts: 50, cleanRecord: true, ladder: ladder(['EMT', 'Paramedic', 'Critical Care Medic', 'Ambulance Chief'], 36000, 1.3) },
  { id: 'dental-hygienist', name: 'Dental Hygienist', icon: '🦷', sector: 'Health', blurb: 'Yes, you really should floss.', minAge: 20, minEdu: 3, minSmarts: 50, ladder: ladder(['Dental Assistant', 'Hygienist', 'Lead Hygienist'], 40000, 1.35) },
  { id: 'physio', name: 'Physiotherapist', icon: '💪', sector: 'Health', blurb: 'Pain is your recurring customer.', ...degree, major: 'nursing', minSmarts: 55, ladder: ladder(['Assistant Physio', 'Physiotherapist', 'Senior Physio', 'Clinic Owner'], 44000, 1.32) },
  { id: 'dentist', name: 'Dentist', icon: '😁', sector: 'Health', blurb: 'Open wide, and pretend you flossed.', ...degree, major: 'medicine', minSmarts: 70, ladder: ladder(['Associate Dentist', 'Dentist', 'Senior Dentist', 'Practice Owner'], 75000, 1.4) },
  { id: 'surgeon', name: 'Surgeon', icon: '🔪', sector: 'Health', blurb: 'Steady hands, steady nerves, cold coffee.', minAge: 28, minEdu: 5, major: 'medicine', minSmarts: 85, ladder: ladder(['Surgical Resident', 'Surgeon', 'Senior Surgeon', 'Chief Surgeon'], 110000, 1.4) },
  { id: 'care-assistant', name: 'Care Assistant', icon: '🤝', sector: 'Health', blurb: 'Tea, patience, and a hundred stories you will carry.', minAge: 18, minEdu: 1, ladder: ladder(['Care Assistant', 'Senior Carer', 'Care Home Manager'], 22000, 1.3) },
  { id: 'midwife', name: 'Midwife', icon: '👶', sector: 'Health', blurb: 'New people arrive on their own schedule.', ...degree, major: 'nursing', ladder: ladder(['Student Midwife', 'Midwife', 'Senior Midwife', 'Head of Maternity'], 42000, 1.28) },

  // ---- Science & Tech ----
  { id: 'data-analyst', name: 'Data Analyst', icon: '📉', sector: 'Science & Tech', blurb: 'You find the pattern; they ask for a prettier chart.', ...degree, major: 'cs', ladder: ladder(['Junior Analyst', 'Data Analyst', 'Senior Analyst', 'Head of Data'], 50000, 1.33) },
  { id: 'cybersecurity', name: 'Cybersecurity Analyst', icon: '🔐', sector: 'Science & Tech', blurb: 'The password is still ‘password1’. Sigh.', ...degree, major: 'cs', minSmarts: 70, cleanRecord: true, ladder: ladder(['Security Trainee', 'Analyst', 'Penetration Tester', 'CISO'], 62000, 1.4) },
  { id: 'game-developer', name: 'Game Developer', icon: '🎮', sector: 'Science & Tech', blurb: 'Crunch time is a lifestyle.', ...degree, major: 'cs', ladder: ladder(['QA Tester', 'Gameplay Programmer', 'Lead Developer', 'Studio Director'], 44000, 1.4) },
  { id: 'astronomer', name: 'Astronomer', icon: '🔭', sector: 'Science & Tech', blurb: 'Your office hours are after dark.', minAge: 26, minEdu: 5, major: 'science', minSmarts: 78, ladder: ladder(['Research Assistant', 'Astronomer', 'Senior Astronomer', 'Observatory Director'], 55000, 1.3) },
  { id: 'marine-biologist', name: 'Marine Biologist', icon: '🐠', sector: 'Science & Tech', blurb: 'Dolphin taught you everything you know about teamwork.', ...degree, major: 'science', ladder: ladder(['Field Assistant', 'Marine Biologist', 'Senior Researcher', 'Research Director'], 42000, 1.3) },
  { id: 'environmental-consultant', name: 'Environmental Consultant', icon: '♻️', sector: 'Science & Tech', blurb: 'Charging companies to tell them what the river already knows.', ...degree, major: 'environmental', ladder: ladder(['Junior Consultant', 'Consultant', 'Senior Consultant', 'Practice Head'], 46000, 1.33) },
  { id: 'architect', name: 'Architect', icon: '📐', sector: 'Science & Tech', blurb: 'Your sketch was beautiful. The planning office disagrees.', ...degree, major: 'architecture', ladder: ladder(['Junior Architect', 'Architect', 'Senior Architect', 'Principal Architect'], 48000, 1.35) },
  { id: 'forensic-scientist', name: 'Forensic Scientist', icon: '🧪', sector: 'Science & Tech', blurb: 'It was the fibre. It is always the fibre.', ...degree, major: 'science', minSmarts: 68, cleanRecord: true, ladder: ladder(['Lab Technician', 'Forensic Analyst', 'Senior Scientist', 'Lab Director'], 46000, 1.32) },
  { id: 'robotics-technician', name: 'Robotics Technician', icon: '🤖', sector: 'Science & Tech', blurb: 'You teach machines. They still ignore you.', minAge: 20, minEdu: 3, major: 'engineering', ladder: ladder(['Robotics Assistant', 'Robotics Technician', 'Robotics Engineer', 'Head of Automation'], 48000, 1.35) },

  // ---- Business / Legal / Education / Public ----
  { id: 'forensic-accountant', name: 'Forensic Accountant', icon: '🔍', sector: 'Business', blurb: 'You follow the money and the lies it tells.', ...degree, major: 'business', minSmarts: 65, cleanRecord: true, ladder: ladder(['Junior Investigator', 'Forensic Accountant', 'Senior Investigator', 'Fraud Unit Director'], 52000, 1.38) },
  { id: 'economist', name: 'Economist', icon: '💹', sector: 'Business', blurb: 'Correctly predicted nine of the last three recessions.', ...degree, major: 'economics', ladder: ladder(['Research Assistant', 'Economist', 'Senior Economist', 'Chief Economist'], 56000, 1.4) },
  { id: 'insurance-adjuster', name: 'Insurance Adjuster', icon: '📋', sector: 'Business', blurb: 'Yes, the llama counts as an act of God.', ...hs, minSmarts: 45, ladder: ladder(['Claims Handler', 'Adjuster', 'Senior Adjuster', 'Claims Director'], 34000, 1.32) },
  { id: 'marketer', name: 'Marketing Manager', icon: '📣', sector: 'Business', blurb: 'Make it viral, but also on brand.', ...degree, major: 'business', ladder: ladder(['Marketing Assistant', 'Marketer', 'Marketing Manager', 'CMO'], 38000, 1.4) },
  { id: 'entrepreneur', name: 'Startup Founder', icon: '🚀', sector: 'Business', blurb: 'Disrupting something. Not sure what yet.', minAge: 20, minEdu: 2, minSmarts: 55, ladder: ladder(['Garage Founder', 'Seed-Funded Founder', 'Series A Founder', 'Unicorn CEO'], 15000, 2.4) },
  { id: 'judge', name: 'Judge', icon: '🔨', sector: 'Legal', blurb: 'Order in the court. Also, lunch.', minAge: 35, minEdu: 4, major: 'law', minSmarts: 78, cleanRecord: true, ladder: ladder(['Magistrate', 'District Judge', 'Circuit Judge', 'High Court Judge'], 85000, 1.3) },
  { id: 'detective', name: 'Detective', icon: '🕵️', sector: 'Public service', blurb: 'Coffee, hunches, and a very messy whiteboard.', minAge: 24, minEdu: 3, major: 'criminology', cleanRecord: true, ladder: ladder(['Detective Constable', 'Detective', 'Detective Inspector', 'Chief Superintendent'], 48000, 1.3) },
  { id: 'diplomat', name: 'Diplomat', icon: '🌐', sector: 'Public service', blurb: 'Smiling firmly at people you would like to shout at.', minAge: 25, minEdu: 4, major: 'economics', minSmarts: 70, cleanRecord: true, ladder: ladder(['Attaché', 'Second Secretary', 'Consul', 'Ambassador'], 52000, 1.38) },
  { id: 'politician', name: 'Politician', icon: '🏛️', sector: 'Public service', blurb: 'Kisses babies, avoids questions.', minAge: 28, minEdu: 3, major: 'law', minLooks: 40, ladder: ladder(['Councillor', 'Mayor', 'Representative', 'Senator', 'Head of State'], 40000, 1.6) },
  { id: 'librarian', name: 'Librarian', icon: '📖', sector: 'Education', blurb: 'Shh. You have heard everything.', ...degree, major: 'education', ladder: ladder(['Library Assistant', 'Librarian', 'Head Librarian', 'Chief Archivist'], 34000, 1.25) },
  { id: 'driving-instructor', name: 'Driving Instructor', icon: '🚗', sector: 'Education', blurb: 'Dual brakes, zero fear, vast patience.', minAge: 23, minEdu: 2, cleanRecord: true, ladder: ladder(['Trainee Instructor', 'Instructor', 'Senior Instructor', 'Driving School Owner'], 26000, 1.35) },
  { id: 'postal-worker', name: 'Postal Worker', icon: '📮', sector: 'Public service', blurb: 'Rain, sleet, or dogs: you deliver.', ...hs, ladder: ladder(['Sorter', 'Postie', 'Delivery Supervisor', 'Depot Manager'], 28000, 1.22) },
  { id: 'park-gardener', name: 'Council Gardener', icon: '🌷', sector: 'Public service', blurb: 'Perennially underappreciated. Perennially in bloom.', ...hs, ladder: ladder(['Groundskeeper', 'Gardener', 'Head Gardener'], 25000, 1.28) },

  // ---- Creative / Arts / Sport / Entertainment ----
  { id: 'voice-actor', name: 'Voice Actor', icon: '🎙️', sector: 'Creative & Media', blurb: 'You have been a cartoon badger and a bank.', ...hs, minLooks: 30, minSmarts: 40, ladder: ladder(['Audio Book Narrator', 'Commercial Voice', 'Animation Voice', 'Lead Character Voice'], 16000, 1.8) },
  { id: 'stunt-performer', name: 'Stunt Performer', icon: '🤸', sector: 'Creative & Media', blurb: 'Falls down stairs professionally. Your insurer weeps.', minAge: 18, minEdu: 2, minLooks: 40, ladder: ladder(['Stunt Double', 'Stunt Performer', 'Stunt Coordinator', 'Second Unit Director'], 22000, 1.7) },
  { id: 'photographer', name: 'Photographer', icon: '📷', sector: 'Creative & Media', blurb: 'Golden hour is your whole personality.', ...hs, minLooks: 30, ladder: ladder(['Assistant', 'Photographer', 'Senior Photographer', 'Studio Owner'], 20000, 1.5) },
  { id: 'author', name: 'Novelist', icon: '✍️', sector: 'Creative & Media', blurb: 'Fifty drafts, one cat, zero sleep.', ...hs, minSmarts: 55, ladder: ladder(['Aspiring Writer', 'Published Author', 'Bestselling Author', 'Literary Legend'], 12000, 2.2) },
  { id: 'radio-host', name: 'Radio Host', icon: '📻', sector: 'Creative & Media', blurb: 'You are the voice in everyone’s kitchen.', ...hs, minLooks: 25, ladder: ladder(['Studio Hand', 'Late-Night Host', 'Breakfast Host', 'Network Star'], 22000, 1.55) },
  { id: 'animator', name: 'Animator', icon: '🖼️', sector: 'Creative & Media', blurb: 'Twenty-four frames per second. Per second!', ...degree, major: 'arts', ladder: ladder(['Inbetweener', 'Animator', 'Lead Animator', 'Animation Director'], 36000, 1.4) },
  { id: 'comedian', name: 'Stand-Up Comedian', icon: '🎤', sector: 'Creative & Media', blurb: 'Dying on stage is just a Tuesday.', ...hs, minSmarts: 40, ladder: ladder(['Open Mic Regular', 'Club Comic', 'Touring Comedian', 'Arena Headliner', 'Special on Streaming'], 9000, 2.0) },
  { id: 'tattoo-artist', name: 'Tattoo Artist', icon: '🖋️', sector: 'Arts', blurb: 'Permanent is a long time. Your clients do not care.', ...hs, minLooks: 35, ladder: ladder(['Apprentice', 'Tattoo Artist', 'Senior Artist', 'Studio Owner'], 18000, 1.5) },
  { id: 'orchestra-player', name: 'Orchestra Musician', icon: '🎻', sector: 'Arts', blurb: 'Eighty players and exactly one person gets applause first.', minAge: 21, minEdu: 3, major: 'performing', ladder: ladder(['Session Player', 'Section Player', 'Principal', 'Concertmaster'], 34000, 1.35) },
  { id: 'dancer', name: 'Professional Dancer', icon: '💃', sector: 'Arts', blurb: 'Your toes have seen things.', minAge: 18, minEdu: 2, minLooks: 55, ladder: ladder(['Corps Dancer', 'Soloist', 'Principal Dancer', 'Choreographer'], 22000, 1.55) },
  { id: 'game-streamer', name: 'Streamer', icon: '🕹️', sector: 'Creative & Media', blurb: 'Thank you for the sub. Please, I am begging you, chat.', ...hs, minLooks: 40, ladder: ladder(['Three Viewers', 'Affiliate', 'Partner', 'Mega-Streamer'], 8000, 2.3) },
  { id: 'athlete', name: 'Pro Footballer', icon: '⚽', sector: 'Sport', blurb: 'Ninety minutes, one hamstring.', minAge: 17, minEdu: 1, minLooks: 40, ladder: ladder(['Academy Player', 'Reserve Player', 'First-Team Starter', 'Club Captain', 'Global Icon'], 16000, 2.1) },
  { id: 'personal-trainer', name: 'Personal Trainer', icon: '🏋️', sector: 'Sport', blurb: 'One more rep. Then another. And a selfie.', ...hs, minLooks: 45, ladder: ladder(['Gym Instructor', 'Personal Trainer', 'Head Trainer', 'Gym Owner'], 23000, 1.4) },
  { id: 'sports-coach', name: 'Sports Coach', icon: '🥅', sector: 'Sport', blurb: 'Whistle, clipboard, and a growing speech about effort.', minAge: 22, minEdu: 2, ladder: ladder(['Youth Coach', 'Assistant Coach', 'Head Coach', 'Director of Football'], 28000, 1.5) },
  { id: 'golf-caddie', name: 'Golf Caddie', icon: '⛳', sector: 'Sport', blurb: 'Carry the bag, never the blame.', ...teen, minAge: 16, ladder: ladder(['Caddie', 'Tour Caddie', 'Head Caddie'], 8500, 1.6) },

  // ---- Senior-friendly part-time ----
  { id: 'crossing-guard', name: 'Crossing Guard', icon: '🚸', sector: 'Part-time', blurb: 'You wield a lollipop sign and absolute authority.', ...senior, ladder: ladder(['Crossing Guard', 'Senior Guard'], 11000, 1.15) },
  { id: 'museum-volunteer', name: 'Museum Greeter', icon: '🖼️', sector: 'Part-time', blurb: 'You have strong feelings about the sculpture in the lobby.', ...senior, ladder: ladder(['Greeter', 'Lead Greeter'], 9000, 1.2) },
  { id: 'garden-centre', name: 'Garden Centre Assistant', icon: '🪴', sector: 'Part-time', blurb: 'Customers ask about slugs. You have answers.', ...senior, ladder: ladder(['Assistant', 'Plant Advisor', 'Department Lead'], 10000, 1.18) },
  { id: 'storyteller', name: 'Library Storyteller', icon: '📚', sector: 'Part-time', blurb: 'Seven toddlers, one chair, endless voices.', ...senior, ladder: ladder(['Storyteller', 'Head Storyteller'], 9500, 1.2) },
  { id: 'consultant-elder', name: 'Retired-Expert Consultant', icon: '🧓', sector: 'Part-time', blurb: 'Same job, triple the hourly rate, none of the meetings.', ...senior, minEdu: 3, minSmarts: 55, ladder: ladder(['Advisor', 'Senior Consultant', 'Industry Sage'], 20000, 1.6) },
];
