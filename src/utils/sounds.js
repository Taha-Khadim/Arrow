import { Audio } from 'expo-av';

let enabled = true;
let tapSound = null;
let collectSound = null;
let completeSound = null;
let errorSound = null;

export function setSoundsEnabled(val) {
  enabled = val;
}

export async function preloadSounds() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const tap = await Audio.Sound.createAsync(require('../assets/sounds/tap.wav'));
    tapSound = tap.sound;

    const collect = await Audio.Sound.createAsync(require('../assets/sounds/collect.wav'));
    collectSound = collect.sound;

    const complete = await Audio.Sound.createAsync(require('../assets/sounds/complete.wav'));
    completeSound = complete.sound;

    const err = await Audio.Sound.createAsync(require('../assets/sounds/error.wav'));
    errorSound = err.sound;
  } catch (e) {
    // Sounds will just be silent if loading fails
  }
}

async function play(sound) {
  if (!enabled || !sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (e) {}
}

export function playTapSound() { play(tapSound); }
export function playCollectSound() { play(collectSound); }
export function playCompleteSound() { play(completeSound); }
export function playErrorSound() { play(errorSound); }

export async function unloadSounds() {
  try {
    if (tapSound) await tapSound.unloadAsync();
    if (collectSound) await collectSound.unloadAsync();
    if (completeSound) await completeSound.unloadAsync();
    if (errorSound) await errorSound.unloadAsync();
  } catch (e) {}
}
