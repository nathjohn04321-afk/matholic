/**
 * Membangun dokumen HTML yang ditampilkan MathText di dalam WebView.
 *
 * Dipisah dari komponennya supaya bisa diuji tanpa React Native: skrip uji
 * memanggil fungsi yang sama persis dengan yang dipakai aplikasi.
 */

import { markdownToHtml } from './markdown';
import { LINE_HEIGHT_RATIO } from './theme';

export interface MathHtmlOptions {
  content: string;
  fontSize: number;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  surfaceColor: string;
  errorColor: string;
  /** <link> ke berkas CSS, atau <style> berisi CSS yang disisipkan. */
  styleTag: string;
}

/**
 * Skrip di dalam WebView: laporkan tinggi isi, dan laporkan lagi bila berubah.
 * Tinggi bisa bergeser setelah font selesai dimuat, jadi dilaporkan ulang.
 */
export const HEIGHT_SCRIPT = `
(function () {
  function post() {
    var h = document.body.scrollHeight;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(String(h));
    } else {
      window.__tinggiTerakhir = h;
    }
  }
  post();
  if (window.ResizeObserver) {
    new ResizeObserver(post).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(post).catch(function () {});
  }
  window.addEventListener('load', post);
  true;
})();
`;

export function buildMathHtml(options: MathHtmlOptions): string {
  const {
    content,
    fontSize,
    textColor,
    mutedColor,
    accentColor,
    surfaceColor,
    errorColor,
    styleTag,
  } = options;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
${styleTag}
<style>
  :root {
    --teks: ${textColor};
    --redup: ${mutedColor};
    --aksen: ${accentColor};
    --permukaan: ${surfaceColor};
  }
  html, body {
    margin: 0; padding: 0;
    background: transparent;
    color: var(--teks);
    font-size: ${fontSize}px;
    line-height: ${LINE_HEIGHT_RATIO};
    font-family: -apple-system, Roboto, "Helvetica Neue", sans-serif;
    -webkit-text-size-adjust: 100%;
    overflow-x: hidden;
    overflow-wrap: break-word;
  }
  p { margin: 0 0 0.75em; }
  p:last-child { margin-bottom: 0; }
  ul { margin: 0 0 0.75em; padding-left: 1.25em; }
  li { margin-bottom: 0.35em; }
  strong { font-weight: 700; }
  code {
    background: var(--permukaan);
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  /* Rumus blok panjang boleh digeser mendatar, jangan memaksa halaman melebar. */
  .katex-display {
    margin: 0.6em 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
  }
  .katex { color: var(--teks); }
  .katex-error { color: ${errorColor}; }
</style>
</head>
<body>${markdownToHtml(content)}</body>
</html>`;
}
