/**
 * Preferensi tampilan + tema aktif.
 *
 * Preferensi disimpan di AsyncStorage (SPEC.md bagian 3); progres belajar
 * tetap di SQLite. Disediakan lewat Context, tanpa Redux (SPEC.md bagian 3).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  buildTheme,
  type ColorSchemeName,
  type FontScaleName,
  type Theme,
} from '@/lib/theme';

const STORAGE_KEY = 'mathdeck.preferensi';

/** Pilihan tema di layar Pengaturan (SPEC.md 7.10). */
export type ThemeMode = 'terang' | 'gelap' | 'sistem';

export interface Preferences {
  themeMode: ThemeMode;
  fontScale: FontScaleName;
  /** Jumlah kartu baru per hari (SPEC.md bagian 9). */
  newCardsPerDay: number;
}

const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'gelap',
  fontScale: 'sedang',
  newCardsPerDay: 10,
};

interface ThemeContextValue {
  theme: Theme;
  preferences: Preferences;
  /** False sampai preferensi tersimpan selesai dibaca. */
  ready: boolean;
  setPreferences: (patch: Partial<Preferences>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'terang' || value === 'gelap' || value === 'sistem';
}

function isFontScale(value: unknown): value is FontScaleName {
  return value === 'kecil' || value === 'sedang' || value === 'besar';
}

/** Baca preferensi tersimpan, abaikan nilai yang tidak dikenal. */
function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_PREFERENCES;
    }
    const value = parsed as Record<string, unknown>;
    return {
      themeMode: isThemeMode(value.themeMode)
        ? value.themeMode
        : DEFAULT_PREFERENCES.themeMode,
      fontScale: isFontScale(value.fontScale)
        ? value.fontScale
        : DEFAULT_PREFERENCES.fontScale,
      newCardsPerDay:
        typeof value.newCardsPerDay === 'number' &&
        Number.isFinite(value.newCardsPerDay) &&
        value.newCardsPerDay > 0
          ? Math.floor(value.newCardsPerDay)
          : DEFAULT_PREFERENCES.newCardsPerDay,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferencesState] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) setPreferencesState(parsePreferences(raw));
      })
      .catch(() => {
        // Preferensi gagal dibaca bukan alasan menahan aplikasi; pakai default.
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferencesState((current) => {
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // Simpan gagal: preferensi tetap berlaku untuk sesi ini.
      });
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorSchemeName =
      preferences.themeMode === 'sistem'
        ? systemScheme === 'light'
          ? 'light'
          : 'dark'
        : preferences.themeMode === 'terang'
          ? 'light'
          : 'dark';

    return {
      theme: buildTheme(scheme, preferences.fontScale),
      preferences,
      ready,
      setPreferences,
    };
  }, [preferences, ready, setPreferences, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme harus dipakai di dalam <ThemeProvider>.');
  }
  return context;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function usePreferences(): {
  preferences: Preferences;
  ready: boolean;
  setPreferences: (patch: Partial<Preferences>) => void;
} {
  const { preferences, ready, setPreferences } = useThemeContext();
  return { preferences, ready, setPreferences };
}
