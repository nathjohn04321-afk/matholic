/**
 * Sesi pengulangan terjadwal (SPEC.md 7.6).
 *
 * Judul kartu ditampilkan lebih dulu — pengguna mencoba mengingat isinya,
 * baru mengetuk untuk membuka. Setelah terbuka, ia menilai diri sendiri dan
 * nilai itu masuk ke algoritma di lib/srs.ts.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MathText } from '@/components/MathText';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { usePreferences, useTheme } from '@/components/ThemeProvider';
import { getCardContext } from '@/lib/content';
import { gradeCard, getTodayQueue } from '@/lib/progress';
import { CARD_TYPE_LABEL, spacing } from '@/lib/theme';
import type { GradeLabel } from '@/lib/types';

const PENILAIAN: { grade: GradeLabel; label: string; icon: string; tone: 'wrong' | 'warning' | 'accent' | 'correct' }[] = [
  { grade: 'lupa', label: 'Lupa', icon: 'close-circle-outline', tone: 'wrong' },
  { grade: 'sulit', label: 'Sulit', icon: 'alert-circle-outline', tone: 'warning' },
  { grade: 'bisa', label: 'Bisa', icon: 'checkmark-circle-outline', tone: 'accent' },
  { grade: 'mudah', label: 'Mudah', icon: 'flash-outline', tone: 'correct' },
];

export default function Review() {
  const theme = useTheme();
  const { preferences } = usePreferences();

  const [queue, setQueue] = useState<string[] | null>(null);
  const [hidden, setHidden] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let active = true;
    getTodayQueue(preferences.newCardsPerDay)
      .then((q) => {
        if (!active) return;
        // Kartu jatuh tempo selalu didahulukan sebelum kartu baru.
        setQueue([...q.due, ...q.fresh]);
        setHidden(q.hiddenBacklog);
      })
      .catch(() => {
        if (active) setQueue([]);
      });
    return () => {
      active = false;
    };
  }, [preferences.newCardsPerDay]);

  const onGrade = useCallback(
    (grade: GradeLabel) => {
      const cardId = queue?.[index];
      if (!cardId) return;
      void gradeCard(cardId, grade).catch(() => {
        // Gagal menyimpan tidak menghentikan sesi.
      });
      setDone((n) => n + 1);
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    [index, queue]
  );

  if (queue == null) {
    return (
      <Screen>
        <Header title="Review" />
        <View style={styles.center}>
          <Text muted>Menyiapkan kartu...</Text>
        </View>
      </Screen>
    );
  }

  const finished = index >= queue.length;

  if (queue.length === 0 || finished) {
    return (
      <Screen>
        <Header title="Review" />
        <View style={styles.center}>
          <Ionicons
            name="checkmark-done-outline"
            size={44}
            color={theme.colors.correct}
          />
          <Text variant="title" weight="700">
            {done > 0 ? 'Sesi selesai' : 'Tidak ada yang perlu diulang'}
          </Text>
          <Text muted style={styles.centerText}>
            {done > 0
              ? `${done} kartu selesai diulang. Jadwal berikutnya sudah disesuaikan.`
              : 'Belum ada kartu yang jatuh tempo hari ini — lanjut materi baru saja.'}
          </Text>
          <Button
            label="Ke daftar materi"
            icon="library-outline"
            onPress={() => router.replace('/belajar')}
          />
        </View>
      </Screen>
    );
  }

  const cardId = queue[index];
  const context = cardId ? getCardContext(cardId) : null;

  if (!context) {
    // Kartu tidak ditemukan (konten berubah) — lewati saja.
    return (
      <Screen>
        <Header title="Review" />
        <View style={styles.center}>
          <Text muted>Kartu tidak ditemukan, melanjutkan...</Text>
          <Button label="Lanjut" onPress={() => setIndex((i) => i + 1)} />
        </View>
      </Screen>
    );
  }

  const { card, topic } = context;

  return (
    <Screen>
      <Header
        title="Review"
        subtitle={`${index + 1} dari ${queue.length}`}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {hidden > 0 && index === 0 && (
          <Card raised>
            <Text variant="label" muted>
              Tunggakanmu cukup banyak, jadi hari ini ditampilkan yang paling
              lama dulu. Sisanya menyusul — tidak perlu dikejar sekaligus.
            </Text>
          </Card>
        )}

        <Card>
          <Text variant="label" muted weight="600">
            {topic.title.toUpperCase()} · {CARD_TYPE_LABEL[card.type].toUpperCase()}
          </Text>
          <Text variant="title" weight="700" style={styles.title}>
            {card.title}
          </Text>

          {!revealed ? (
            <Pressable
              onPress={() => setRevealed(true)}
              accessibilityRole="button"
              accessibilityLabel="Buka isi kartu"
              style={({ pressed }) => [
                styles.reveal,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="eye-outline" size={22} color={theme.colors.accent} />
              <Text color={theme.colors.accent} weight="600">
                Coba ingat dulu, lalu ketuk untuk membuka
              </Text>
            </Pressable>
          ) : (
            <View style={styles.body}>
              <MathText content={card.body} />
            </View>
          )}
        </Card>

        {revealed && card.keyPoints && card.keyPoints.length > 0 && (
          <Card raised accentColor={theme.colors.accent}>
            <Text variant="label" muted weight="600">
              POIN KUNCI
            </Text>
            <View style={styles.points}>
              {card.keyPoints.map((point, i) => (
                <View key={i} style={styles.pointRow}>
                  <Text color={theme.colors.accent}>•</Text>
                  <View style={styles.pointText}>
                    <MathText
                      content={point}
                      fontSize={theme.type.keyPoint.fontSize}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {revealed && (
          <View style={styles.grades}>
            <Text variant="label" muted weight="600">
              SEBERAPA LANCAR TADI?
            </Text>
            <View style={styles.gradeRow}>
              {PENILAIAN.map((p) => (
                <Button
                  key={p.grade}
                  label={p.label}
                  icon={p.icon as never}
                  variant="sekunder"
                  style={styles.gradeButton}
                  onPress={() => onGrade(p.grade)}
                />
              ))}
            </View>
          </View>
        )}
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
  },
  title: {
    marginTop: spacing.xs,
  },
  reveal: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  body: {
    marginTop: spacing.md,
  },
  points: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  pointRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
  },
  grades: {
    gap: spacing.sm,
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gradeButton: {
    flexGrow: 1,
    flexBasis: '45%',
  },
});
