/**
 * Pilih mode latihan (SPEC.md 7.5).
 * Keempat mode dijalankan pada milestone 4.
 */

import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { spacing } from '@/lib/theme';

const MODE = [
  { key: 'topik', label: 'Per topik', icon: 'list-outline' },
  { key: 'acak', label: 'Acak — 10 soal', icon: 'shuffle-outline' },
  { key: 'lemah', label: 'Kelemahan', icon: 'alert-circle-outline' },
  { key: 'simulasi', label: 'Simulasi — 20 soal', icon: 'timer-outline' },
] as const;

export default function Latihan() {
  return (
    <Screen>
      <Header title="Latihan" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text muted>Pilih mode latihan.</Text>
        {MODE.map((mode) => (
          <Link
            key={mode.key}
            href={{ pathname: '/latihan/sesi', params: { mode: mode.key } }}
            asChild
          >
            <Button label={mode.label} icon={mode.icon} variant="sekunder" block />
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
});
