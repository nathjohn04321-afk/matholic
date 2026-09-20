/**
 * Model data MathDeck — lihat SPEC.md bagian 5.
 *
 * Hierarki: Jalur (track) → Topik (topic) → Kartu (card) → Soal (question)
 */

/* ------------------------------------------------------------------ */
/* Konten                                                              */
/* ------------------------------------------------------------------ */

/** Tingkat materi. Urutan array ini dipakai sebagai urutan tampilan. */
export const TRACKS = ['dasar', 'menengah', 'lanjut', 'olimpiade'] as const;
export type Track = (typeof TRACKS)[number];

/** Tipe kartu — menentukan ikon dan cara baca. Lihat SPEC.md 5.3. */
export const CARD_TYPES = [
  'konsep',
  'rumus',
  'prosedur',
  'contoh',
  'jebakan',
  'teknik',
] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const QUESTION_FORMATS = ['pilihan-ganda', 'isian', 'benar-salah'] as const;
export type QuestionFormat = (typeof QUESTION_FORMATS)[number];

/** 1 = hafalan langsung, 5 = level olimpiade. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

interface QuestionBase {
  id: string;
  difficulty: Difficulty;
  prompt: string;
  /** Solusi wajib menunjukkan langkah, bukan hanya hasil akhir. */
  solution: string;
  hint?: string;
  tags?: string[];
}

export interface MultipleChoiceQuestion extends QuestionBase {
  format: 'pilihan-ganda';
  options: string[];
  answerIndex: number;
}

export interface TrueFalseQuestion extends QuestionBase {
  format: 'benar-salah';
  options: string[];
  answerIndex: number;
}

export interface ShortAnswerQuestion extends QuestionBase {
  format: 'isian';
  answer: string;
  /** Bentuk alternatif yang tetap dianggap benar. */
  acceptedAnswers?: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion;

/** Penyempit tipe: soal yang dinilai lewat indeks opsi. */
export function hasOptions(
  q: Question
): q is MultipleChoiceQuestion | TrueFalseQuestion {
  return q.format === 'pilihan-ganda' || q.format === 'benar-salah';
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  /** Markdown + LaTeX. 80–200 kata (SPEC.md bagian 12). */
  body: string;
  keyPoints?: string[];
  /** Kesalahan spesifik, bukan nasihat umum. */
  pitfall?: string;
  /** Minimal 2 soal per kartu — divalidasi di scripts/validate-content.ts. */
  questions: Question[];
}

export interface Topic {
  id: string;
  track: Track;
  title: string;
  order: number;
  prerequisites?: string[];
  estimatedMinutes: number;
  summary: string;
  tags?: string[];
  cards: Card[];
}

/** Ringkasan topik tanpa isi kartu — dipakai layar daftar agar ringan. */
export interface TopicMeta {
  id: string;
  track: Track;
  title: string;
  order: number;
  prerequisites: string[];
  estimatedMinutes: number;
  summary: string;
  tags: string[];
  cardCount: number;
  questionCount: number;
}

export interface ContentManifest {
  /** Versi skema konten, dinaikkan kalau bentuk JSON berubah. */
  version: number;
  generatedAt: string;
  topics: TopicMeta[];
}

/* ------------------------------------------------------------------ */
/* Progres (SQLite) — lihat SPEC.md 5.5                                */
/* ------------------------------------------------------------------ */

export const CARD_STATUSES = ['baru', 'belajar', 'kuasai', 'lemah'] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export interface CardProgress {
  cardId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  /** Tanggal ISO (YYYY-MM-DD). */
  dueDate: string;
  lastReview: string | null;
  status: CardStatus;
}

/** Penilaian diri di akhir kartu. Nilai angka dipakai SM-2 (SPEC.md bagian 9). */
export const GRADES = {
  lupa: 0,
  sulit: 3,
  bisa: 4,
  mudah: 5,
} as const;
export type GradeLabel = keyof typeof GRADES;
export type GradeValue = (typeof GRADES)[GradeLabel];

export interface QuestionAttempt {
  id: number;
  questionId: string;
  cardId: string;
  correct: boolean;
  seconds: number | null;
  attemptedAt: string;
}

export interface StudySession {
  id: number;
  startedAt: string;
  endedAt: string | null;
  cardsSeen: number;
  questionsDone: number;
  correctCount: number;
}

export interface Bookmark {
  cardId: string;
  createdAt: string;
}

/** Penyebab kesalahan — ditawarkan setiap kali jawaban salah. */
export const ERROR_REASONS = [
  'salah-konsep',
  'salah-hitung',
  'tidak-cek-syarat',
  'kehabisan-waktu',
] as const;
export type ErrorReason = (typeof ERROR_REASONS)[number];

export const ERROR_REASON_LABELS: Record<ErrorReason, string> = {
  'salah-konsep': 'Salah konsep',
  'salah-hitung': 'Salah hitung',
  'tidak-cek-syarat': 'Tidak cek syarat',
  'kehabisan-waktu': 'Kehabisan waktu',
};

export interface ErrorLogEntry {
  id: number;
  questionId: string;
  cardId: string;
  reason: ErrorReason | null;
  note: string | null;
  createdAt: string;
}
