export const colors = {
  bg: '#0F1226',
  surface: '#1A1F3D',
  card: '#232850',
  primary: '#6C5CE7',
  primaryDark: '#4B3FB8',
  accent: '#FFD166',
  good: '#4ADE80',
  bad: '#FF6B6B',
  text: '#F5F6FF',
  muted: '#A3A9D4',
  danger: '#FF6B6B',
  border: '#343A6B',
} as const;

export const statColors = {
  health: '#FF6B8A',
  happiness: '#FFD166',
  smarts: '#5DA9FF',
  looks: '#C58BFF',
  karma: '#4ADE80',
  energy: '#FF9F4A',
} as const;

export const statIcons = {
  health: '❤️',
  happiness: '😊',
  smarts: '🧠',
  looks: '✨',
  karma: '☯️',
  energy: '⚡',
} as const;

export const focusIcons = {
  study: '📚',
  work: '💼',
  fitness: '🏋️',
  social: '🎉',
  hobby: '🎨',
  rest: '😴',
  family: '👨‍👩‍👧',
  sideHustle: '💸',
} as const;

/** Sky gradients per life stage for the scene backdrop. */
export const stageSky: Record<string, readonly [string, string]> = {
  baby: ['#FFD6E0', '#FFF1D6'],
  toddler: ['#9ED8FF', '#FFF1D6'],
  child: ['#5DB8FF', '#C9F0FF'],
  teen: ['#7C6CFF', '#FFB4A2'],
  adult: ['#3A7BD5', '#9BD1FF'],
  middle: ['#2C5282', '#F6AD55'],
  senior: ['#42306B', '#F6A5A5'],
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const motion = { fast: 150, base: 250, slow: 500 } as const;
