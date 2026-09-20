/**
 * Beranda (SPEC.md 7.1).
 *
 * Milestone 1 memasang rangka dan seluruh jalur navigasi. Angka jatuh
 * tempo, progres jalur, dan "Lanjutkan" diisi pada milestone 3–5.
 */

import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getContentStats } from '@/lib/content';
import { TRACKS } from '@/lib/types';
import { spacing } from '@/lib/theme';

const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

function tanggalPanjang(date: Date): string {
  const hari = HARI[date.getDay()] ?? '';
  const bulan = BULAN[date.getMonth()] ?? '';
  return `${hari}, ${date.getDate()} ${bulan} ${date.getFullYear()}`;
}

const NAMA_JALUR: Record<(typeof TRACKS)[number], string> = {
  dasar: 'Dasar',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
  olimpiade: 'Olimpiade',
};

export default function Beranda() {
  const theme = useTheme();
  const today = new Date();
  const stats = getContentStats();

  return (
    <Screen>
      <Header title="MathDeck" subtitle={tanggalPanjang(today)} showBack={false} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Kartu besar "Review hari ini" (SPEC.md 7.1) */}
        <Card accentColor={theme.colors.accent}>
          <Text variant="label" muted weight="600">
            REVIEW HARI INI
          </Text>
          <Text variant="title" weight="700" style={styles.reviewCount}>
            Belum ada jadwal
          </Text>
          <Text muted style={styles.reviewNote}>
            Jadwal pengulangan mulai terisi setelah kamu membaca kartu pertama.
            Saat ini tersedia {stats.topics} topik, {stats.cards} kartu, dan{' '}
            {stats.questions} soal.
          </Text>
          <Link href="/review" asChild>
            <Button label="Buka review" icon="play" block style={styles.cta} />
          </Link>
        </Card>

        {/* Progres 4 jalur */}
        <View style={styles.section}>
          <Text variant="label" muted weight="600">
            PROGRES JALUR
          </Text>
          <View style={styles.trackRow}>
            {TRACKS.map((track) => (
              <Card key={track} raised style={styles.trackCard}>
                <Text variant="label" weight="600" numberOfLines={1}>
                  {NAMA_JALUR[track]}
                </Text>
                <Text variant="label" muted>
                  0%
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Akses cepat */}
        <View style={styles.section}>
          <Text variant="label" muted weight="600">
            AKSES CEPAT
          </Text>
          <Link href="/belajar" asChild>
            <Button label="Belajar" icon="library-outline" variant="sekunder" block />
          </Link>
          <Link href="/latihan" asChild>
            <Button
              label="Latihan acak"
              icon="shuffle-outline"
              variant="sekunder"
              block
            />
          </Link>
          <Link href="/kesalahan" asChild>
            <Button
              label="Buku kesalahan"
              icon="bookmark-outline"
              variant="sekunder"
              block
            />
          </Link>
          <Link href="/cari" asChild>
            <Button label="Cari" icon="search-outline" variant="sekunder" block />
          </Link>
          <Link href="/statistik" asChild>
            <Button
              label="Statistik"
              icon="stats-chart-outline"
              variant="sekunder"
              block
            />
          </Link>
          <Link href="/pengaturan" asChild>
            <Button
              label="Pengaturan"
              icon="settings-outline"
              variant="sekunder"
              block
            />
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.lg,
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
});
