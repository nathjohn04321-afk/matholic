/**
 * Render Markdown + LaTeX — komponen kunci (SPEC.md bagian 8).
 *
 * Aturan yang dipatuhi:
 *  - Satu kartu penuh = satu WebView, bukan satu WebView per rumus.
 *  - KaTeX dibundel lokal, tidak ada permintaan jaringan.
 *  - WebView melaporkan tingginya sendiri lewat postMessage.
 *  - Warna mengikuti tema lewat CSS variable, tidak di-hardcode.
 *  - Teks tanpa LaTeX dirender <Text> biasa demi performa daftar.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { prepareKatex } from '@/lib/katex';
import { hasMath } from '@/lib/markdown';
import { buildMathHtml, HEIGHT_SCRIPT } from '@/lib/math-html';

import { PlainMarkdown } from './PlainMarkdown';
import { useTheme } from './ThemeProvider';

export interface MathTextProps {
  /** Markdown + LaTeX. */
  content: string;
  /** Ukuran dasar teks; default mengikuti token `body`. */
  fontSize?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function MathText({ content, fontSize, color, style }: MathTextProps) {
  const theme = useTheme();
  const [height, setHeight] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const size = fontSize ?? theme.type.body.fontSize;
  const textColor = color ?? theme.colors.text;
  const math = hasMath(content);

  const html = useMemo(() => {
    if (!math) return '';
    return buildMathHtml({
      content,
      fontSize: size,
      textColor,
      mutedColor: theme.colors.textMuted,
      accentColor: theme.colors.accent,
      surfaceColor: theme.colors.surfaceRaised,
      errorColor: theme.colors.wrong,
      styleTag: prepareKatex().styleTag,
    });
  }, [content, math, size, textColor, theme]);

  if (!math) {
    // Tanpa LaTeX: <Text> biasa jauh lebih ringan untuk daftar panjang.
    return (
      <PlainMarkdown
        content={content}
        fontSize={size}
        color={textColor}
        style={style}
      />
    );
  }

  const onMessage = (event: WebViewMessageEvent) => {
    const next = Number(event.nativeEvent.data);
    if (!mounted.current || !Number.isFinite(next) || next <= 0) return;
    // Abaikan getaran sub-piksel supaya tidak render berulang.
    setHeight((current) => (Math.abs(current - next) > 1 ? next : current));
  };

  const katex = prepareKatex();

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        source={{ html, ...(katex.baseUrl ? { baseUrl: katex.baseUrl } : {}) }}
        originWhitelist={['*']}
        injectedJavaScript={HEIGHT_SCRIPT}
        onMessage={onMessage}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        // Seluruh aset lokal; tidak ada yang dimuat dari jaringan.
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        javaScriptEnabled
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        style={styles.webview}
        containerStyle={styles.webviewContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  },
});
