import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME, AMOLED_THEME } from '../constants/colors';

const ThemeContext = createContext();

const THEMES = { light: LIGHT_THEME, dark: DARK_THEME, amoled: AMOLED_THEME };

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val && THEMES[val]) setThemeMode(val);
      setLoaded(true);
    });
  }, []);

  const setTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('theme', mode);
  };

  const toggleTheme = async () => {
    const order = ['light', 'dark', 'amoled'];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    await setTheme(next);
  };

  const colors = THEMES[themeMode] || LIGHT_THEME;
  const isDark = themeMode !== 'light';

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggleTheme, setTheme, colors, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
