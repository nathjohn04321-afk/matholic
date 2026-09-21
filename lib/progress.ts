/**
 * Jembatan antara algoritma pengulangan (lib/srs.ts) dan penyimpanan
 * (lib/db.ts). Layar memanggil berkas ini, bukan keduanya langsung.
 */

import { getAllCardIds, getCardContext, getTopic } from './content';
import {
  countByStatus,
  getCardProgress,
  getDatabase,
  logError,
  recordAttempt,
  todayISO,
  upsertCardProgress,
} from './db';
import {
  addDays,
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

/* ------------------------------------------------------------------ */
/* Statistik (SPEC.md 7.9)                                             */
/* ------------------------------------------------------------------ */

export interface DayActivity {
  /** Tanggal ISO. */
  date: string;
  attempts: number;
  correct: number;
}

/**
 * Aktivitas harian untuk heatmap. Mengembalikan deret penuh termasuk hari
 * tanpa aktivitas, supaya kisinya tidak berlubang.
 */
export async function getDailyActivity(
  days: number,
  today: string = todayISO()
): Promise<DayActivity[]> {
  const db = await getDatabase();
  const since = addDays(today, -(days - 1));
  const rows = await db.getAllAsync<{
    hari: string;
    attempts: number;
    correct: number;
  }>(
    `SELECT substr(attempted_at, 1, 10) AS hari,
            COUNT(*) AS attempts,
            SUM(correct) AS correct
       FROM question_attempts
      WHERE substr(attempted_at, 1, 10) >= ?
      GROUP BY hari`,
    since
  );

  const byDate = new Map(rows.map((r) => [r.hari, r]));
  const out: DayActivity[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(since, i);
    const row = byDate.get(date);
    out.push({
      date,
      attempts: row?.attempts ?? 0,
      correct: row?.correct ?? 0,
    });
  }
  return out;
}

export interface TopicAccuracy {
  topicId: string;
  title: string;
  attempts: number;
  correct: number;
  percent: number;
}

/** Akurasi per topik, hanya topik yang pernah dikerjakan. */
export async function getAccuracyByTopic(): Promise<TopicAccuracy[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    card_id: string;
    attempts: number;
    correct: number;
  }>(
    `SELECT card_id, COUNT(*) AS attempts, SUM(correct) AS correct
       FROM question_attempts
      GROUP BY card_id`
  );

  const perTopic = new Map<string, { attempts: number; correct: number }>();
  for (const row of rows) {
    const topic = getCardTopicId(row.card_id);
    if (!topic) continue;
    const current = perTopic.get(topic) ?? { attempts: 0, correct: 0 };
    current.attempts += row.attempts;
    current.correct += row.correct;
    perTopic.set(topic, current);
  }

  const out: TopicAccuracy[] = [];
  for (const [topicId, value] of perTopic) {
    const topic = getTopic(topicId);
    if (!topic) continue;
    out.push({
      topicId,
      title: topic.title,
      attempts: value.attempts,
      correct: value.correct,
      percent: value.attempts
        ? Math.round((value.correct / value.attempts) * 100)
        : 0,
    });
  }
  return out.sort((a, b) => b.attempts - a.attempts);
}

function getCardTopicId(cardId: string): string | null {
  const context = getCardContext(cardId);
  return context?.topic.id ?? null;
}

/** Rentetan hari belajar berturut-turut, dihitung mundur dari hari ini. */
export function computeStreak(
  activity: DayActivity[],
  today: string = todayISO()
): number {
  const active = new Set(
    activity.filter((d) => d.attempts > 0).map((d) => d.date)
  );
  let streak = 0;
  let cursor = today;
  // Belum belajar hari ini bukan berarti rentetan putus — mulai hitung dari
  // kemarin kalau hari ini masih kosong.
  if (!active.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  while (active.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface OverallStats {
  mastered: number;
  totalCards: number;
  attempts: number;
  correct: number;
  accuracy: number;
}

export async function getOverallStats(): Promise<OverallStats> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ attempts: number; correct: number }>(
    'SELECT COUNT(*) AS attempts, COALESCE(SUM(correct), 0) AS correct FROM question_attempts'
  );
  const statuses = await countByStatus();
  const attempts = row?.attempts ?? 0;
  const correct = row?.correct ?? 0;
  return {
    mastered: statuses.kuasai,
    totalCards: getAllCardIds().length,
    attempts,
    correct,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
  };
}
