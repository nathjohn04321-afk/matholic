/**
 * Satu kartu materi (SPEC.md 7.4).
 *
 * Urutan dari atas: judul + label tipe, badan materi ter-render, blok poin
 * kunci, blok jebakan, lalu tombol menuju soal. Geser kiri/kanan berpindah
 * kartu; tombol bookmark ada di header.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header, HeaderIconButton } from '@/components/Header';
import { MathText } from '@/components/MathText';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getCardContext } from '@/lib/content';
import { isBookmarked, toggleBookmark } from '@/lib/db';
import { CARD_TYPE_ICON, CARD_TYPE_LABEL, spacing } from '@/lib/theme';

export default function KartuLayar() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const theme = useTheme();
  const context = useMemo(() => getCardContext(cardId ?? ''), [cardId]);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let active = true;
    if (!cardId) return;
    isBookmarked(cardId)
      .then((value) => {
        if (active) setBookmarked(value);
      })
      .catch(() => {
        // Gagal membaca bookmark tidak menghalangi membaca materi.
      });
    return () => {
      active = false;
    };
  }, [cardId]);

  const goTo = (id: string | null) => {
    if (id) router.replace(`/kartu/${id}`);
  };

  // Geser mendatar untuk pindah kartu. activeOffsetX menjaga scroll tegak
  // tetap enak — gerakan naik-turun tidak ikut tertangkap.
  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-16, 16])
        .onEnd((event) => {
          if (event.translationX < -60) goTo(context?.nextId ?? null);
          else if (event.translationX > 60) goTo(context?.previousId ?? null);
        })
        .runOnJS(true),
    [context]
  );

  if (!context) {
    return (
      <Screen>
        <Header title="Kartu" />
        <View style={styles.empty}>
          <Text variant="title" weight="700">
            Kartu tidak ditemukan
          </Text>
          <Text muted style={styles.center}>
            Kartu dengan id &quot;{cardId}&quot; tidak ada di dalam aplikasi.
          </Text>
        </View>
      </Screen>
    );
  }

  const { card, topic, index, previousId, nextId } = context;

  const onToggleBookmark = () => {
    toggleBookmark(card.id)
      .then(setBookmarked)
      .catch(() => {
        // abaikan; status bookmark akan dibaca ulang saat kartu dibuka lagi
      });
  };

  return (
    <Screen>
      <Header
        title={topic.title}
        subtitle={`Kartu ${index + 1} dari ${topic.cards.length}`}
        right={
          <HeaderIconButton
            icon={bookmarked ? 'bookmark' : 'bookmark-outline'}
            label={bookmarked ? 'Hapus bookmark' : 'Simpan bookmark'}
            color={bookmarked ? theme.colors.accent : undefined}
            onPress={onToggleBookmark}
          />
        }
      />

      <GestureDetector gesture={swipe}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 1. Judul + label tipe */}
          <View style={styles.titleBlock}>
            <View style={styles.typeRow}>
              <Ionicons
                name={CARD_TYPE_ICON[card.type] as keyof typeof Ionicons.glyphMap}
                size={16}
                color={theme.colors.accent}
              />
              <Text variant="label" weight="700" color={theme.colors.accent}>
                {CARD_TYPE_LABEL[card.type].toUpperCase()}
              </Text>
            </View>
            <Text variant="title" weight="700">
              {card.title}
            </Text>
          </View>

          {/* 2. Badan materi */}
          <Card>
            <MathText content={card.body} />
          </Card>

          {/* 3. Poin kunci — latar berbeda */}
          {card.keyPoints && card.keyPoints.length > 0 && (
            <Card raised accentColor={theme.colors.accent}>
              <Text variant="label" weight="700" muted>
                POIN KUNCI
              </Text>
              <View style={styles.pointList}>
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

          {/* 4. Jebakan — aksen peringatan */}
          {card.pitfall != null && (
            <Card raised accentColor={theme.colors.warning}>
              <View style={styles.typeRow}>
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={theme.colors.warning}
                />
                <Text variant="label" weight="700" color={theme.colors.warning}>
                  JEBAKAN
                </Text>
              </View>
              <View style={styles.pitfallBody}>
                <MathText content={card.pitfall} />
              </View>
            </Card>
          )}

          {/* 5. Menuju soal */}
          <Button
            label={`Coba ${card.questions.length} soal`}
            icon="help-circle-outline"
            block
            onPress={() =>
              router.push({
                pathname: '/latihan/sesi',
                params: { mode: 'kartu', cardId: card.id },
              })
            }
          />

          {/* Navigasi antar kartu */}
          <View style={styles.navRow}>
            <Button
              label="Sebelumnya"
              icon="chevron-back"
              variant="sekunder"
              disabled={!previousId}
              style={styles.navButton}
              onPress={() => goTo(previousId)}
            />
            <Button
              label="Berikutnya"
              icon="chevron-forward"
              variant="sekunder"
              disabled={!nextId}
              style={styles.navButton}
              onPress={() => goTo(nextId)}
            />
          </View>

          <Text variant="label" muted style={styles.center}>
            Geser kiri atau kanan untuk pindah kartu.
          </Text>
        </ScrollView>
      </GestureDetector>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  titleBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointList: {
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
  pitfallBody: {
    marginTop: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
  },
});
