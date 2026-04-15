import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { GameProvider, useGame } from './src/context/GameContext';
import AppNavigator from './src/navigation/AppNavigator';
import { preloadSounds, setSoundsEnabled } from './src/utils/sounds';
import { setHapticsEnabled } from './src/utils/haptics';

function AppContent() {
  const { isDark } = useTheme();
  const { soundEnabled, hapticEnabled } = useGame();

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    setSoundsEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setHapticsEnabled(hapticEnabled);
  }, [hapticEnabled]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
