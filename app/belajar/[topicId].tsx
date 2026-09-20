/**
 * Daftar kartu dalam satu topik (SPEC.md 7.3).
 * Isi nyata dimuat milestone 3.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { spacing } from '@/lib/theme';

export default function DaftarKartu() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();

  return (
    <Screen>
      <Header title="Topik" subtitle={topicId} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card
          onPress={() => router.push('/kartu/alj-nilai-mutlak-c1')}
          accessibilityLabel="Buka kartu contoh"
        >
          <Text weight="600">Kartu contoh</Text>
          <Text variant="label" muted>
            Buka kartu →
          </Text>
        </Card>
        <Placeholder
          icon="layers-outline"
          title="Daftar kartu"
          note="Judul topik, ringkasan, dan daftar kartu diisi pada milestone 3."
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
});
