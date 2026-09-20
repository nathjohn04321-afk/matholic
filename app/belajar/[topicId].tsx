/**
 * Daftar kartu dalam satu topik (SPEC.md 7.3).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getTopic } from '@/lib/content';
import { CARD_TYPE_ICON, CARD_TYPE_LABEL, spacing } from '@/lib/theme';

export default function DaftarKartu() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const theme = useTheme();
  const topic = useMemo(() => getTopic(topicId ?? ''), [topicId]);

  if (!topic) {
    return (
      <Screen>
        <Header title="Topik" />
        <View style={styles.empty}>
          <Text variant="title" weight="700">
            Topik tidak ditemukan
          </Text>
          <Text muted style={styles.gap}>
            Topik dengan id &quot;{topicId}&quot; tidak ada di dalam aplikasi.
          </Text>
        </View>
      </Screen>
    );
  }

  const firstCardId = topic.cards[0]?.id;

  return (
    <Screen>
      <Header title={topic.title} subtitle={`${topic.cards.length} kartu`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text>{topic.summary}</Text>
          {firstCardId != null && (
            <Button
              label="Mulai dari awal"
              icon="play"
              block
              style={styles.cta}
              onPress={() => router.push(`/kartu/${firstCardId}`)}
            />
          )}
        </Card>

        {topic.cards.map((card, i) => (
          <Card
            key={card.id}
            onPress={() => router.push(`/kartu/${card.id}`)}
            accessibilityLabel={`Buka kartu ${card.title}`}
          >
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: theme.colors.accentSoft },
                ]}
              >
                <Ionicons
                  name={
                    CARD_TYPE_ICON[card.type] as keyof typeof Ionicons.glyphMap
                  }
                  size={18}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.cardBody}>
                <Text variant="label" muted weight="600">
                  {i + 1} · {CARD_TYPE_LABEL[card.type].toUpperCase()}
                </Text>
                <Text weight="600" style={styles.cardTitle}>
                  {card.title}
                </Text>
                <Text variant="label" muted>
                  {card.questions.length} soal
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textMuted}
              />
            </View>
          </Card>
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  gap: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    marginBottom: 2,
  },
});
