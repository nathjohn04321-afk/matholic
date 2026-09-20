/**
 * Menyiapkan CSS KaTeX sebagai berkas lokal.
 *
 * CSS-nya besar (~360 KB, sudah memuat font woff2 sebagai data URI). Kalau
 * disisipkan langsung ke setiap WebView, daftar 30 kartu berarti 30 × 360 KB
 * HTML untuk diurai. Karena itu berkasnya ditulis sekali ke penyimpanan
 * aplikasi, lalu tiap WebView cukup merujuknya lewat <link> — WebView
 * menyimpan hasil uraiannya di cache antar-instance.
 *
 * Nama berkas memuat hash isi, jadi memperbarui katex otomatis menulis ulang.
 */

import { Directory, File, Paths } from 'expo-file-system';

import { KATEX_CSS, KATEX_CSS_HASH } from './katex-css';

export interface KatexSource {
  /** Dipakai sebagai baseUrl WebView; null kalau berkas gagal ditulis. */
  baseUrl: string | null;
  /** Potongan <head> yang merujuk atau menyisipkan CSS. */
  styleTag: string;
}

let cached: KatexSource | null = null;

const FILE_NAME = `katex-${KATEX_CSS_HASH}.css`;

/** Cadangan: sisipkan CSS langsung. Lebih berat, tapi selalu jalan. */
function inlineSource(): KatexSource {
  return { baseUrl: null, styleTag: `<style>${KATEX_CSS}</style>` };
}

/**
 * Pastikan CSS KaTeX tersedia sebagai berkas, lalu kembalikan cara memuatnya.
 * Dipanggil sekali saat aplikasi mulai; hasilnya di-cache di memori.
 */
export function prepareKatex(): KatexSource {
  if (cached) return cached;

  try {
    const dir = new Directory(Paths.document, 'katex');
    if (!dir.exists) {
      dir.create({ intermediates: true });
    }

    const file = new File(dir, FILE_NAME);
    if (!file.exists) {
      // Berkas versi lama tidak terpakai lagi — buang supaya tidak menumpuk.
      for (const entry of dir.list()) {
        if (entry instanceof File && entry.name.endsWith('.css')) {
          try {
            entry.delete();
          } catch {
            // berkas sisa yang gagal dihapus tidak menghalangi apa pun
          }
        }
      }
      file.create({ intermediates: true });
      file.write(KATEX_CSS);
    }

    cached = {
      baseUrl: dir.uri.endsWith('/') ? dir.uri : `${dir.uri}/`,
      styleTag: `<link rel="stylesheet" href="${FILE_NAME}">`,
    };
  } catch {
    // Penyimpanan tidak bisa ditulis (atau platform web): pakai cara sisip.
    cached = inlineSource();
  }

  return cached;
}
