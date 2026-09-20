/**
 * Sesi soal berjalan (SPEC.md 7.5).
 *
 * Mode: per topik, per kartu, acak, kelemahan, dan simulasi. Mode simulasi
 * memakai timer mundur dan menahan kunci jawaban sampai sesi berakhir.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { QuestionCard } from '@/components/QuestionCard';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getAllTopics, getCard, getCardContext } from '@/lib/content';
import {
  getSeenCardIds,
  getTopicCardIds,
  getWeakCardIds,
  recordAnswer,
  saveErrorReason,
} from '@/lib/progress';
import { radius, spacing } from '@/lib/theme';
import type { ErrorReason, Question } from '@/lib/types';

const ACAK_COUNT = 10;
const SIMULASI_COUNT = 20;
/** 90 detik per soal terasa pas untuk 20 soal setara UTBK. */
const SIMULASI_SECONDS = SIMULASI_COUNT * 90;

type Mode = 'topik' | 'kartu' | 'acak' | 'lemah' | 'simulasi';

interface Item {
  question: Question;
  cardId: string;
}

/** Acak urutan tanpa mengubah array asal. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a !== undefined && b !== undefined) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy;
}

function itemsFromCards(cardIds: string[]): Item[] {
  const items: Item[] = [];
  for (const cardId of cardIds) {
    const card = getCard(cardId);
    if (!card) continue;
    for (const question of card.questions) {
      items.push({ question, cardId });
    }
  }
  return items;
}

function allItems(): Item[] {
  return itemsFromCards(
    getAllTopics().flatMap((t) => t.cards.map((c) => c.id))
  );
}

interface Result {
  question: Question;
  cardId: string;
  correct: boolean;
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SesiLatihan() {
  const params = useLocalSearchParams<{
    mode?: string;
    topicId?: string;
    cardId?: string;
  }>();
  const theme = useTheme();

  const mode = (params.mode ?? 'acak') as Mode;
  const isSimulation = mode === 'simulasi';

  const [items, setItems] = useState<Item[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(SIMULASI_SECONDS);
  const startedAt = useRef(Date.now());

  // Susun daftar soal sesuai mode.
  useEffect(() => {
    let active = true;

    const build = async (): Promise<Item[]> => {
      switch (mode) {
        case 'kartu':
          return params.cardId ? itemsFromCards([params.cardId]) : [];
        case 'topik':
          return params.topicId ? itemsFromCards(getTopicCardIds(params.topicId)) : [];
        case 'lemah':
          return itemsFromCards(await getWeakCardIds());
        case 'simulasi':
          return shuffle(allItems()).slice(0, SIMULASI_COUNT);
        case 'acak':
        default: {
          const seen = await getSeenCardIds();
          // Belum ada yang dibuka: ambil dari seluruh materi supaya sesi
          // acak tetap bisa dimulai sejak hari pertama.
          const pool = seen.length > 0 ? itemsFromCards(seen) : allItems();
          return shuffle(pool).slice(0, ACAK_COUNT);
        }
      }
    };

    build()
      .then((built) => {
        if (active) {
          setItems(built);
          startedAt.current = Date.now();
        }
      })
      .catch(() => {
        if (active) setItems([]);
      });

    return () => {
      active = false;
    };
  }, [mode, params.cardId, params.topicId]);

  // Timer mundur khusus mode simulasi.
  useEffect(() => {
    if (!isSimulation || finished || items == null) return;
    const id = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          clearInterval(id);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isSimulation, finished, items]);

  const onAnswered = useCallback(
    (correct: boolean, seconds: number) => {
      const item = items?.[current];
      if (!item) return;
      setResults((prev) => [
        ...prev,
        { question: item.question, cardId: item.cardId, correct },
      ]);
      void recordAnswer({
        questionId: item.question.id,
        cardId: item.cardId,
        correct,
        seconds,
      }).catch(() => {
        // Gagal menyimpan tidak boleh menghentikan sesi belajar.
      });
    },
    [current, items]
  );

  const onErrorReason = useCallback(
    (reason: ErrorReason) => {
      const item = items?.[current];
      if (!item) return;
      void saveErrorReason({
        questionId: item.question.id,
        cardId: item.cardId,
        reason,
      }).catch(() => {
        // idem
      });
    },
    [current, items]
  );

  const onNext = useCallback(() => {
    if (items == null) return;
    if (current + 1 >= items.length) setFinished(true);
    else setCurrent((i) => i + 1);
  }, [current, items]);

  const title = useMemo(() => {
    switch (mode) {
      case 'topik':
        return 'Latihan topik';
      case 'kartu':
        return 'Soal kartu';
      case 'lemah':
        return 'Latihan kelemahan';
      case 'simulasi':
        return 'Simulasi';
      default:
        return 'Latihan acak';
    }
  }, [mode]);

  if (items == null) {
    return (
      <Screen>
        <Header title={title} />
        <View style={styles.center}>
          <Text muted>Menyiapkan soal...</Text>
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <Header title={title} />
        <View style={styles.center}>
          <Text variant="title" weight="700">
            Belum ada soal
          </Text>
          <Text muted style={styles.centerText}>
            {mode === 'lemah'
              ? 'Bagus — belum ada kartu yang ditandai lemah. Kartu masuk ke sini setelah kamu menjawab salah.'
              : 'Belum ada soal yang cocok untuk mode ini.'}
          </Text>
          <Button label="Kembali" icon="arrow-back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    const wrong = results.filter((r) => !r.correct);
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000);
    const percent = results.length
      ? Math.round((correctCount / results.length) * 100)
      : 0;

    return (
      <Screen>
        <Header title="Hasil" subtitle={title} />
        <ScrollView contentContainerStyle={styles.content}>
          <Card accentColor={theme.colors.accent}>
            <Text variant="label" muted weight="600">
              SKOR
            </Text>
            <Text variant="title" weight="700" style={styles.score}>
              {correctCount} dari {results.length} benar ({percent}%)
            </Text>
            <Text muted variant="label">
              Waktu {formatClock(elapsed)}
              {results.length < items.length
                ? ` · ${items.length - results.length} soal tidak terjawab`
                : ''}
            </Text>
          </Card>

          {wrong.length > 0 ? (
            <>
              <Text variant="label" muted weight="600">
                PERLU DIULANG
              </Text>
              {wrong.map((r) => {
                const context = getCardContext(r.cardId);
                return (
                  <Card
                    key={r.question.id}
                    onPress={() => router.push(`/kartu/${r.cardId}`)}
                    accessibilityLabel="Buka kartu materi soal ini"
                  >
                    <Text weight="600" numberOfLines={2}>
                      {context?.card.title ?? r.cardId}
                    </Text>
                    <Text variant="label" muted numberOfLines={2} style={styles.gap}>
                      {r.question.prompt}
                    </Text>
                    <Text variant="label" color={theme.colors.accent} style={styles.gap}>
                      Buka kartunya →
                    </Text>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card raised accentColor={theme.colors.correct}>
              <Text weight="600" color={theme.colors.correct}>
                Semua benar
              </Text>
              <Text muted variant="label" style={styles.gap}>
                Tidak ada yang perlu diulang dari sesi ini.
              </Text>
            </Card>
          )}

          <Button
            label="Selesai"
            icon="checkmark"
            block
            onPress={() => router.back()}
          />
        </ScrollView>
      </Screen>
    );
  }

  const item = items[current];
  if (!item) return null;

  return (
    <Screen>
      <Header
        title={title}
        subtitle={`${current + 1} / ${items.length}${
          isSimulation ? ` · ${formatClock(remaining)}` : ''
        }`}
      />

      {/* Bilah kemajuan */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.surface }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor:
                isSimulation && remaining < 60
                  ? theme.colors.wrong
                  : theme.colors.accent,
              width: `${((current + 1) / items.length) * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <QuestionCard
          key={item.question.id}
          question={item.question}
          deferFeedback={isSimulation}
          onAnswered={onAnswered}
          onErrorReason={isSimulation ? undefined : onErrorReason}
          onNext={onNext}
          nextLabel={current + 1 >= items.length ? 'Lihat hasil' : 'Lanjut'}
        />
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
  score: {
    marginVertical: spacing.xs,
  },
  gap: {
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 4,
    marginHorizontal: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
