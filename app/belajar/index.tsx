/**
 * Pilih jalur & topik (SPEC.md 7.2).
 * Daftar topik nyata diisi milestone 3 lewat lib/content.ts.
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';
import { TRACKS, type Track } from '@/lib/types';

const NAMA_JALUR: Record<Track, string> = {
  dasar: 'Dasar',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
  olimpiade: 'Olimpiade',
};

export default function Belajar() {
  const theme = useTheme();
  const [active, setActive] = useState<Track>('menengah');

  return (
    <Screen>
      <Header title="Belajar" />

      {/* Tab 4 jalur */}
      <View style={styles.tabs}>
        {TRACKS.map((track) => {
          const selected = track === active;
          return (
            <Pressable
              key={track}
              onPress={() => setActive(track)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.tab,
                {
                  backgroundColor: selected
                    ? theme.colors.accentSoft
                    : 'transparent',
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                variant="label"
                weight={selected ? '700' : '400'}
                color={selected ? theme.colors.accent : theme.colors.textMuted}
              >
                {NAMA_JALUR[track]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text weight="600">Jalur {NAMA_JALUR[active]}</Text>
          <Text muted style={styles.note}>
            Daftar topik diisi pada milestone 3. Rangka navigasi sudah bisa
            dicoba lewat topik contoh di bawah.
          </Text>
        </Card>

        <Card
          onPress={() => router.push('/belajar/alj-nilai-mutlak')}
          accessibilityLabel="Buka topik contoh"
        >
          <Text weight="600">Topik contoh</Text>
          <Text variant="label" muted>
            Buka daftar kartu →
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET - 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.xs,
  },
});
