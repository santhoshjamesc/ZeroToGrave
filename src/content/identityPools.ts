import { Gender } from '../engine/types';

export interface CountryDef {
  id: string;
  name: string;
  flag: string;
  cities: string[];
  /** Name pools: first names by gender + surnames, flavoured per country. */
  male: string[];
  female: string[];
  nonbinary: string[];
  surnames: string[];
  /** Relative chance of being born here. */
  weight: number;
}

export const countries: CountryDef[] = [
  {
    id: 'us', name: 'United States', flag: '🇺🇸', weight: 10,
    cities: ['Austin', 'Chicago', 'Portland', 'Atlanta', 'Boston', 'Denver', 'Miami', 'Seattle'],
    male: ['Liam', 'Noah', 'Mason', 'Ethan', 'Caleb', 'Jaxon', 'Wyatt', 'Owen'],
    female: ['Olivia', 'Emma', 'Harper', 'Ava', 'Chloe', 'Madison', 'Lily', 'Grace'],
    nonbinary: ['Riley', 'Jordan', 'Quinn', 'Avery', 'Rowan', 'Sage'],
    surnames: ['Miller', 'Carter', 'Brooks', 'Reed', 'Turner', 'Hayes', 'Foster', 'Bennett'],
  },
  {
    id: 'in', name: 'India', flag: '🇮🇳', weight: 10,
    cities: ['Mumbai', 'Chennai', 'Pune', 'Jaipur', 'Kochi', 'Hyderabad', 'Kolkata', 'Bengaluru'],
    male: ['Arjun', 'Rohan', 'Vikram', 'Aarav', 'Karthik', 'Ishaan', 'Dev', 'Siddharth'],
    female: ['Priya', 'Ananya', 'Meera', 'Diya', 'Kavya', 'Isha', 'Neha', 'Saanvi'],
    nonbinary: ['Kiran', 'Jyoti', 'Arya', 'Sasha', 'Noor', 'Ravi'],
    surnames: ['Sharma', 'Iyer', 'Nair', 'Patel', 'Reddy', 'Kapoor', 'Menon', 'Das'],
  },
  {
    id: 'br', name: 'Brazil', flag: '🇧🇷', weight: 6,
    cities: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Recife', 'Curitiba', 'Fortaleza'],
    male: ['Lucas', 'Gabriel', 'Mateus', 'Thiago', 'Rafael', 'Bruno'],
    female: ['Sofia', 'Beatriz', 'Julia', 'Camila', 'Larissa', 'Isabela'],
    nonbinary: ['Alex', 'Dani', 'Gabi', 'Luan', 'Maju'],
    surnames: ['Silva', 'Santos', 'Oliveira', 'Costa', 'Pereira', 'Almeida', 'Rocha'],
  },
  {
    id: 'jp', name: 'Japan', flag: '🇯🇵', weight: 6,
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Sapporo', 'Nagoya', 'Fukuoka', 'Sendai'],
    male: ['Haruto', 'Ren', 'Sota', 'Yuto', 'Kaito', 'Daiki'],
    female: ['Yui', 'Hina', 'Sakura', 'Aoi', 'Mio', 'Rin'],
    nonbinary: ['Akira', 'Haru', 'Kaoru', 'Sora', 'Yuki'],
    surnames: ['Tanaka', 'Sato', 'Suzuki', 'Takahashi', 'Kobayashi', 'Watanabe', 'Ito'],
  },
  {
    id: 'ng', name: 'Nigeria', flag: '🇳🇬', weight: 5,
    cities: ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Enugu', 'Port Harcourt'],
    male: ['Chidi', 'Emeka', 'Tunde', 'Ayo', 'Obinna', 'Segun'],
    female: ['Amara', 'Ngozi', 'Folake', 'Zainab', 'Chioma', 'Adaeze'],
    nonbinary: ['Ife', 'Kemi', 'Dayo', 'Ola', 'Tobi'],
    surnames: ['Okafor', 'Adeyemi', 'Balogun', 'Eze', 'Okoye', 'Bello', 'Nwosu'],
  },
  {
    id: 'gb', name: 'United Kingdom', flag: '🇬🇧', weight: 6,
    cities: ['London', 'Manchester', 'Glasgow', 'Bristol', 'Leeds', 'Cardiff', 'Edinburgh'],
    male: ['Oliver', 'George', 'Harry', 'Arthur', 'Freddie', 'Alfie'],
    female: ['Amelia', 'Isla', 'Poppy', 'Florence', 'Evie', 'Millie'],
    nonbinary: ['Robin', 'Charlie', 'Sam', 'Frankie', 'Ash'],
    surnames: ['Walker', 'Hughes', 'Clarke', 'Wright', 'Morgan', 'Ellis', 'Hall'],
  },
  {
    id: 'mx', name: 'Mexico', flag: '🇲🇽', weight: 6,
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Oaxaca', 'Mérida'],
    male: ['Santiago', 'Mateo', 'Diego', 'Emiliano', 'Luis', 'Javier'],
    female: ['Valentina', 'Ximena', 'Camila', 'Renata', 'Lucía', 'Marisol'],
    nonbinary: ['Alex', 'Cris', 'Sol', 'Ariel', 'Nico'],
    surnames: ['García', 'Hernández', 'López', 'Martínez', 'Ramírez', 'Torres', 'Flores'],
  },
  {
    id: 'kr', name: 'South Korea', flag: '🇰🇷', weight: 4,
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Jeju'],
    male: ['Min-jun', 'Seo-jun', 'Ji-ho', 'Hyun-woo', 'Do-yoon'],
    female: ['Seo-yeon', 'Ha-eun', 'Ji-woo', 'Soo-ah', 'Yuna'],
    nonbinary: ['Ha-neul', 'Bom', 'Sol', 'Dan', 'Areum'],
    surnames: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon'],
  },
  {
    id: 'de', name: 'Germany', flag: '🇩🇪', weight: 5,
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Leipzig', 'Dresden'],
    male: ['Lukas', 'Felix', 'Jonas', 'Leon', 'Finn', 'Paul'],
    female: ['Mia', 'Hannah', 'Lena', 'Emilia', 'Clara', 'Greta'],
    nonbinary: ['Kai', 'Robin', 'Sascha', 'Luca', 'Toni'],
    surnames: ['Müller', 'Schmidt', 'Weber', 'Fischer', 'Becker', 'Hoffmann', 'Koch'],
  },
  {
    id: 'eg', name: 'Egypt', flag: '🇪🇬', weight: 4,
    cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Mansoura'],
    male: ['Omar', 'Youssef', 'Karim', 'Hassan', 'Mostafa', 'Tarek'],
    female: ['Layla', 'Nour', 'Salma', 'Farida', 'Mariam', 'Hana'],
    nonbinary: ['Nour', 'Malak', 'Salam', 'Rami', 'Ezz'],
    surnames: ['Hassan', 'Mahmoud', 'Farouk', 'Saleh', 'Nasser', 'Khalil', 'Ibrahim'],
  },
  {
    id: 'au', name: 'Australia', flag: '🇦🇺', weight: 3,
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart'],
    male: ['Jack', 'Archie', 'Cooper', 'Lachlan', 'Hudson', 'Riley'],
    female: ['Matilda', 'Charlotte', 'Ruby', 'Mia', 'Willow', 'Zoe'],
    nonbinary: ['Billie', 'Kit', 'Sunny', 'Jesse', 'Bay'],
    surnames: ['Smith', 'Jones', 'Taylor', 'Wilson', 'Murray', 'Campbell', 'Kelly'],
  },
  {
    id: 'fr', name: 'France', flag: '🇫🇷', weight: 4,
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes', 'Bordeaux'],
    male: ['Louis', 'Hugo', 'Jules', 'Léo', 'Arthur', 'Gabin'],
    female: ['Camille', 'Chloé', 'Inès', 'Manon', 'Léa', 'Jade'],
    nonbinary: ['Claude', 'Sacha', 'Alix', 'Dominique', 'Maël'],
    surnames: ['Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Lefebvre', 'Girard'],
  },
];

export const skinTones = ['#F9D5B8', '#EFC09A', '#D9A074', '#B97B50', '#8D5A3B', '#6B4128', '#4A2C1B'];
export const hairColors = ['#16110E', '#3B2417', '#6A4326', '#A66B2D', '#D9B26A', '#C4482B', '#2B2B2B'];
export const eyeColors = ['#3B2A1D', '#5B3B22', '#2F6B8A', '#3F7D4E', '#7A6A3A', '#53595E'];

export const hairStylesByGender: Record<Gender, readonly ('short' | 'long' | 'curly' | 'bun' | 'buzz' | 'bald')[]> = {
  male: ['short', 'short', 'curly', 'buzz', 'bald'],
  female: ['long', 'long', 'curly', 'bun', 'short'],
  nonbinary: ['short', 'long', 'curly', 'bun', 'buzz'],
};

export const zodiacs = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
