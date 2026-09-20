/**
 * Skema & query SQLite — lihat SPEC.md bagian 5.5.
 *
 * Migrasi dijalankan berdasarkan `PRAGMA user_version`. Migrasi 1 menyalin
 * skema di SPEC.md apa adanya supaya mudah diaudit; perubahan sesudahnya
 * ditambahkan sebagai migrasi terpisah (alasan: DECISIONS.md).
 */

import * as SQLite from 'expo-sqlite';

import type {
  Bookmark,
  CardProgress,
  CardStatus,
  ErrorLogEntry,
  ErrorReason,
} from './types';

export const DATABASE_NAME = 'mathdeck.db';

/** Naikkan angka ini setiap kali menambah migrasi baru di bawah. */
const LATEST_VERSION = 2;

const MIGRATIONS: Record<number, string> = {
  1: `
    CREATE TABLE card_progress (
      card_id       TEXT PRIMARY KEY,
      ease          REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      repetitions   INTEGER NOT NULL DEFAULT 0,
      due_date      TEXT NOT NULL,
      last_review   TEXT,
      status        TEXT NOT NULL DEFAULT 'baru'
    );

    CREATE TABLE question_attempts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      card_id     TEXT NOT NULL,
      correct     INTEGER NOT NULL,
      seconds     INTEGER,
      attempted_at TEXT NOT NULL
    );

    CREATE TABLE study_sessions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at   TEXT NOT NULL,
      ended_at     TEXT,
      cards_seen   INTEGER DEFAULT 0,
      questions_done INTEGER DEFAULT 0,
      correct_count  INTEGER DEFAULT 0
    );

    CREATE TABLE bookmarks (
      card_id    TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE error_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      card_id     TEXT NOT NULL,
      reason      TEXT,
      note        TEXT,
      created_at  TEXT NOT NULL
    );
  `,
  /**
   * Indeks untuk query yang sering dipakai, plus kolom `resolved_at`
   * yang dibutuhkan tombol "sudah dipahami" di Buku Kesalahan (SPEC.md 7.7).
   */
  2: `
    ALTER TABLE error_log ADD COLUMN resolved_at TEXT;

    CREATE INDEX idx_card_progress_due    ON card_progress (due_date);
    CREATE INDEX idx_card_progress_status ON card_progress (status);
    CREATE INDEX idx_attempts_card        ON question_attempts (card_id);
    CREATE INDEX idx_attempts_at          ON question_attempts (attempted_at);
    CREATE INDEX idx_error_log_reason     ON error_log (reason);
    CREATE INDEX idx_error_log_created    ON error_log (created_at);
  `,
};

/**
 * Jalankan migrasi yang belum diterapkan. Aman dipanggil berkali-kali.
 */
export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let version = row?.user_version ?? 0;

  while (version < LATEST_VERSION) {
    const next = version + 1;
    const sql = MIGRATIONS[next];
    if (!sql) {
      throw new Error(`Migrasi ${next} tidak ditemukan.`);
    }
    // execAsync tidak menerima parameter terikat, dan user_version tidak bisa
    // di-bind; `next` berasal dari penghitung internal, bukan masukan pengguna.
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    await db.execAsync(`PRAGMA user_version = ${next};`);
    version = next;
  }
}

let openPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Buka koneksi tunggal yang dipakai bersama seluruh aplikasi.
 * Migrasi dijalankan sekali saat pertama dibuka.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!openPromise) {
    openPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await migrate(db);
      return db;
    })().catch((error: unknown) => {
      // Biarkan percobaan berikutnya membuka ulang, jangan kunci di promise gagal.
      openPromise = null;
      throw error;
    });
  }
  return openPromise;
}

/** Hanya untuk tes dan tombol reset progres (SPEC.md 7.10). */
export async function closeDatabase(): Promise<void> {
  if (!openPromise) return;
  const db = await openPromise.catch(() => null);
  openPromise = null;
  await db?.closeAsync();
}

/* ------------------------------------------------------------------ */
/* Bentuk baris mentah → bentuk aplikasi                               */
/* ------------------------------------------------------------------ */

interface CardProgressRow {
  card_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  last_review: string | null;
  status: string;
}

function toCardProgress(row: CardProgressRow): CardProgress {
  return {
    cardId: row.card_id,
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    dueDate: row.due_date,
    lastReview: row.last_review,
    status: row.status as CardStatus,
  };
}

interface ErrorLogRow {
  id: number;
  question_id: string;
  card_id: string;
  reason: string | null;
  note: string | null;
  created_at: string;
}

function toErrorLogEntry(row: ErrorLogRow): ErrorLogEntry {
  return {
    id: row.id,
    questionId: row.question_id,
    cardId: row.card_id,
    reason: row.reason as ErrorReason | null,
    note: row.note,
    createdAt: row.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* Query dasar                                                         */
/* ------------------------------------------------------------------ */

/** Tanggal lokal dalam bentuk ISO YYYY-MM-DD. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getCardProgress(
  cardId: string
): Promise<CardProgress | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CardProgressRow>(
    'SELECT * FROM card_progress WHERE card_id = ?',
    cardId
  );
  return row ? toCardProgress(row) : null;
}

export async function upsertCardProgress(progress: CardProgress): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO card_progress
       (card_id, ease, interval_days, repetitions, due_date, last_review, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(card_id) DO UPDATE SET
       ease          = excluded.ease,
       interval_days = excluded.interval_days,
       repetitions   = excluded.repetitions,
       due_date      = excluded.due_date,
       last_review   = excluded.last_review,
       status        = excluded.status`,
    progress.cardId,
    progress.ease,
    progress.intervalDays,
    progress.repetitions,
    progress.dueDate,
    progress.lastReview,
    progress.status
  );
}

/** Kartu yang jatuh tempo hari ini atau sebelumnya, terlama dulu. */
export async function getDueCardIds(
  limit: number,
  today: string = todayISO()
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ card_id: string }>(
    `SELECT card_id FROM card_progress
      WHERE due_date <= ? AND status != 'baru'
      ORDER BY due_date ASC
      LIMIT ?`,
    today,
    limit
  );
  return rows.map((r) => r.card_id);
}

export async function countDueCards(today: string = todayISO()): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM card_progress
      WHERE due_date <= ? AND status != 'baru'`,
    today
  );
  return row?.n ?? 0;
}

export async function countByStatus(): Promise<Record<CardStatus, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ status: string; n: number }>(
    'SELECT status, COUNT(*) AS n FROM card_progress GROUP BY status'
  );
  const result: Record<CardStatus, number> = {
    baru: 0,
    belajar: 0,
    kuasai: 0,
    lemah: 0,
  };
  for (const row of rows) {
    if (row.status in result) {
      result[row.status as CardStatus] = row.n;
    }
  }
  return result;
}

export async function recordAttempt(params: {
  questionId: string;
  cardId: string;
  correct: boolean;
  seconds?: number | null;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO question_attempts
       (question_id, card_id, correct, seconds, attempted_at)
     VALUES (?, ?, ?, ?, ?)`,
    params.questionId,
    params.cardId,
    params.correct ? 1 : 0,
    params.seconds ?? null,
    new Date().toISOString()
  );
}

export async function logError(params: {
  questionId: string;
  cardId: string;
  reason: ErrorReason | null;
  note?: string | null;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO error_log (question_id, card_id, reason, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    params.questionId,
    params.cardId,
    params.reason,
    params.note ?? null,
    new Date().toISOString()
  );
}

/** Buku Kesalahan — entri yang belum ditandai "sudah dipahami". */
export async function getOpenErrors(limit = 200): Promise<ErrorLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ErrorLogRow>(
    `SELECT id, question_id, card_id, reason, note, created_at
       FROM error_log
      WHERE resolved_at IS NULL
      ORDER BY created_at DESC
      LIMIT ?`,
    limit
  );
  return rows.map(toErrorLogEntry);
}

export async function resolveError(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE error_log SET resolved_at = ? WHERE id = ?',
    new Date().toISOString(),
    id
  );
}

export async function isBookmarked(cardId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ card_id: string }>(
    'SELECT card_id FROM bookmarks WHERE card_id = ?',
    cardId
  );
  return row != null;
}

export async function toggleBookmark(cardId: string): Promise<boolean> {
  const db = await getDatabase();
  if (await isBookmarked(cardId)) {
    await db.runAsync('DELETE FROM bookmarks WHERE card_id = ?', cardId);
    return false;
  }
  await db.runAsync(
    'INSERT INTO bookmarks (card_id, created_at) VALUES (?, ?)',
    cardId,
    new Date().toISOString()
  );
  return true;
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ card_id: string; created_at: string }>(
    'SELECT card_id, created_at FROM bookmarks ORDER BY created_at DESC'
  );
  return rows.map((r) => ({ cardId: r.card_id, createdAt: r.created_at }));
}

/** Hapus seluruh progres (SPEC.md 7.10) — dipanggil setelah konfirmasi dua langkah. */
export async function resetAllProgress(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM card_progress;
      DELETE FROM question_attempts;
      DELETE FROM study_sessions;
      DELETE FROM bookmarks;
      DELETE FROM error_log;
    `);
  });
}
