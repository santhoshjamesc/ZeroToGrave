/** Minimal synchronous key-value interface. MMKV in the app, an in-memory map in tests/fallback. */
export interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export function createMemoryKV(initial: Record<string, string> = {}): KV {
  const m = new Map(Object.entries(initial));
  return {
    getString: (k) => m.get(k),
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
    keys: () => [...m.keys()],
  };
}

function createMmkvKV(): KV {
  // Lazy require so Jest / web / Expo Go never load the native module unless asked.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const db = createMMKV({ id: 'zerotograve' });
  return {
    getString: (k) => db.getString(k),
    set: (k, v) => db.set(k, v),
    remove: (k) => void db.remove(k),
    keys: () => db.getAllKeys(),
  };
}

let current: KV | null = null;

/** The active store. Falls back to memory (non-persistent) if MMKV is unavailable. */
export function getKV(): KV {
  if (current) return current;
  try {
    current = createMmkvKV();
  } catch {
    current = createMemoryKV();
  }
  return current;
}

/** Inject a KV (tests). Pass null to reset to the default. */
export function setKV(kv: KV | null): void {
  current = kv;
}
