/**
 * Pengaturan (SPEC.md 7.10).
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { usePreferences, useTheme, type ThemeMode } from '@/components/ThemeProvider';
import { getContentStats } from '@/lib/content';
import { exportProgress, resetProgress } from '@/lib/export';
import { spacing, type FontScaleName } from '@/lib/theme';

const MODE_TEMA: { value: ThemeMode; label: string }[] = [
  { value: 'terang', label: 'Terang' },
  { value: 'gelap', label: 'Gelap' },
  { value: 'sistem', label: 'Sistem' },
];

const UKURAN_FONT: { value: FontScaleName; label: string }[] = [
  { value: 'kecil', label: 'Kecil' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'besar', label: 'Besar' },
];

const KARTU_BARU = [5, 10, 15, 20, 30];

export default function Pengaturan() {
  const theme = useTheme();
  const { preferences, setPreferences } = usePreferences();
  const stats = getContentStats();

  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  /** Reset butuh konfirmasi dua langkah (SPEC.md 7.10). */
  const [resetArmed, setResetArmed] = useState(false);

  const onExport = () => {
    setExporting(true);
    setExportNote(null);
    exportProgress()
      .then((result) => {
        setExportNote(
          result.shared
            ? `${result.fileName} siap dibagikan.`
            : `Tersimpan sebagai ${result.fileName}.`
        );
      })
      .catch((error: unknown) => {
        setExportNote(
          `Gagal mengekspor: ${error instanceof Error ? error.message : String(error)}`
        );
      })
      .finally(() => setExporting(false));
  };

  const onReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    resetProgress()
      .then(() => {
        setResetArmed(false);
        Alert.alert(
          'Progres dihapus',
          'Semua riwayat belajar, jadwal review, bookmark, dan Buku Kesalahan sudah dikosongkan.'
        );
      })
      .catch((error: unknown) => {
        Alert.alert(
          'Gagal menghapus',
          error instanceof Error ? error.message : String(error)
        );
      });
  };

  return (
    <Screen>
      <Header title="Pengaturan" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text weight="600">Tema</Text>
          <View style={styles.control}>
            <SegmentedControl
              options={MODE_TEMA}
              value={preferences.themeMode}
              onChange={(themeMode) => setPreferences({ themeMode })}
              accessibilityLabel="Pilih tema"
            />
          </View>
        </Card>

        <Card>
          <Text weight="600">Ukuran font</Text>
          <View style={styles.control}>
            <SegmentedControl
              options={UKURAN_FONT}
              value={preferences.fontScale}
              onChange={(fontScale) => setPreferences({ fontScale })}
              accessibilityLabel="Pilih ukuran font"
            />
          </View>
          <Text muted style={styles.sample}>
            Contoh: turunan fungsi naik ketika gradien garis singgungnya positif.
          </Text>
        </Card>

        <Card>
          <Text weight="600">Kartu baru per hari</Text>
          <Text muted variant="label" style={styles.note}>
            Batas kartu yang belum pernah dibuka, diperkenalkan setelah kartu
            jatuh tempo selesai.
          </Text>
          <View style={styles.control}>
            <SegmentedControl
              options={KARTU_BARU.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              value={String(preferences.newCardsPerDay)}
              onChange={(value) =>
                setPreferences({ newCardsPerDay: Number(value) })
              }
              accessibilityLabel="Jumlah kartu baru per hari"
            />
          </View>
        </Card>

        <Card>
          <Text weight="600">Bookmark</Text>
          <Text muted variant="label" style={styles.note}>
            Kartu yang kamu tandai untuk dibaca lagi.
          </Text>
          <Button
            label="Buka daftar bookmark"
            icon="bookmark-outline"
            variant="sekunder"
            block
            style={styles.control}
            onPress={() => router.push('/bookmark')}
          />
        </Card>

        <Card>
          <Text weight="600">Ekspor progres</Text>
          <Text muted variant="label" style={styles.note}>
            Menyimpan seluruh riwayat belajar sebagai berkas JSON yang bisa kamu
            baca sendiri.
          </Text>
          <Button
            label={exporting ? 'Menyiapkan...' : 'Ekspor ke JSON'}
            icon="download-outline"
            variant="sekunder"
            block
            loading={exporting}
            style={styles.control}
            onPress={onExport}
          />
          {exportNote != null && (
            <Text variant="label" muted style={styles.note}>
              {exportNote}
            </Text>
          )}
        </Card>

        <Card accentColor={resetArmed ? theme.colors.wrong : undefined}>
          <Text weight="600">Reset progres</Text>
          <Text muted variant="label" style={styles.note}>
            {resetArmed
              ? 'Yakin? Seluruh riwayat, jadwal review, bookmark, dan Buku Kesalahan akan hilang permanen. Materi tidak terhapus.'
              : 'Menghapus seluruh riwayat belajar. Materi tetap utuh.'}
          </Text>
          <View style={styles.resetRow}>
            <Button
              label={resetArmed ? 'Ya, hapus semuanya' : 'Reset progres'}
              icon={resetArmed ? 'trash' : 'refresh-outline'}
              variant="bahaya"
              style={styles.resetButton}
              onPress={onReset}
            />
            {resetArmed && (
              <Button
                label="Batal"
                variant="sekunder"
                style={styles.resetButton}
                onPress={() => setResetArmed(false)}
              />
            )}
          </View>
        </Card>

        <Card>
          <Text weight="600">Tentang</Text>
          <Text muted variant="label" style={styles.note}>
            MathDeck · {stats.topics} topik, {stats.cards} kartu, {stats.questions}{' '}
            soal. Seluruh materi tersimpan di dalam aplikasi — tidak ada koneksi
            internet yang dipakai.
          </Text>
          <Button
            label="Uji render matematika"
            icon="flask-outline"
            variant="hantu"
            block
            style={styles.control}
            onPress={() => router.push('/uji-matematika')}
          />
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
  control: {
    marginTop: spacing.md,
  },
  note: {
    marginTop: spacing.xs,
  },
  sample: {
    marginTop: spacing.md,
  },
  resetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  resetButton: {
    flex: 1,
  },
});
