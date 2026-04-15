import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext();

const DEFAULT_STATE = {
  completedLevels: {},
  currentLevel: 1,
  totalStars: 0,
  hearts: 5,
  maxHearts: 5,
  soundEnabled: true,
  hapticEnabled: true,
  onboardingDone: false,
};

export function GameProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem('gameState');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      // ignore
    }
    setLoaded(true);
  };

  const saveState = async (newState) => {
    try {
      await AsyncStorage.setItem('gameState', JSON.stringify(newState));
    } catch (e) {
      // ignore
    }
  };

  const completeLevel = useCallback((levelNum, stars) => {
    setState(prev => {
      const existing = prev.completedLevels[levelNum];
      const bestStars = existing ? Math.max(existing.stars, stars) : stars;
      const starDiff = existing ? Math.max(0, stars - existing.stars) : stars;

      const next = {
        ...prev,
        completedLevels: {
          ...prev.completedLevels,
          [levelNum]: { stars: bestStars, completed: true },
        },
        currentLevel: Math.max(prev.currentLevel, levelNum + 1),
        totalStars: prev.totalStars + starDiff,
      };
      saveState(next);
      return next;
    });
  }, []);

  const loseHeart = useCallback(() => {
    setState(prev => {
      const next = { ...prev, hearts: Math.max(0, prev.hearts - 1) };
      saveState(next);
      return next;
    });
  }, []);

  const refillHearts = useCallback(() => {
    setState(prev => {
      const next = { ...prev, hearts: prev.maxHearts };
      saveState(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setState(prev => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      saveState(next);
      return next;
    });
  }, []);

  const toggleHaptic = useCallback(() => {
    setState(prev => {
      const next = { ...prev, hapticEnabled: !prev.hapticEnabled };
      saveState(next);
      return next;
    });
  }, []);

  const finishOnboarding = useCallback(() => {
    setState(prev => {
      const next = { ...prev, onboardingDone: true };
      saveState(next);
      return next;
    });
  }, []);

  const isLevelUnlocked = useCallback((levelNum) => {
    if (levelNum === 1) return true;
    return !!state.completedLevels[levelNum - 1];
  }, [state.completedLevels]);

  const resetProgress = useCallback(async () => {
    const next = { ...DEFAULT_STATE, onboardingDone: true };
    setState(next);
    await saveState(next);
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      loaded,
      completeLevel,
      loseHeart,
      refillHearts,
      toggleSound,
      toggleHaptic,
      finishOnboarding,
      isLevelUnlocked,
      resetProgress,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
