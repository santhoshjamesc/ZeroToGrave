import { useSyncExternalStore } from 'react';
import { getSettings, Settings, subscribeSettings } from './settings';

export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}
