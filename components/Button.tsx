/**
 * Tombol dasar. Target sentuh minimal 48×48dp (SPEC.md bagian 10).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

export type ButtonVariant = 'utama' | 'sekunder' | 'hantu' | 'bahaya';
export type ButtonSize = 'sedang' | 'besar';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Nama ikon Ionicons, ditampilkan di kiri label. */
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  /** Melebar mengikuti induk. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'utama',
  size = 'sedang',
  icon,
  disabled = false,
  loading = false,
  block = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const { background, foreground, borderColor } = useMemo(() => {
    const { colors } = theme;
    switch (variant) {
      case 'utama':
        return {
          background: colors.accent,
          foreground: '#FFFFFF',
          borderColor: 'transparent',
        };
      case 'sekunder':
        return {
          background: colors.surfaceRaised,
          foreground: colors.text,
          borderColor: colors.border,
        };
      case 'hantu':
        return {
          background: 'transparent',
          foreground: colors.accent,
          borderColor: 'transparent',
        };
      case 'bahaya':
        return {
          background: 'transparent',
          foreground: colors.wrong,
          borderColor: colors.wrong,
        };
    }
  }, [theme, variant]);

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'besar' && styles.besar,
        block && styles.block,
        {
          backgroundColor: background,
          borderColor,
          borderWidth: borderColor === 'transparent' ? 0 : 1,
          opacity: inactive ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={foreground} />
        ) : (
          icon && (
            <Ionicons
              name={icon}
              size={theme.type.body.fontSize + 2}
              color={foreground}
            />
          )
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: foreground, fontSize: theme.type.body.fontSize },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  besar: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
  },
  block: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
