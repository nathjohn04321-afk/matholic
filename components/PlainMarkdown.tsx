/**
 * Markdown tanpa LaTeX, dirender dengan <Text> biasa.
 *
 * Dipakai MathText saat teks tidak mengandung `$` sama sekali. Menghindari
 * WebView di sini penting untuk performa daftar (SPEC.md bagian 8 poin 6).
 * Yang didukung: tebal, miring, kode, dan daftar berbutir.
 */

import { Fragment, type ReactNode } from 'react';
import {
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LINE_HEIGHT_RATIO, spacing } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

export interface PlainMarkdownProps {
  content: string;
  fontSize: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}

/** Pecah satu baris menjadi potongan bergaya. */
function renderInline(
  line: string,
  keyPrefix: string,
  codeBackground: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Satu regex untuk ketiga penanda, supaya urutannya terjaga.
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t${i}`}>{line.slice(last, match.index)}</Fragment>
      );
    }
    const token = match[0];
    const key = `${keyPrefix}-m${i}`;
    if (token.startsWith('**')) {
      nodes.push(
        <RNText key={key} style={styles.bold}>
          {token.slice(2, -2)}
        </RNText>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <RNText key={key} style={[styles.code, { backgroundColor: codeBackground }]}>
          {token.slice(1, -1)}
        </RNText>
      );
    } else {
      nodes.push(
        <RNText key={key} style={styles.italic}>
          {token.slice(1, -1)}
        </RNText>
      );
    }
    last = match.index + token.length;
    i++;
  }

  if (last < line.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{line.slice(last)}</Fragment>);
  }
  return nodes;
}

export function PlainMarkdown({
  content,
  fontSize,
  color,
  style,
}: PlainMarkdownProps) {
  const theme = useTheme();
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO);
  const textStyle = { fontSize, lineHeight, color };

  const blocks: ReactNode[] = [];
  const lines = content.split('\n');

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet?.[1] != null) {
      blocks.push(
        <View key={`b${index}`} style={styles.bulletRow}>
          <RNText style={[textStyle, styles.bulletDot]}>•</RNText>
          <RNText style={[textStyle, styles.bulletText]}>
            {renderInline(bullet[1], `b${index}`, theme.colors.surfaceRaised)}
          </RNText>
        </View>
      );
      return;
    }

    blocks.push(
      <RNText key={`p${index}`} style={[textStyle, styles.paragraph]}>
        {renderInline(line, `p${index}`, theme.colors.surfaceRaised)}
      </RNText>
    );
  });

  return <View style={style}>{blocks}</View>;
}

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bulletDot: {
    width: 16,
  },
  bulletText: {
    flex: 1,
  },
});
