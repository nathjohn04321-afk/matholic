/**
 * Satu soal beserta alur menjawabnya (SPEC.md 7.5).
 *
 * Alur: tampilkan prompt dan opsi, pengguna memilih, langsung tampilkan
 * benar/salah beserta solusi. Kalau salah, tawarkan penyebab kesalahan untuk
 * disimpan ke Buku Kesalahan.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { hasMath } from '@/lib/markdown';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';
import {
  ERROR_REASON_LABELS,
  ERROR_REASONS,
  hasOptions,
  type ErrorReason,
  type Question,
} from '@/lib/types';

import { Button } from './Button';
import { Card } from './Card';
import { MathText } from './MathText';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';

export interface QuestionCardProps {
  question: Question;
  /** Sembunyikan kunci sampai akhir sesi (mode simulasi). */
  deferFeedback?: boolean;
  onAnswered: (correct: boolean, seconds: number) => void;
  onErrorReason?: (reason: ErrorReason) => void;
  onNext: () => void;
  /** Teks tombol lanjut, misalnya "Selesai" di soal terakhir. */
  nextLabel?: string;
}

/** Samakan bentuk jawaban isian sebelum dibandingkan. */
function normalise(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/["'`]/g, '')
    .replace(/\s*([<>=≤≥,])\s*/g, '$1')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/−/g, '-');
}

function isShortAnswerCorrect(question: Question, input: string): boolean {
  if (question.format !== 'isian') return false;
  const given = normalise(input);
  if (!given) return false;
  const accepted = [question.answer, ...(question.acceptedAnswers ?? [])];
  return accepted.some((a) => normalise(a) === given);
}

/** Teks pendek: pakai <Text> biasa kalau tidak ada LaTeX (SPEC.md bagian 8). */
function Inline({ content, color }: { content: string; color?: string }) {
  const theme = useTheme();
  if (!hasMath(content)) {
    return <Text color={color}>{content}</Text>;
  }
  return <MathText content={content} color={color ?? theme.colors.text} />;
}

export function QuestionCard({
  question,
  deferFeedback = false,
  onAnswered,
  onErrorReason,
  onNext,
  nextLabel = 'Lanjut',
}: QuestionCardProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reasonSaved, setReasonSaved] = useState<ErrorReason | null>(null);
  const startedAt = useRef(Date.now());

  // Soal berganti: kembalikan semua keadaan ke awal.
  useEffect(() => {
    setSelected(null);
    setTyped('');
    setRevealed(false);
    setCorrect(false);
    setShowHint(false);
    setReasonSaved(null);
    startedAt.current = Date.now();
  }, [question.id]);

  const options = useMemo(
    () => (hasOptions(question) ? question.options : []),
    [question]
  );

  const submit = (isCorrect: boolean) => {
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    setCorrect(isCorrect);
    setRevealed(true);
    onAnswered(isCorrect, seconds);
  };

  const chooseOption = (index: number) => {
    if (revealed) return;
    setSelected(index);
    submit(hasOptions(question) && index === question.answerIndex);
  };

  const submitTyped = () => {
    if (revealed || !typed.trim()) return;
    submit(isShortAnswerCorrect(question, typed));
  };

  const feedbackVisible = revealed && !deferFeedback;

  const optionColors = (index: number) => {
    if (!feedbackVisible) {
      return selected === index
        ? { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft }
        : { borderColor: theme.colors.border, backgroundColor: 'transparent' };
    }
    const answerIndex = hasOptions(question) ? question.answerIndex : -1;
    if (index === answerIndex) {
      return {
        borderColor: theme.colors.correct,
        backgroundColor: `${theme.colors.correct}22`,
      };
    }
    if (index === selected) {
      return {
        borderColor: theme.colors.wrong,
        backgroundColor: `${theme.colors.wrong}22`,
      };
    }
    return { borderColor: theme.colors.border, backgroundColor: 'transparent' };
  };

  return (
    <View style={styles.wrapper}>
      <Card>
        <Inline content={question.prompt} />
      </Card>

      {question.format === 'isian' ? (
        <Card>
          <Text variant="label" muted weight="600">
            JAWABANMU
          </Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!revealed}
            placeholder="Tulis jawaban"
            placeholderTextColor={theme.colors.textMuted}
            onSubmitEditing={submitTyped}
            accessibilityLabel="Kolom jawaban"
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: feedbackVisible
                  ? correct
                    ? theme.colors.correct
                    : theme.colors.wrong
                  : theme.colors.border,
                backgroundColor: theme.colors.background,
                fontSize: theme.type.body.fontSize,
              },
            ]}
          />
          {!revealed && (
            <Button
              label="Periksa jawaban"
              icon="checkmark"
              block
              disabled={!typed.trim()}
              style={styles.gap}
              onPress={submitTyped}
            />
          )}
        </Card>
      ) : (
        <View style={styles.options}>
          {options.map((option, index) => {
            const colors = optionColors(index);
            return (
              <Pressable
                key={index}
                onPress={() => chooseOption(index)}
                disabled={revealed}
                accessibilityRole="radio"
                accessibilityState={{ selected: selected === index }}
                style={[styles.option, colors]}
              >
                <View style={styles.optionInner}>
                  <Text weight="600" muted>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <View style={styles.optionBody}>
                    <Inline content={option} />
                  </View>
                  {feedbackVisible &&
                    hasOptions(question) &&
                    index === question.answerIndex && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.correct}
                      />
                    )}
                  {feedbackVisible &&
                    index === selected &&
                    hasOptions(question) &&
                    index !== question.answerIndex && (
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={theme.colors.wrong}
                      />
                    )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {!revealed && question.hint != null && (
        <View>
          {showHint ? (
            <Card raised accentColor={theme.colors.accent}>
              <Text variant="label" muted weight="600">
                PETUNJUK
              </Text>
              <View style={styles.gap}>
                <Inline content={question.hint} />
              </View>
            </Card>
          ) : (
            <Button
              label="Lihat petunjuk"
              icon="bulb-outline"
              variant="hantu"
              onPress={() => setShowHint(true)}
            />
          )}
        </View>
      )}

      {feedbackVisible && (
        <>
          <Card
            raised
            accentColor={correct ? theme.colors.correct : theme.colors.wrong}
          >
            <View style={styles.verdictRow}>
              <Ionicons
                name={correct ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={correct ? theme.colors.correct : theme.colors.wrong}
              />
              <Text
                weight="700"
                color={correct ? theme.colors.correct : theme.colors.wrong}
              >
                {correct ? 'Benar' : 'Belum tepat'}
              </Text>
            </View>

            {question.format === 'isian' && !correct && (
              <Text muted variant="label" style={styles.gap}>
                Jawaban yang diharapkan: {question.answer}
              </Text>
            )}

            <View style={styles.solution}>
              <Text variant="label" muted weight="600">
                PEMBAHASAN
              </Text>
              <MathText content={question.solution} />
            </View>
          </Card>

          {!correct && onErrorReason != null && (
            <Card>
              <Text variant="label" muted weight="600">
                {reasonSaved ? 'PENYEBAB TERSIMPAN' : 'APA PENYEBABNYA?'}
              </Text>
              <Text muted variant="label" style={styles.gap}>
                {reasonSaved
                  ? `Tercatat sebagai "${ERROR_REASON_LABELS[reasonSaved]}" di Buku Kesalahan.`
                  : 'Dicatat di Buku Kesalahan supaya bisa kamu baca lagi sebelum ujian.'}
              </Text>
              {!reasonSaved && (
                <View style={styles.reasons}>
                  {ERROR_REASONS.map((reason) => (
                    <Button
                      key={reason}
                      label={ERROR_REASON_LABELS[reason]}
                      variant="sekunder"
                      style={styles.reasonButton}
                      onPress={() => {
                        setReasonSaved(reason);
                        onErrorReason(reason);
                      }}
                    />
                  ))}
                </View>
              )}
            </Card>
          )}
        </>
      )}

      {revealed && (
        <Button
          label={nextLabel}
          icon="arrow-forward"
          block
          onPress={onNext}
        />
      )}

      {deferFeedback && revealed && (
        <Text variant="label" muted style={styles.center}>
          Kunci jawaban muncul di akhir sesi.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionBody: {
    flex: 1,
  },
  input: {
    marginTop: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  gap: {
    marginTop: spacing.sm,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  solution: {
    marginTop: spacing.md,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reasonButton: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  center: {
    textAlign: 'center',
  },
});
