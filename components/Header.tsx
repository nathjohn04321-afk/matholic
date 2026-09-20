/**
 * Header layar: tombol kembali, judul, aksi di kanan.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Tampilkan tombol kembali. Default: mengikuti apakah ada riwayat. */
  showBack?: boolean;
  onBack?: () => void;
  /** Aksi di sisi kanan, misalnya tombol bookmark. */
  right?: ReactNode;
}

export function Header({
  title,
  subtitle,
  showBack,
  onBack,
  right,
}: HeaderProps) {
  const theme = useTheme();
  const canGoBack = showBack ?? router.canGoBack();

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      {canGoBack && (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
      )}

      <View style={styles.titleBlock}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: theme.type.title.fontSize },
          ]}
        >
          {title}
        </Text>
        {subtitle != null && (
          <Text
            numberOfLines={1}
            style={[
              styles.subtitle,
              {
                color: theme.colors.textMuted,
                fontSize: theme.type.label.fontSize,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {right != null && <View style={styles.right}>{right}</View>}
    </View>
  );
}

/** Tombol ikon untuk slot `right` pada Header. */
export function HeaderIconButton({
  icon,
  onPress,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icon} size={24} color={color ?? theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
