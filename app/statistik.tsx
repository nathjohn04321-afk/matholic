/**
 * Progres & statistik (SPEC.md 7.9).
 *
 * Heatmap memakai tangga sekuensial satu hue (lib/theme.ts): makin pekat
 * berarti makin banyak soal dikerjakan hari itu. Akurasi per topik dipakai
 * batang mendatar dengan label langsung — satu deret, jadi tidak perlu legenda
 * warna untuk membedakan seri.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import {
  computeStreak,
  getAccuracyByTopic,
  getDailyActivity,
  getOverallStats,
  type DayActivity,
  type OverallStats,
  type TopicAccuracy,
} from '@/lib/progress';
import { spacing } from '@/lib/theme';

const DAYS = 90;
const ROWS = 7;
const CELL = 12;
const CELL_GAP = 2;

/** Petakan jumlah soal per hari ke indeks tangga warna. */
function heatIndex(attempts: number): number {
  if (attempts === 0) return 0;
  if (attempts <= 2) return 1;
  if (attempts <= 5) return 2;
  if (attempts <= 10) return 3;
  return 4;
}

export default function Statistik() {
  const theme = useTheme();
  const [activity, setActivity] = useState<DayActivity[] | null>(null);
  const [accuracy, setAccuracy] = useState<TopicAccuracy[]>([]);
  const [overall, setOverall] = useState<OverallStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getDailyActivity(DAYS),
        getAccuracyByTopic(),
        getOverallStats(),
      ])
        .then(([days, acc, all]) => {
          if (!active) return;
          setActivity(days);
          setAccuracy(acc);
          setOverall(all);
        })
        .catch(() => {
          if (active) setActivity([]);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  if (activity == null || overall == null) {
    return (
      <Screen>
        <Header title="Statistik" />
        <View style={styles.center}>
          <Text muted>Memuat...</Text>
        </View>
      </Screen>
    );
  }

  const streak = computeStreak(activity);

  // Susun jadi kolom minggu supaya kisinya terbaca seperti kalender.
  const columns: DayActivity[][] = [];
  for (let i = 0; i < activity.length; i += ROWS) {
    columns.push(activity.slice(i, i + ROWS));
  }

  return (
    <Screen>
      <Header title="Statistik" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Angka utama — bukan grafik, cukup ditulis besar */}
        <View style={styles.tiles}>
          <Card raised style={styles.tile}>
            <Text variant="label" muted weight="600">
              DIKUASAI
            </Text>
            <Text variant="title" weight="700">
              {overall.mastered}
              <Text muted variant="label">
                {' '}
                / {overall.totalCards}
              </Text>
            </Text>
          </Card>
          <Card raised style={styles.tile}>
            <Text variant="label" muted weight="600">
              RENTETAN
            </Text>
            <Text variant="title" weight="700">
              {streak}
              <Text muted variant="label"> hari</Text>
            </Text>
          </Card>
          <Card raised style={styles.tile}>
            <Text variant="label" muted weight="600">
              AKURASI
            </Text>
            <Text variant="title" weight="700">
              {overall.accuracy}
              <Text muted variant="label">%</Text>
            </Text>
          </Card>
          <Card raised style={styles.tile}>
            <Text variant="label" muted weight="600">
              SOAL DIKERJAKAN
            </Text>
            <Text variant="title" weight="700">
              {overall.attempts}
            </Text>
          </Card>
        </View>

        {/* Heatmap 90 hari */}
        <Card>
          <Text weight="600">Aktivitas {DAYS} hari terakhir</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.heatScroll}
          >
            <View style={styles.heatGrid}>
              {columns.map((week, wi) => (
                <View key={wi} style={styles.heatColumn}>
                  {week.map((day) => (
                    <View
                      key={day.date}
                      accessible
                      accessibilityLabel={`${day.date}: ${day.attempts} soal`}
                      style={[
                        styles.heatCell,
                        { backgroundColor: theme.heat[heatIndex(day.attempts)] },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Legenda tangga sekuensial */}
          <View style={styles.legend}>
            <Text variant="label" muted>
              Sedikit
            </Text>
            {theme.heat.map((color, i) => (
              <View
                key={i}
                style={[styles.heatCell, { backgroundColor: color }]}
              />
            ))}
            <Text variant="label" muted>
              Banyak
            </Text>
          </View>
        </Card>

        {/* Akurasi per topik — batang mendatar dengan label langsung */}
        <Card>
          <Text weight="600">Akurasi per topik</Text>
          {accuracy.length === 0 ? (
            <Text muted variant="label" style={styles.gap}>
              Belum ada soal yang dikerjakan. Selesaikan satu sesi latihan dulu.
            </Text>
          ) : (
            <View style={styles.bars}>
              {accuracy.map((topic) => (
                <View key={topic.topicId} style={styles.barRow}>
                  <View style={styles.barHead}>
                    <Text variant="label" numberOfLines={1} style={styles.barLabel}>
                      {topic.title}
                    </Text>
                    <Text variant="label" muted>
                      {topic.percent}% · {topic.attempts} soal
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${topic.percent}%`,
                          backgroundColor:
                            topic.percent >= 70
                              ? theme.colors.correct
                              : topic.percent >= 40
                                ? theme.colors.warning
                                : theme.colors.wrong,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: spacing.md,
    gap: spacing.xs,
  },
  heatScroll: {
    marginTop: spacing.md,
  },
  heatGrid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  heatColumn: {
    gap: CELL_GAP,
  },
  heatCell: {
    width: CELL,
    height: CELL,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CELL_GAP,
    marginTop: spacing.md,
  },
  gap: {
    marginTop: spacing.xs,
  },
  bars: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  barRow: {
    gap: spacing.xs,
  },
  barHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barLabel: {
    flex: 1,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
