/**
 * Buku Kesalahan (SPEC.md 7.7).
 *
 * Daftar dari tabel error_log, dikelompokkan menurut penyebab. Inilah yang
 * dibaca H-1 ujian, jadi tampilannya dibuat ringkas dan bisa langsung
 * melompat ke kartu materinya.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { getCardContext } from '@/lib/content';
import { getOpenErrors, resolveError } from '@/lib/db';
import { spacing } from '@/lib/theme';
import {
  ERROR_REASON_LABELS,
  ERROR_REASONS,
  type ErrorLogEntry,
  type ErrorReason,
} from '@/lib/types';

const REASON_ICON: Record<ErrorReason, string> = {
  'salah-konsep': 'bulb-outline',
  'salah-hitung': 'calculator-outline',
  'tidak-cek-syarat': 'shield-outline',
  'kehabisan-waktu': 'timer-outline',
};

export default function BukuKesalahan() {
  const theme = useTheme();
  const [entries, setEntries] = useState<ErrorLogEntry[] | null>(null);

  const load = useCallback(() => {
    let active = true;
    getOpenErrors()
      .then((rows) => {
        if (active) setEntries(rows);
      })
      .catch(() => {
        if (active) setEntries([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Muat ulang tiap kali layar dibuka, karena sesi latihan menambah entri.
  useFocusEffect(load);

  const onResolve = (id: number) => {
    setEntries((prev) => prev?.filter((e) => e.id !== id) ?? prev);
    void resolveError(id).catch(() => {
      // Kalau gagal, entri muncul lagi saat layar dibuka berikutnya.
      load();
    });
  };

  if (entries == null) {
    return (
      <Screen>
        <Header title="Buku kesalahan" />
        <View style={styles.center}>
          <Text muted>Memuat...</Text>
        </View>
      </Screen>
    );
  }

  if (entries.length === 0) {
    return (
      <Screen>
        <Header title="Buku kesalahan" />
        <View style={styles.center}>
          <Ionicons
            name="checkmark-done-outline"
            size={44}
            color={theme.colors.correct}
          />
          <Text variant="title" weight="700">
            Masih kosong
          </Text>
          <Text muted style={styles.centerText}>
            Setiap kali kamu menjawab salah dan memilih penyebabnya, soal itu
            tercatat di sini. Bacalah halaman ini sehari sebelum ujian.
          </Text>
          <Button
            label="Mulai latihan"
            icon="shuffle-outline"
            onPress={() => router.push('/latihan')}
          />
        </View>
      </Screen>
    );
  }

  const grouped = ERROR_REASONS.map((reason) => ({
    reason,
    items: entries.filter((e) => e.reason === reason),
  })).filter((g) => g.items.length > 0);

  const tanpaPenyebab = entries.filter((e) => e.reason == null);

  return (
    <Screen>
      <Header title="Buku kesalahan" subtitle={`${entries.length} catatan`} />
      <ScrollView contentContainerStyle={styles.content}>
        {grouped.map(({ reason, items }) => (
          <View key={reason} style={styles.group}>
            <View style={styles.groupHead}>
              <Ionicons
                name={REASON_ICON[reason] as never}
                size={16}
                color={theme.colors.warning}
              />
              <Text variant="label" muted weight="700">
                {ERROR_REASON_LABELS[reason].toUpperCase()} · {items.length}
              </Text>
            </View>

            {items.map((entry) => {
              const context = getCardContext(entry.cardId);
              return (
                <Card key={entry.id} accentColor={theme.colors.warning}>
                  <Text weight="600" numberOfLines={2}>
                    {context?.card.title ?? entry.cardId}
                  </Text>
                  {context && (
                    <Text variant="label" muted style={styles.gap}>
                      {context.topic.title}
                    </Text>
                  )}
                  {entry.note != null && (
                    <Text variant="label" style={styles.gap}>
                      {entry.note}
                    </Text>
                  )}
                  <View style={styles.actions}>
                    <Button
                      label="Buka kartu"
                      icon="book-outline"
                      variant="sekunder"
                      style={styles.action}
                      onPress={() => router.push(`/kartu/${entry.cardId}`)}
                    />
                    <Button
                      label="Sudah paham"
                      icon="checkmark"
                      variant="hantu"
                      style={styles.action}
                      onPress={() => onResolve(entry.id)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        ))}

        {tanpaPenyebab.length > 0 && (
          <View style={styles.group}>
            <Text variant="label" muted weight="700">
              TANPA PENYEBAB · {tanpaPenyebab.length}
            </Text>
            {tanpaPenyebab.map((entry) => (
              <Card key={entry.id}>
                <Text weight="600" numberOfLines={2}>
                  {getCardContext(entry.cardId)?.card.title ?? entry.cardId}
                </Text>
                <View style={styles.actions}>
                  <Button
                    label="Buka kartu"
                    icon="book-outline"
                    variant="sekunder"
                    style={styles.action}
                    onPress={() => router.push(`/kartu/${entry.cardId}`)}
                  />
                  <Button
                    label="Sudah paham"
                    icon="checkmark"
                    variant="hantu"
                    style={styles.action}
                    onPress={() => onResolve(entry.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.lg,
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
  group: {
    gap: spacing.sm,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
