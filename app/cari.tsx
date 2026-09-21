/**
 * Pencarian (SPEC.md 7.8).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useTheme } from '@/components/ThemeProvider';
import { search, searchIndexSize } from '@/lib/search';
import { CARD_TYPE_LABEL, MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';

export default function Cari() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const hits = useMemo(() => search(query), [query]);
  const tooShort = query.trim().length > 0 && query.trim().length < 2;

  return (
    <Screen>
      <Header title="Cari" />

      <View style={styles.searchBar}>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari materi, misalnya: logaritma"
            placeholderTextColor={theme.colors.textMuted}
            autoCorrect={false}
            accessibilityLabel="Kolom pencarian"
            style={[
              styles.input,
              { color: theme.colors.text, fontSize: theme.type.body.fontSize },
            ]}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
              onPress={() => setQuery('')}
            />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {query.trim().length === 0 ? (
          <Card>
            <Text muted>
              Ketik kata kunci untuk mencari di judul kartu, badan materi, dan
              poin kunci. {searchIndexSize()} kartu terindeks.
            </Text>
          </Card>
        ) : tooShort ? (
          <Card>
            <Text muted>Ketik minimal dua huruf.</Text>
          </Card>
        ) : hits.length === 0 ? (
          <Card>
            <Text weight="600">Tidak ditemukan</Text>
            <Text muted variant="label" style={styles.gap}>
              Tidak ada kartu yang memuat &quot;{query.trim()}&quot;. Coba kata
              lain, misalnya bagian dari judul materi.
            </Text>
          </Card>
        ) : (
          <>
            <Text variant="label" muted weight="600">
              {hits.length} HASIL
            </Text>
            {hits.map((hit) => (
              <Card
                key={hit.cardId}
                onPress={() => router.push(`/kartu/${hit.cardId}`)}
                accessibilityLabel={`Buka kartu ${hit.title}`}
              >
                <Text variant="label" muted weight="600">
                  {hit.topicTitle.toUpperCase()} ·{' '}
                  {CARD_TYPE_LABEL[hit.type].toUpperCase()}
                </Text>
                <Text weight="600" style={styles.gap}>
                  {hit.title}
                </Text>
                <Text variant="label" muted numberOfLines={2} style={styles.gap}>
                  {hit.snippet}
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  gap: {
    marginTop: spacing.xs,
  },
});
