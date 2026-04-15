import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(val) {
  enabled = val;
}

export function tapHaptic() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function successHaptic() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function errorHaptic() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function heavyHaptic() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function selectionHaptic() {
  if (!enabled) return;
  Haptics.selectionAsync();
}
