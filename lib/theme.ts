/**
 * Token desain MathDeck — lihat SPEC.md bagian 10.
 *
 * Palet gelap diambil persis dari spesifikasi. Palet terang diturunkan
 * dengan mempertahankan hue aksen yang sama (alasan: DECISIONS.md).
 */

import type { CardStatus, CardType } from './types';

export interface Palette {
  /** Latar layar. */
  background: string;
  /** Permukaan kartu di atas latar. */
  surface: string;
  /** Permukaan satu tingkat lebih menonjol (blok poin kunci). */
  surfaceRaised: string;
  accent: string;
  /** Aksen dengan opasitas rendah untuk latar chip/badge. */
  accentSoft: string;
  correct: string;
  wrong: string;
  warning: string;
  text: string;
  textMuted: string;
  border: string;
}

const dark: Palette = {
  background: '#0F1419',
  surface: '#1A2029',
  surfaceRaised: '#222A35',
  accent: '#4A9EFF',
  accentSoft: 'rgba(74, 158, 255, 0.14)',
  correct: '#3DD68C',
  wrong: '#FF6B6B',
  warning: '#FFB454',
  text: '#E8EDF2',
  textMuted: '#8B98A5',
  border: '#2A333F',
};

const light: Palette = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  surfaceRaised: '#EDF1F5',
  accent: '#1B6FD6',
  accentSoft: 'rgba(27, 111, 214, 0.10)',
  correct: '#1F9D63',
  wrong: '#D6455B',
  warning: '#B26B00',
  text: '#131A21',
  textMuted: '#5A6672',
  border: '#D8DFE6',
};

/**
 * Tangga warna sekuensial untuk heatmap aktivitas (SPEC.md 7.9).
 *
 * Satu hue, dari terang ke gelap — bukan pelangi. Langkah untuk tema gelap
 * dipilih sendiri terhadap latar gelap, bukan hasil membalik tangga terang:
 * membalik menghasilkan langkah yang saling terlalu dekat di latar gelap.
 * Indeks 0 selalu "tidak ada aktivitas".
 */
export const heatSteps = {
  dark: ['#222A35', '#1E3A5F', '#2A5C96', '#357DCC', '#4A9EFF'],
  light: ['#EDF1F5', '#C5DBF5', '#8FBCEA', '#4E8FD6', '#1B6FD6'],
} as const;

export const palettes = { dark, light } as const;
export type ColorSchemeName = keyof typeof palettes;

/** Tiga tingkat ukuran font (SPEC.md 7.10). */
export const FONT_SCALES = {
  kecil: 0.9,
  sedang: 1,
  besar: 1.15,
} as const;
export type FontScaleName = keyof typeof FONT_SCALES;

/**
 * Ukuran dasar dalam sp. Tinggi baris 1,6 — materi matematika butuh
 * ruang napas (SPEC.md bagian 10).
 */
export const LINE_HEIGHT_RATIO = 1.6;

const baseType = {
  title: 20,
  body: 16,
  keyPoint: 15,
  label: 13,
} as const;
export type TypeToken = keyof typeof baseType;

export interface Typography {
  title: { fontSize: number; lineHeight: number };
  body: { fontSize: number; lineHeight: number };
  keyPoint: { fontSize: number; lineHeight: number };
  label: { fontSize: number; lineHeight: number };
}

export function buildTypography(scale: number): Typography {
  const scaled = (size: number) => {
    const fontSize = Math.round(size * scale);
    return { fontSize, lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO) };
  };
  return {
    title: scaled(baseType.title),
    body: scaled(baseType.body),
    keyPoint: scaled(baseType.keyPoint),
    label: scaled(baseType.label),
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  /** Jarak antarkartu (SPEC.md bagian 10). */
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  /** Sudut membulat default. */
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Target sentuh minimal 48×48dp. */
export const MIN_TOUCH_TARGET = 48;

/** Animasi 150–200ms. Jangan ada yang menunda pengguna membaca. */
export const duration = {
  fast: 150,
  normal: 200,
} as const;

export interface Theme {
  scheme: ColorSchemeName;
  colors: Palette;
  /** Tangga sekuensial untuk heatmap; indeks 0 = tanpa aktivitas. */
  heat: readonly string[];
  type: Typography;
  spacing: typeof spacing;
  radius: typeof radius;
  duration: typeof duration;
}

export function buildTheme(
  scheme: ColorSchemeName,
  fontScale: FontScaleName
): Theme {
  return {
    scheme,
    colors: palettes[scheme],
    heat: heatSteps[scheme],
    type: buildTypography(FONT_SCALES[fontScale]),
    spacing,
    radius,
    duration,
  };
}

/** Ikon @expo/vector-icons (Ionicons) per tipe kartu. */
export const CARD_TYPE_ICON: Record<CardType, string> = {
  konsep: 'bulb-outline',
  rumus: 'calculator-outline',
  prosedur: 'list-outline',
  contoh: 'create-outline',
  jebakan: 'warning-outline',
  teknik: 'flash-outline',
};

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  konsep: 'Konsep',
  rumus: 'Rumus',
  prosedur: 'Prosedur',
  contoh: 'Contoh',
  jebakan: 'Jebakan',
  teknik: 'Teknik',
};

export function statusColor(status: CardStatus, colors: Palette): string {
  switch (status) {
    case 'kuasai':
      return colors.correct;
    case 'lemah':
      return colors.wrong;
    case 'belajar':
      return colors.accent;
    case 'baru':
      return colors.textMuted;
  }
}

export const STATUS_LABEL: Record<CardStatus, string> = {
  baru: 'Baru',
  belajar: 'Belajar',
  kuasai: 'Kuasai',
  lemah: 'Lemah',
};
