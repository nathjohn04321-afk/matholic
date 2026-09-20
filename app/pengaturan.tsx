/**
 * Pengaturan (SPEC.md 7.10).
 *
 * Milestone 1 mengaktifkan tema dan ukuran font supaya sistem tema bisa
 * diuji langsung. Ekspor progres dan reset progres diisi milestone 5.
 */

import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { usePreferences, type ThemeMode } from '@/components/ThemeProvider';
import { spacing } from '@/lib/theme';
import type { FontScaleName } from '@/lib/theme';

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

export default function Pengaturan() {
  const { preferences, setPreferences } = usePreferences();

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
          <Text weight="600">Alat pengembang</Text>
          <Text muted variant="label" style={styles.sample}>
            Layar uji untuk memeriksa render rumus dan kemulusan scroll.
          </Text>
          <View style={styles.control}>
            <Button
              label="Uji render matematika"
              icon="flask-outline"
              variant="sekunder"
              block
              onPress={() => router.push('/uji-matematika')}
            />
          </View>
        </Card>

        <Card>
          <Text weight="600">Kartu baru per hari</Text>
          <Text variant="title" weight="700" style={styles.value}>
            {preferences.newCardsPerDay}
          </Text>
          <Text muted variant="label">
            Pengatur jumlah dan ekspor/reset progres diisi pada milestone 5.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  control: {
    marginTop: spacing.md,
  },
  sample: {
    marginTop: spacing.md,
  },
  value: {
    marginTop: spacing.xs,
  },
});
