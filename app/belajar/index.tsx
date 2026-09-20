/**
 * Pilih jalur & topik (SPEC.md 7.2).
 *
 * Topik yang prasyaratnya belum selesai tetap bisa dibuka — hanya diberi
 * catatan halus, tidak dikunci.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getTopicsByTrack, getTopicTitle } from '@/lib/content';
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
  const topics = useMemo(() => getTopicsByTrack(active), [active]);

  return (
    <Screen>
      <Header title="Belajar" />

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
                  backgroundColor: selected ? theme.colors.accentSoft : 'transparent',
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
        {topics.length === 0 ? (
          <Card>
            <Text weight="600">Jalur {NAMA_JALUR[active]} belum terisi</Text>
            <Text muted style={styles.gap}>
              Materi jalur ini ditulis pada milestone 6. Jalur Menengah sudah
              punya tiga topik yang bisa dibaca sekarang.
            </Text>
          </Card>
        ) : (
          topics.map((topic) => (
            <Card
              key={topic.id}
              onPress={() => router.push(`/belajar/${topic.id}`)}
              accessibilityLabel={`Buka topik ${topic.title}`}
            >
              <Text weight="600">{topic.title}</Text>
              <Text muted variant="label" style={styles.gap}>
                {topic.summary}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="layers-outline"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <Text variant="label" muted>
                    {topic.cardCount} kartu
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <Text variant="label" muted>
                    {topic.questionCount} soal
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <Text variant="label" muted>
                    {topic.estimatedMinutes} menit
                  </Text>
                </View>
              </View>

              {topic.prerequisites.length > 0 && (
                <Text variant="label" muted style={styles.prereq}>
                  Disarankan selesaikan{' '}
                  {topic.prerequisites.map(getTopicTitle).join(', ')} dulu.
                </Text>
              )}
            </Card>
          ))
        )}
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
  gap: {
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prereq: {
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
