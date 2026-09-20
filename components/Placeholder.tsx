/**
 * Isi sementara untuk layar yang rangkanya sudah ada tapi belum diisi.
 * Dipakai selama milestone awal supaya navigasi bisa diuji utuh.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/lib/theme';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';

export function Placeholder({
  icon,
  title,
  note,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Keterangan singkat apa yang akan mengisi layar ini. */
  note: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={theme.colors.textMuted} />
      <Text variant="title" weight="600" style={styles.title}>
        {title}
      </Text>
      <Text muted style={styles.note}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
