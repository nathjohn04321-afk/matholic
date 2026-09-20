/**
 * Algoritma pengulangan terjadwal — SM-2 yang disederhanakan (SPEC.md bagian 9).
 *
 * Seluruh isi berkas ini fungsi murni: tidak menyentuh database, tidak membaca
 * jam sistem kecuali lewat parameter. Itu disengaja supaya bisa diuji
 * (SPEC.md bagian 15) dan supaya hasilnya bisa diramalkan.
 */

import type { CardProgress, CardStatus, GradeLabel } from './types';
import { GRADES } from './types';

export const EASE_MIN = 1.3;
export const EASE_MAX = 2.8;
export const EASE_DEFAULT = 2.5;

/** Tunggakan di atas angka ini dipotong (SPEC.md bagian 9). */
export const BACKLOG_LIMIT = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Tanggal lokal ISO (YYYY-MM-DD), tanpa komponen waktu. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Tambah sejumlah hari ke tanggal ISO, kembalikan tanggal ISO. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  // Bulan pada Date dihitung dari 0.
  const base = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  base.setDate(base.getDate() + days);
  return toISODate(base);
}

/** Selisih hari antara dua tanggal ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay ?? 1970, (am ?? 1) - 1, ad ?? 1);
  const db = Date.UTC(by ?? 1970, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((db - da) / 86_400_000);
}

/** Keadaan awal kartu yang belum pernah dibuka. */
export function newCardProgress(cardId: string, today: string): CardProgress {
  return {
    cardId,
    ease: EASE_DEFAULT,
    intervalDays: 0,
    repetitions: 0,
    dueDate: today,
    lastReview: null,
    status: 'baru',
  };
}

/**
 * Hitung keadaan kartu setelah penilaian diri.
 *
 * Urutannya mengikuti SPEC.md bagian 9 persis: interval dihitung memakai ease
 * **lama**, baru setelah itu ease diperbarui. Membalik urutan ini mengubah
 * jadwal secara halus dan sulit ketahuan.
 */
export function review(
  progress: CardProgress,
  grade: GradeLabel,
  today: string
): CardProgress {
  const score = GRADES[grade];

  let repetitions = progress.repetitions;
  let intervalDays: number;
  let status: CardStatus;

  if (score < 3) {
    repetitions = 0;
    intervalDays = 1;
    status = 'lemah';
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(progress.intervalDays * progress.ease);
    }
    repetitions += 1;
    status = repetitions >= 3 ? 'kuasai' : 'belajar';
  }

  const ease = clamp(
    progress.ease + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02)),
    EASE_MIN,
    EASE_MAX
  );

  return {
    cardId: progress.cardId,
    ease,
    intervalDays,
    repetitions,
    dueDate: addDays(today, intervalDays),
    lastReview: today,
    status,
  };
}

/**
 * Jawaban salah di sesi latihan ikut menurunkan kartu jadi `lemah` dan
 * menjadwalkannya besok (SPEC.md bagian 9, aturan tambahan).
 *
 * Ease tidak diutak-atik di sini: yang menilai kekuatan ingatan adalah
 * penilaian diri saat review, bukan satu soal yang meleset.
 */
export function demoteAfterWrongAnswer(
  progress: CardProgress,
  today: string
): CardProgress {
  return {
    ...progress,
    repetitions: 0,
    intervalDays: 1,
    dueDate: addDays(today, 1),
    status: 'lemah',
  };
}

export interface QueueOptions {
  /** Kartu yang sudah punya progres, apa pun statusnya. */
  tracked: CardProgress[];
  /** Id seluruh kartu yang ada di konten. */
  allCardIds: string[];
  today: string;
  /** Batas kartu baru per hari (SPEC.md bagian 9). */
  newPerDay: number;
}

export interface Queue {
  /** Kartu jatuh tempo, terlama dulu, sudah dipotong ke BACKLOG_LIMIT. */
  due: string[];
  /** Kartu baru yang boleh diperkenalkan hari ini. */
  fresh: string[];
  /** Berapa banyak kartu jatuh tempo yang disembunyikan karena tunggakan. */
  hiddenBacklog: number;
}

/**
 * Susun antrean belajar hari ini.
 *
 * Kartu jatuh tempo selalu didahulukan sebelum kartu baru. Kalau tunggakan
 * melebihi BACKLOG_LIMIT, hanya yang terlama ditampilkan — sisanya dihitung
 * supaya layar bisa memberi catatan menenangkan, bukan angka menakutkan.
 */
export function buildQueue(options: QueueOptions): Queue {
  const { tracked, allCardIds, today, newPerDay } = options;

  const seen = new Set(tracked.map((p) => p.cardId));

  const dueAll = tracked
    .filter((p) => p.status !== 'baru' && daysBetween(p.dueDate, today) >= 0)
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      // Urutan stabil supaya antrean tidak berubah-ubah antar pemanggilan.
      return a.cardId < b.cardId ? -1 : 1;
    })
    .map((p) => p.cardId);

  const due = dueAll.slice(0, BACKLOG_LIMIT);
  const hiddenBacklog = Math.max(0, dueAll.length - due.length);

  const fresh =
    newPerDay > 0
      ? allCardIds.filter((id) => !seen.has(id)).slice(0, newPerDay)
      : [];

  return { due, fresh, hiddenBacklog };
}

/** Persentase kartu berstatus `kuasai` — dipakai cincin progres. */
export function masteryPercent(
  tracked: CardProgress[],
  totalCards: number
): number {
  if (totalCards <= 0) return 0;
  const mastered = tracked.filter((p) => p.status === 'kuasai').length;
  return Math.round((mastered / totalCards) * 100);
}
