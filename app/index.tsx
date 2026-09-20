/**
 * Beranda (SPEC.md 7.1).
 */

import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { usePreferences, useTheme } from '@/components/ThemeProvider';
import { getAllTopics, getContentStats } from '@/lib/content';
import { countDueCards } from '@/lib/db';
import { getTrackProgress, type TrackProgress } from '@/lib/progress';
import { spacing } from '@/lib/theme';
import { TRACKS, type Track } from '@/lib/types';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

function tanggalPanjang(date: Date): string {
  const hari = HARI[date.getDay()] ?? '';
  const bulan = BULAN[date.getMonth()] ?? '';
  return `${hari}, ${date.getDate()} ${bulan} ${date.getFullYear()}`;
}

const NAMA_JALUR: Record<Track, string> = {
  dasar: 'Dasar',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
  olimpiade: 'Olimpiade',
};

export default function Beranda() {
  const theme = useTheme();
  const { preferences } = usePreferences();
  const stats = getContentStats();
  const today = new Date();

  const [due, setDue] = useState<number | null>(null);
  const [progress, setProgress] = useState<Record<Track, TrackProgress> | null>(
    null
  );

  const cardIdsByTrack = useMemo(() => {
    const map = {} as Record<Track, string[]>;
    for (const track of TRACKS) map[track] = [];
    for (const topic of getAllTopics()) {
      map[topic.track].push(...topic.cards.map((c) => c.id));
    }
    return map;
  }, []);

  // Angka diperbarui tiap kali beranda dibuka, karena sesi lain mengubahnya.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      countDueCards()
        .then((n) => {
          if (active) setDue(n);
        })
        .catch(() => {
          if (active) setDue(0);
        });
      getTrackProgress(cardIdsByTrack)
        .then((p) => {
          if (active) setProgress(p);
        })
        .catch(() => {
          // biarkan kosong; angka progres tidak kritis
        });
      return () => {
        active = false;
      };
    }, [cardIdsByTrack])
  );

  const adaJatuhTempo = (due ?? 0) > 0;

  return (
    <Screen>
      <Header title="MathDeck" subtitle={tanggalPanjang(today)} showBack={false} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card accentColor={theme.colors.accent}>
          <Text variant="label" muted weight="600">
            REVIEW HARI INI
          </Text>
          <Text variant="title" weight="700" style={styles.reviewCount}>
            {due == null
              ? 'Menghitung...'
              : adaJatuhTempo
                ? `${due} kartu menunggu`
                : 'Tidak ada yang perlu diulang'}
          </Text>
          <Text muted style={styles.reviewNote}>
            {adaJatuhTempo
              ? 'Kartu jatuh tempo didahulukan sebelum materi baru.'
              : `Lanjut materi baru? Tersedia ${stats.topics} topik, ${stats.cards} kartu, dan ${stats.questions} soal.`}
          </Text>
          <Link href="/review" asChild>
            <Button
              label={adaJatuhTempo ? 'Mulai review' : 'Buka review'}
              icon="play"
              block
              style={styles.cta}
            />
          </Link>
        </Card>

        <View style={styles.section}>
          <Text variant="label" muted weight="600">
            PROGRES JALUR
          </Text>
          <View style={styles.trackRow}>
            {TRACKS.map((track) => {
              const p = progress?.[track];
              const percent = p?.percent ?? 0;
              const total = cardIdsByTrack[track].length;
              return (
                <Card key={track} raised style={styles.trackCard}>
                  <Text variant="label" weight="600" numberOfLines={1}>
                    {NAMA_JALUR[track]}
                  </Text>
                  <Text variant="label" muted>
                    {total === 0 ? 'Belum ada materi' : `${percent}% dikuasai`}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: theme.colors.correct,
                          width: `${percent}%`,
                        },
                      ]}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" muted weight="600">
            AKSES CEPAT
          </Text>
          <Button
            label="Belajar"
            icon="library-outline"
            variant="sekunder"
            block
            onPress={() => router.push('/belajar')}
          />
          <Button
            label="Latihan acak"
            icon="shuffle-outline"
            variant="sekunder"
            block
            onPress={() =>
              router.push({ pathname: '/latihan/sesi', params: { mode: 'acak' } })
            }
          />
          <Button
            label="Buku kesalahan"
            icon="bookmark-outline"
            variant="sekunder"
            block
            onPress={() => router.push('/kesalahan')}
          />
          <Button
            label="Cari"
            icon="search-outline"
            variant="sekunder"
            block
            onPress={() => router.push('/cari')}
          />
          <Button
            label="Statistik"
            icon="stats-chart-outline"
            variant="sekunder"
            block
            onPress={() => router.push('/statistik')}
          />
          <Button
            label="Pengaturan"
            icon="settings-outline"
            variant="sekunder"
            block
            onPress={() => router.push('/pengaturan')}
          />
        </View>

        <Text variant="label" muted style={styles.footer}>
          Kartu baru per hari: {preferences.newCardsPerDay}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  reviewCount: {
    marginTop: spacing.xs,
  },
  reviewNote: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  trackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  trackCard: {
    flexGrow: 1,
    flexBasis: '46%',
    padding: spacing.md,
    gap: spacing.xs,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    textAlign: 'center',
  },
});
