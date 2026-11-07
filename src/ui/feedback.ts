import * as Haptics from 'expo-haptics';
import { getSettings } from '../store/settings';
import { playSfx } from './audio';

/** Haptics follow the Settings toggle and never block gameplay if unavailable. */
export const setHapticsEnabled = (on: boolean): void => {
  void on; // Kept for compatibility; the source of truth is store/settings.
};

const safe = (fn: () => Promise<void>): void => {
  if (!getSettings().haptics) return;
  fn().catch(() => undefined);
};

export const tapHaptic = (): void => {
  playSfx('tap');
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};
export const boopHaptic = (): void => {
  playSfx('select');
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
};
export const successHaptic = (): void => {
  playSfx('success');
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
};
export const warnHaptic = (): void => {
  playSfx('bad');
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
};
