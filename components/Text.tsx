/**
 * Teks bertema. Ukuran dan tinggi baris mengikuti token di lib/theme.ts.
 *
 * Catatan: ini untuk teks biasa. Materi berisi LaTeX dirender oleh
 * MathText.tsx (milestone 2).
 */

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { TypeToken } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

export interface ThemedTextProps extends RNTextProps {
  /** Token ukuran; default `body`. */
  variant?: TypeToken;
  /** Pakai warna teks redup. */
  muted?: boolean;
  /** Warna khusus, menimpa `muted`. */
  color?: string;
  weight?: '400' | '600' | '700';
}

export function Text({
  variant = 'body',
  muted = false,
  color,
  weight = '400',
  style,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const token = theme.type[variant];

  return (
    <RNText
      style={[
        {
          color: color ?? (muted ? theme.colors.textMuted : theme.colors.text),
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: weight,
        },
        style,
      ]}
      {...rest}
    />
  );
}
