import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type Palette, type ThemeMode } from './tokens';

const KEY = 'lbaraka-theme-mode';

interface Theme {
  mode: ThemeMode;
  dark: boolean;
  c: Palette;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const Ctx = createContext<Theme>({
  mode: 'light',
  dark: false,
  c: palettes.light,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      } else {
        const sys = Appearance.getColorScheme();
        setModeState(sys === 'dark' ? 'dark' : 'light');
      }
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<Theme>(
    () => ({
      mode,
      dark: mode === 'dark',
      c: palettes[mode],
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
