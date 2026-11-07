import { getKV } from './kv';

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  /** Hide risk hints on choices. */
  hardcore: boolean;
}

const KEY = 'ztg:settings';
const DEFAULTS: Settings = { sound: true, music: true, haptics: true, hardcore: false };

let cache: Settings | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  try {
    const raw = getKV().getString(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      sound: p.sound ?? DEFAULTS.sound,
      music: p.music ?? DEFAULTS.music,
      haptics: p.haptics ?? DEFAULTS.haptics,
      hardcore: p.hardcore ?? DEFAULTS.hardcore,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Stable object identity until a setting changes (needed by useSyncExternalStore). */
export function getSettings(): Settings {
  if (!cache) cache = read();
  return cache;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  cache = { ...getSettings(), ...patch };
  try {
    getKV().set(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
  return cache;
}

export function subscribeSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Test helper: forget the in-memory copy. */
export function resetSettingsCache(): void {
  cache = null;
}
