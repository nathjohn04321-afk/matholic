/**
 * Daftar kartu yang ditandai (SPEC.md bagian 11, milestone 5).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getCardContext } from '@/lib/content';
import { getBookmarks, toggleBookmark } from '@/lib/db';
import { CARD_TYPE_LABEL, spacing } from '@/lib/theme';

export default function BookmarkLayar() {
  const theme = useTheme();
  const [ids, setIds] = useState<string[] | null>(null);

  const load = useCallback(() => {
    let active = true;
    getBookmarks()
      .then((rows) => {
        if (active) setIds(rows.map((r) => r.cardId));
      })
      .catch(() => {
        if (active) setIds([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  const remove = (cardId: string) => {
    setIds((prev) => prev?.filter((id) => id !== cardId) ?? prev);
    void toggleBookmark(cardId).catch(load);
  };

  if (ids == null) {
    return (
      <Screen>
        <Header title="Bookmark" />
        <View style={styles.center}>
          <Text muted>Memuat...</Text>
        </View>
      </Screen>
    );
  }

  if (ids.length === 0) {
    return (
      <Screen>
        <Header title="Bookmark" />
        <View style={styles.center}>
          <Ionicons
            name="bookmark-outline"
            size={44}
            color={theme.colors.textMuted}
          />
          <Text variant="title" weight="700">
            Belum ada bookmark
          </Text>
          <Text muted style={styles.centerText}>
            Ketuk ikon bookmark di pojok kanan atas saat membaca kartu untuk
            menyimpannya di sini.
          </Text>
          <Button
            label="Ke daftar materi"
            icon="library-outline"
            onPress={() => router.push('/belajar')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Bookmark" subtitle={`${ids.length} kartu`} />
      <ScrollView contentContainerStyle={styles.content}>
        {ids.map((cardId) => {
          const context = getCardContext(cardId);
          return (
            <Card key={cardId}>
              <Text variant="label" muted weight="600">
                {context
                  ? `${context.topic.title.toUpperCase()} · ${CARD_TYPE_LABEL[context.card.type].toUpperCase()}`
                  : 'KARTU'}
              </Text>
              <Text weight="600" style={styles.gap}>
                {context?.card.title ?? cardId}
              </Text>
              <View style={styles.actions}>
                <Button
                  label="Buka"
                  icon="book-outline"
                  variant="sekunder"
                  style={styles.action}
                  onPress={() => router.push(`/kartu/${cardId}`)}
                />
                <Button
                  label="Hapus"
                  icon="bookmark"
                  variant="hantu"
                  style={styles.action}
                  onPress={() => remove(cardId)}
                />
              </View>
            </Card>
          );
        })}
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
    gap: spacing.md,
    padding: spacing.xl,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 320,
  },
  gap: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
});
