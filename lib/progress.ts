/**
 * Jembatan antara algoritma pengulangan (lib/srs.ts) dan penyimpanan
 * (lib/db.ts). Layar memanggil berkas ini, bukan keduanya langsung.
 */

import { getAllCardIds, getTopic } from './content';
import {
  getCardProgress,
  getDatabase,
  logError,
  recordAttempt,
  todayISO,
  upsertCardProgress,
} from './db';
import {
  buildQueue,
  demoteAfterWrongAnswer,
  masteryPercent,
  newCardProgress,
  review,
  type Queue,
} from './srs';
import type {
  CardProgress,
  CardStatus,
  ErrorReason,
  GradeLabel,
  Track,
} from './types';

/** Ambil progres kartu, buat baru kalau belum pernah tersentuh. */
export async function ensureProgress(
  cardId: string,
  today: string = todayISO()
): Promise<CardProgress> {
  const existing = await getCardProgress(cardId);
  return existing ?? newCardProgress(cardId, today);
}

/** Terapkan penilaian diri (Lupa/Sulit/Bisa/Mudah) pada satu kartu. */
export async function gradeCard(
  cardId: string,
  grade: GradeLabel,
  today: string = todayISO()
): Promise<CardProgress> {
  const current = await ensureProgress(cardId, today);
  const next = review(current, grade, today);
  await upsertCardProgress(next);
  return next;
}

/**
 * Catat satu jawaban. Jawaban salah ikut menurunkan kartu jadi `lemah` dan
 * menjadwalkannya besok (SPEC.md bagian 9).
 */
export async function recordAnswer(params: {
  questionId: string;
  cardId: string;
  correct: boolean;
  seconds: number;
  today?: string;
}): Promise<void> {
  const today = params.today ?? todayISO();
  await recordAttempt({
    questionId: params.questionId,
    cardId: params.cardId,
    correct: params.correct,
    seconds: params.seconds,
  });

  if (!params.correct) {
    const current = await ensureProgress(params.cardId, today);
    await upsertCardProgress(demoteAfterWrongAnswer(current, today));
  }
}

export async function saveErrorReason(params: {
  questionId: string;
  cardId: string;
  reason: ErrorReason;
  note?: string;
}): Promise<void> {
  await logError(params);
}

/** Tandai kartu sudah dibuka, supaya berhenti dihitung sebagai kartu baru. */
export async function markCardSeen(
  cardId: string,
  today: string = todayISO()
): Promise<void> {
  const current = await getCardProgress(cardId);
  if (current) return;
  await upsertCardProgress({
    ...newCardProgress(cardId, today),
    status: 'belajar',
    dueDate: today,
  });
}

async function getAllProgress(): Promise<CardProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    card_id: string;
    ease: number;
    interval_days: number;
    repetitions: number;
    due_date: string;
    last_review: string | null;
    status: string;
  }>('SELECT * FROM card_progress');
  return rows.map((r) => ({
    cardId: r.card_id,
    ease: r.ease,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    dueDate: r.due_date,
    lastReview: r.last_review,
    status: r.status as CardStatus,
  }));
}

/** Antrean belajar hari ini: jatuh tempo dulu, lalu kartu baru. */
export async function getTodayQueue(
  newPerDay: number,
  today: string = todayISO()
): Promise<Queue> {
  return buildQueue({
    tracked: await getAllProgress(),
    allCardIds: getAllCardIds(),
    today,
    newPerDay,
  });
}

/** Id kartu berstatus `lemah` — bahan mode latihan Kelemahan. */
export async function getWeakCardIds(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ card_id: string }>(
    "SELECT card_id FROM card_progress WHERE status = 'lemah' ORDER BY due_date ASC"
  );
  return rows.map((r) => r.card_id);
}

/** Kartu yang sudah pernah dibuka — bahan mode latihan Acak. */
export async function getSeenCardIds(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ card_id: string }>(
    "SELECT card_id FROM card_progress WHERE status != 'baru'"
  );
  return rows.map((r) => r.card_id);
}

export interface TrackProgress {
  track: Track;
  percent: number;
  mastered: number;
  total: number;
}

/** Persentase kartu `kuasai` per jalur, untuk baris progres di beranda. */
export async function getTrackProgress(
  cardIdsByTrack: Record<Track, string[]>
): Promise<Record<Track, TrackProgress>> {
  const all = await getAllProgress();
  const byId = new Map(all.map((p) => [p.cardId, p]));

  const result = {} as Record<Track, TrackProgress>;
  for (const [track, ids] of Object.entries(cardIdsByTrack) as [
    Track,
    string[],
  ][]) {
    const tracked = ids
      .map((id) => byId.get(id))
      .filter((p): p is CardProgress => p != null);
    result[track] = {
      track,
      percent: masteryPercent(tracked, ids.length),
      mastered: tracked.filter((p) => p.status === 'kuasai').length,
      total: ids.length,
    };
  }
  return result;
}

/** Kartu dari topik tertentu, dipakai mode latihan Per topik. */
export function getTopicCardIds(topicId: string): string[] {
  return getTopic(topicId)?.cards.map((c) => c.id) ?? [];
}
