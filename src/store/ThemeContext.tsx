import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import {
  readStorageJson,
  STORAGE_KEYS,
  writeStorageJson,
} from '../services/storage/storageAdapter';
import { CCTheme, LIGHT_THEME, OLED_DARK_THEME } from '../theme/tokens';
import { PlatformOS, ThemeMode } from '../types/collegeConnect';

interface PersistedPrefs {
  themeMode: ThemeMode;
  platformOS: PlatformOS;
}

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedDark: boolean;
  theme: CCTheme;
  platformOS: PlatformOS;
  setThemeMode: (mode: ThemeMode) => void;
  setPlatformOS: (os: PlatformOS) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadInitialPrefs(): PersistedPrefs {
  const prefs = readStorageJson<PersistedPrefs>(STORAGE_KEYS.prefs);
  if (prefs) {
    return {
      themeMode: prefs.themeMode ?? 'system',
      platformOS: prefs.platformOS ?? 'ios',
    };
  }
  const legacy = readStorageJson<PersistedPrefs>(STORAGE_KEYS.legacyMonolith);
  return {
    themeMode: legacy?.themeMode ?? 'system',
    platformOS: legacy?.platformOS ?? 'ios',
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => loadInitialPrefs(), []);
  const rnColorScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>(initial.themeMode);
  const [platformOS, setPlatformOSState] = useState<PlatformOS>(initial.platformOS);
  const [appearanceScheme, setAppearanceScheme] = useState<'light' | 'dark'>(() =>
    (Appearance.getColorScheme() ?? 'light') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark' || colorScheme === 'light') {
        setAppearanceScheme(colorScheme);
      }
    });
    return () => sub?.remove?.();
  }, []);

  const systemScheme =
    rnColorScheme === 'dark' || rnColorScheme === 'light' ? rnColorScheme : appearanceScheme;

  const resolvedDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemScheme === 'dark';

  const theme = useMemo(() => (resolvedDark ? OLED_DARK_THEME : LIGHT_THEME), [resolvedDark]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.bg;
      document.body.style.color = theme.text;
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      writeStorageJson<PersistedPrefs>(STORAGE_KEYS.prefs, { themeMode, platformOS });
    }, 180);
    return () => clearTimeout(timer);
  }, [themeMode, platformOS]);

  const setThemeMode = useCallback((mode: ThemeMode) => setThemeModeState(mode), []);
  const setPlatformOS = useCallback((os: PlatformOS) => setPlatformOSState(os), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedDark,
      theme,
      platformOS,
      setThemeMode,
      setPlatformOS,
    }),
    [themeMode, resolvedDark, theme, platformOS, setThemeMode, setPlatformOS]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
