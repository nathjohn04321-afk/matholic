/**
 * Pemilih beberapa opsi dalam satu baris. Dibuat sendiri — tanpa library UI
 * (SPEC.md bagian 3).
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.colors.accentSoft },
              pressed && !selected && { opacity: 0.6 },
            ]}
          >
            <Text
              variant="label"
              weight={selected ? '700' : '400'}
              color={selected ? theme.colors.accent : theme.colors.textMuted}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET - 10,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
