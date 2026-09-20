/**
 * Permukaan kartu: sudut 12px, bayangan halus (SPEC.md bagian 10).
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { radius, spacing } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

export interface CardProps {
  children: ReactNode;
  /** Kalau diisi, kartu menjadi dapat disentuh. */
  onPress?: () => void;
  /** Gunakan permukaan satu tingkat lebih menonjol. */
  raised?: boolean;
  /** Garis aksen di tepi kiri — dipakai blok jebakan dan poin kunci. */
  accentColor?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  raised = false,
  accentColor,
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();

  const surface: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: raised ? theme.colors.surfaceRaised : theme.colors.surface,
      borderColor: theme.colors.border,
    },
    padded && styles.padded,
    accentColor != null && {
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    style,
  ];

  if (!onPress) {
    return <View style={surface}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [surface, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    // Bayangan halus — jangan berat, materi yang dibaca harus tetap tenang.
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.8,
  },
});
