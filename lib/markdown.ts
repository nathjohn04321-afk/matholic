/**
 * Markdown sederhana + LaTeX → HTML.
 *
 * LaTeX dirender di sisi React Native memakai katex.renderToString, bukan di
 * dalam WebView. Akibatnya WebView tidak perlu memuat katex.min.js (268 KB)
 * untuk setiap kartu — cukup CSS-nya saja (SPEC.md bagian 8).
 *
 * Markdown yang didukung sengaja sedikit: tebal, miring, kode, daftar.
 * Materi matematika tidak butuh lebih dari itu.
 */

import katex from 'katex';

/**
 * Apakah teks mengandung LaTeX? Dipakai untuk memutuskan render dengan
 * <Text> biasa atau WebView — penting untuk performa daftar
 * (SPEC.md bagian 8 poin 6).
 */
export function hasMath(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++; // lewati karakter yang di-escape, termasuk \$
      continue;
    }
    if (text[i] === '$') return true;
  }
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      // Rumus salah tulis ditampilkan merah, tidak menjatuhkan seluruh kartu.
      throwOnError: false,
      strict: false,
    });
  } catch {
    return `<code class="math-error">${escapeHtml(latex)}</code>`;
  }
}

interface Segment {
  kind: 'teks' | 'math';
  value: string;
  display?: boolean;
}

/**
 * Pisahkan teks menjadi potongan teks biasa dan potongan matematika.
 * `$$...$$` jadi blok, `$...$` jadi sebaris. `\$` tetap tanda dolar biasa.
 */
export function splitMath(input: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (buffer) {
      segments.push({ kind: 'teks', value: buffer });
      buffer = '';
    }
  };

  while (i < input.length) {
    const ch = input[i];

    if (ch === '\\' && i + 1 < input.length) {
      const next = input[i + 1];
      if (next === '$') {
        buffer += '$'; // dolar yang di-escape
        i += 2;
        continue;
      }
      buffer += ch;
      buffer += next;
      i += 2;
      continue;
    }

    if (ch === '$') {
      const isDisplay = input[i + 1] === '$';
      const fence = isDisplay ? '$$' : '$';
      const start = i + fence.length;

      // cari penutup yang tidak di-escape
      let j = start;
      let end = -1;
      while (j < input.length) {
        if (input[j] === '\\') {
          j += 2;
          continue;
        }
        if (input.startsWith(fence, j)) {
          // untuk inline, "$$" bukan penutup yang sah
          if (!isDisplay && input[j + 1] === '$') {
            j += 1;
            continue;
          }
          end = j;
          break;
        }
        j++;
      }

      if (end === -1) {
        // tidak ada penutup: perlakukan sebagai teks biasa
        buffer += ch;
        i++;
        continue;
      }

      flush();
      segments.push({
        kind: 'math',
        value: input.slice(start, end),
        display: isDisplay,
      });
      i = end + fence.length;
      continue;
    }

    buffer += ch;
    i++;
  }

  flush();
  return segments;
}

/** Markdown sebaris: tebal, miring, kode. Dijalankan pada teks yang sudah di-escape. */
function inlineMarkdown(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

/** Ubah satu paragraf teks (tanpa math) menjadi HTML. */
function renderTextBlock(text: string): string {
  return inlineMarkdown(escapeHtml(text));
}

/**
 * Ubah Markdown + LaTeX menjadi HTML siap tempel ke dalam WebView.
 */
export function markdownToHtml(source: string): string {
  const lines = source.split('\n');
  const out: string[] = [];
  let listBuffer: string[] = [];

  const closeList = () => {
    if (listBuffer.length) {
      out.push(`<ul>${listBuffer.map((li) => `<li>${li}</li>`).join('')}</ul>`);
      listBuffer = [];
    }
  };

  const renderInline = (text: string): string =>
    splitMath(text)
      .map((seg) =>
        seg.kind === 'math'
          ? renderMath(seg.value, seg.display ?? false)
          : renderTextBlock(seg.value)
      )
      .join('');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      closeList();
      continue;
    }

    const listMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (listMatch?.[1] != null) {
      listBuffer.push(renderInline(listMatch[1]));
      continue;
    }

    closeList();

    // Baris yang isinya hanya blok rumus tidak dibungkus paragraf.
    const trimmed = line.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      out.push(renderMath(trimmed.slice(2, -2), true));
      continue;
    }

    out.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return out.join('');
}
