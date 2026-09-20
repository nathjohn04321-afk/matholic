/**
 * Layout akar: tema, area aman, dan inisialisasi database.
 *
 * Splash ditahan sampai preferensi terbaca dan skema SQLite siap, supaya
 * layar pertama tidak berkedip ganti tema.
 */

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { ThemeProvider, useTheme, usePreferences } from '@/components/ThemeProvider';
import { getDatabase } from '@/lib/db';
import { prepareKatex } from '@/lib/katex';
import { spacing, type Theme } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

type DbState = { status: 'memuat' } | { status: 'siap' } | { status: 'gagal'; message: string };

/**
 * react-navigation memakai temanya sendiri untuk permukaan di luar layar kita
 * (latar navigator, celah saat transisi). Tanpa ini, tema terang bawaannya
 * berkedip abu-abu di balik aplikasi gelap.
 */
function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const theme = useTheme();
  const { ready: prefsReady } = usePreferences();
  const [db, setDb] = useState<DbState>({ status: 'memuat' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setDb({ status: 'memuat' });
    getDatabase()
      .then(() => {
        // Tulis CSS KaTeX ke penyimpanan sekali, sebelum kartu pertama dirender.
        // Kegagalannya tidak fatal: lib/katex.ts jatuh ke mode sisip.
        prepareKatex();
        if (active) setDb({ status: 'siap' });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDb({
          status: 'gagal',
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  const booted = prefsReady && db.status !== 'memuat';

  useEffect(() => {
    if (booted) void SplashScreen.hideAsync();
  }, [booted]);

  if (!booted) {
    // Splash masih tampil; jangan render apa pun yang bisa berkedip.
    return <View style={[styles.root, { backgroundColor: theme.colors.background }]} />;
  }

  if (db.status === 'gagal') {
    return (
      <>
        <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
        <Screen>
          <View style={styles.errorBox}>
            <Text variant="title" weight="700">
              Database gagal dibuka
            </Text>
            <Text muted style={styles.errorDetail}>
              {db.message}
            </Text>
            <Button
              label="Coba lagi"
              icon="refresh"
              onPress={() => setAttempt((n) => n + 1)}
            />
          </View>
        </Screen>
      </>
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          // Header digambar tiap layar lewat components/Header.tsx.
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorDetail: {
    textAlign: 'center',
  },
});
