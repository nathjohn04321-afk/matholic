/**
 * Pilih mode latihan (SPEC.md 7.5).
 */

import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { getAllTopics } from '@/lib/content';
import { spacing } from '@/lib/theme';

const MODE = [
  {
    key: 'acak',
    label: 'Acak — 10 soal',
    icon: 'shuffle-outline',
    note: 'Campuran dari materi yang sudah kamu buka.',
  },
  {
    key: 'lemah',
    label: 'Kelemahan',
    icon: 'alert-circle-outline',
    note: 'Soal dari kartu yang pernah kamu jawab salah.',
  },
  {
    key: 'simulasi',
    label: 'Simulasi — 20 soal',
    icon: 'timer-outline',
    note: 'Ada timer mundur; kunci jawaban baru muncul di akhir.',
  },
] as const;

export default function Latihan() {
  const topics = getAllTopics();

  return (
    <Screen>
      <Header title="Latihan" />
      <ScrollView contentContainerStyle={styles.content}>
        {MODE.map((mode) => (
          <Card key={mode.key}>
            <Text weight="600">{mode.label}</Text>
            <Text muted variant="label" style={styles.note}>
              {mode.note}
            </Text>
            <Button
              label="Mulai"
              icon={mode.icon}
              block
              style={styles.cta}
              onPress={() =>
                router.push({
                  pathname: '/latihan/sesi',
                  params: { mode: mode.key },
                })
              }
            />
          </Card>
        ))}

        <View style={styles.section}>
          <Text variant="label" muted weight="600">
            PER TOPIK
          </Text>
          {topics.length === 0 ? (
            <Card>
              <Text muted>Belum ada topik yang bisa dilatih.</Text>
            </Card>
          ) : (
            topics.map((topic) => (
              <Card
                key={topic.id}
                onPress={() =>
                  router.push({
                    pathname: '/latihan/sesi',
                    params: { mode: 'topik', topicId: topic.id },
                  })
                }
                accessibilityLabel={`Latihan topik ${topic.title}`}
              >
                <Text weight="600">{topic.title}</Text>
                <Text variant="label" muted style={styles.note}>
                  {topic.cards.reduce((n, c) => n + c.questions.length, 0)} soal
                </Text>
              </Card>
            ))
          )}
        </View>
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
  note: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
