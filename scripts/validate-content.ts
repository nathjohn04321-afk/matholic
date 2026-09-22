/**
 * Memvalidasi seluruh berkas JSON di content/ terhadap aturan SPEC.md
 * bagian 5 (skema) dan bagian 12 (panduan penulisan).
 *
 * Jalankan:  npm run validate-content
 *
 * Berkas ini sengaja berdiri sendiri — tidak mengimpor lib/ — supaya bisa
 * dijalankan langsung oleh node tanpa proses bundling.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TRACKS = ['dasar', 'menengah', 'lanjut', 'olimpiade'] as const;
const CARD_TYPES = [
  'konsep',
  'rumus',
  'prosedur',
  'contoh',
  'jebakan',
  'teknik',
] as const;
const FORMATS = ['pilihan-ganda', 'isian', 'benar-salah'] as const;

/** Batas dari SPEC.md bagian 12 dan 13. */
const BODY_MIN_WORDS = 80;
const BODY_MAX_WORDS = 200;
const MIN_QUESTIONS_PER_CARD = 2;
const MIN_CARDS_PER_TOPIC = 5;
const MIN_QUESTIONS_PER_TOPIC = 8;

const problems: string[] = [];
const warnings: string[] = [];

function fail(where: string, message: string): void {
  problems.push(`${where}: ${message}`);
}

function warn(where: string, message: string): void {
  warnings.push(`${where}: ${message}`);
}

/** Hitung kata, tapi rumus LaTeX dihitung satu kata — bukan per token. */
function countWords(body: string): number {
  const withoutMath = body.replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, ' RUMUS ');
  return withoutMath.split(/\s+/).filter(Boolean).length;
}

/** Periksa `$` berpasangan, supaya rumus tidak bocor jadi teks mentah. */
function unbalancedDollars(text: string): boolean {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      i++;
      continue;
    }
    if (text[i] === '$') {
      if (text[i + 1] === '$') i++;
      count++;
    }
  }
  return count % 2 !== 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

interface Totals {
  topics: number;
  cards: number;
  questions: number;
  byDifficulty: Record<number, number>;
}

const totals: Totals = {
  topics: 0,
  cards: 0,
  questions: 0,
  byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const seenTopicIds = new Set<string>();
/** order harus unik per jalur, karena urutan topik diurutkan dengan nilai itu. */
const ordersByTrack = new Map<string, Map<number, string>>();
const seenCardIds = new Set<string>();
const seenQuestionIds = new Set<string>();
const topicIdsByFile = new Map<string, string>();
const allPrerequisites: { topic: string; needs: string }[] = [];

function validateQuestion(q: unknown, where: string, cardId: string): void {
  if (typeof q !== 'object' || q === null) {
    fail(where, 'soal bukan objek');
    return;
  }
  const question = q as Record<string, unknown>;

  if (!isNonEmptyString(question.id)) {
    fail(where, 'id soal kosong');
  } else {
    if (seenQuestionIds.has(question.id)) {
      fail(where, `id soal ganda: ${question.id}`);
    }
    seenQuestionIds.add(question.id);
    if (!question.id.startsWith(cardId.split('-c')[0] ?? '')) {
      warn(where, `id soal "${question.id}" tidak berawalan id topik`);
    }
  }

  const difficulty = question.difficulty;
  if (
    typeof difficulty !== 'number' ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 5
  ) {
    fail(where, 'difficulty harus bilangan bulat 1–5');
  } else {
    totals.byDifficulty[difficulty] = (totals.byDifficulty[difficulty] ?? 0) + 1;
  }

  const format = question.format;
  if (typeof format !== 'string' || !FORMATS.includes(format as never)) {
    fail(where, `format tidak dikenal: ${String(format)}`);
    return;
  }

  if (!isNonEmptyString(question.prompt)) fail(where, 'prompt kosong');
  if (isNonEmptyString(question.prompt) && unbalancedDollars(question.prompt)) {
    fail(where, 'tanda $ pada prompt tidak berpasangan');
  }

  // Solusi harus menunjukkan langkah (SPEC.md bagian 12).
  if (!isNonEmptyString(question.solution)) {
    fail(where, 'solution kosong');
  } else if (question.solution.trim().length < 25) {
    warn(where, 'solution sangat pendek — harus menunjukkan langkah');
  }
  if (isNonEmptyString(question.solution) && unbalancedDollars(question.solution)) {
    fail(where, 'tanda $ pada solution tidak berpasangan');
  }

  if (format === 'pilihan-ganda' || format === 'benar-salah') {
    const options = question.options;
    if (!Array.isArray(options) || options.length < 2) {
      fail(where, 'options harus berisi minimal 2 pilihan');
      return;
    }
    if (!options.every(isNonEmptyString)) {
      fail(where, 'ada pilihan yang kosong');
    }
    if (new Set(options).size !== options.length) {
      fail(where, 'ada pilihan yang sama persis');
    }
    const answerIndex = question.answerIndex;
    if (
      typeof answerIndex !== 'number' ||
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= options.length
    ) {
      fail(where, `answerIndex di luar jangkauan options (${String(answerIndex)})`);
    }
    if ('answer' in question) {
      warn(where, 'format berpilihan seharusnya tidak punya field answer');
    }
  } else {
    // isian
    if (!isNonEmptyString(question.answer)) {
      fail(where, 'format isian wajib punya answer berupa teks');
    }
    if (
      question.acceptedAnswers !== undefined &&
      (!Array.isArray(question.acceptedAnswers) ||
        !question.acceptedAnswers.every(isNonEmptyString))
    ) {
      fail(where, 'acceptedAnswers harus array teks');
    }
    if ('options' in question || 'answerIndex' in question) {
      warn(where, 'format isian seharusnya tidak punya options/answerIndex');
    }
  }

  totals.questions++;
}

function validateCard(c: unknown, where: string, topicId: string): void {
  if (typeof c !== 'object' || c === null) {
    fail(where, 'kartu bukan objek');
    return;
  }
  const card = c as Record<string, unknown>;

  if (!isNonEmptyString(card.id)) {
    fail(where, 'id kartu kosong');
  } else {
    if (seenCardIds.has(card.id)) fail(where, `id kartu ganda: ${card.id}`);
    seenCardIds.add(card.id);
    if (!card.id.startsWith(topicId)) {
      warn(where, `id kartu "${card.id}" tidak berawalan id topik "${topicId}"`);
    }
  }

  const type = card.type;
  if (typeof type !== 'string' || !CARD_TYPES.includes(type as never)) {
    fail(where, `type tidak dikenal: ${String(type)}`);
  }

  if (!isNonEmptyString(card.title)) fail(where, 'title kosong');

  if (!isNonEmptyString(card.body)) {
    fail(where, 'body kosong');
  } else {
    const words = countWords(card.body);
    if (words < BODY_MIN_WORDS) {
      warn(where, `body ${words} kata — di bawah ${BODY_MIN_WORDS}`);
    }
    if (words > BODY_MAX_WORDS) {
      fail(where, `body ${words} kata — lewat ${BODY_MAX_WORDS}, pecah jadi dua kartu`);
    }
    if (unbalancedDollars(card.body)) {
      fail(where, 'tanda $ pada body tidak berpasangan');
    }
  }

  if (card.keyPoints !== undefined) {
    if (!Array.isArray(card.keyPoints) || !card.keyPoints.every(isNonEmptyString)) {
      fail(where, 'keyPoints harus array teks');
    } else {
      card.keyPoints.forEach((kp, i) => {
        if (unbalancedDollars(kp)) {
          fail(where, `tanda $ pada keyPoints[${i}] tidak berpasangan`);
        }
      });
    }
  }

  if (card.pitfall !== undefined) {
    if (!isNonEmptyString(card.pitfall)) {
      fail(where, 'pitfall kosong — hapus fieldnya kalau memang tidak ada');
    } else if (card.pitfall.trim().length < 15) {
      warn(where, 'pitfall terlalu umum — tulis kesalahan spesifik');
    }
  }

  const questions = card.questions;
  if (!Array.isArray(questions)) {
    fail(where, 'questions harus array');
    return;
  }
  if (questions.length < MIN_QUESTIONS_PER_CARD) {
    fail(
      where,
      `hanya ${questions.length} soal — minimal ${MIN_QUESTIONS_PER_CARD} per kartu`
    );
  }
  questions.forEach((q, i) => {
    const id = isNonEmptyString(card.id) ? card.id : '?';
    validateQuestion(q, `${where} > soal[${i}]`, id);
  });

  totals.cards++;
}

function validateTopic(raw: string, file: string): void {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    fail(file, `JSON tidak valid: ${(error as Error).message}`);
    return;
  }

  if (typeof data !== 'object' || data === null) {
    fail(file, 'isi berkas bukan objek');
    return;
  }
  const topic = data as Record<string, unknown>;

  const topicId = isNonEmptyString(topic.id) ? topic.id : '';
  if (!topicId) {
    fail(file, 'id topik kosong');
  } else {
    if (seenTopicIds.has(topicId)) fail(file, `id topik ganda: ${topicId}`);
    seenTopicIds.add(topicId);
    topicIdsByFile.set(file, topicId);
  }

  const track = topic.track;
  if (typeof track !== 'string' || !TRACKS.includes(track as never)) {
    fail(file, `track tidak dikenal: ${String(track)}`);
  } else if (!file.includes(`/${track}/`)) {
    fail(file, `track "${track}" tidak cocok dengan folder berkas`);
  }

  if (!isNonEmptyString(topic.title)) fail(file, 'title kosong');
  if (!isNonEmptyString(topic.summary)) fail(file, 'summary kosong');

  if (typeof topic.order !== 'number' || !Number.isInteger(topic.order)) {
    fail(file, 'order harus bilangan bulat');
  } else if (typeof track === 'string') {
    let taken = ordersByTrack.get(track);
    if (!taken) {
      taken = new Map<number, string>();
      ordersByTrack.set(track, taken);
    }
    const bentrok = taken.get(topic.order);
    if (bentrok !== undefined) {
      fail(file, `order ${topic.order} sudah dipakai "${bentrok}" di jalur ${track}`);
    } else {
      taken.set(topic.order, topicId);
    }
  }
  if (
    typeof topic.estimatedMinutes !== 'number' ||
    topic.estimatedMinutes <= 0
  ) {
    fail(file, 'estimatedMinutes harus angka positif');
  }

  if (topic.prerequisites !== undefined) {
    if (
      !Array.isArray(topic.prerequisites) ||
      !topic.prerequisites.every(isNonEmptyString)
    ) {
      fail(file, 'prerequisites harus array teks');
    } else {
      for (const need of topic.prerequisites) {
        allPrerequisites.push({ topic: topicId, needs: need });
      }
    }
  }

  if (topic.tags !== undefined) {
    if (!Array.isArray(topic.tags) || !topic.tags.every(isNonEmptyString)) {
      fail(file, 'tags harus array teks');
    }
  }

  const cards = topic.cards;
  if (!Array.isArray(cards)) {
    fail(file, 'cards harus array');
    return;
  }
  if (cards.length < MIN_CARDS_PER_TOPIC) {
    fail(file, `hanya ${cards.length} kartu — minimal ${MIN_CARDS_PER_TOPIC}`);
  }

  const before = totals.questions;
  cards.forEach((c, i) => validateCard(c, `${file} > kartu[${i}]`, topicId));
  const added = totals.questions - before;
  if (added < MIN_QUESTIONS_PER_TOPIC) {
    fail(file, `hanya ${added} soal — minimal ${MIN_QUESTIONS_PER_TOPIC} per topik`);
  }

  totals.topics++;
}

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (entry.endsWith('.json') && entry !== 'manifest.json') {
      found.push(full);
    }
  }
  return found;
}

const files = walk('content').sort();

if (files.length === 0) {
  console.log('Belum ada berkas topik di content/. Tidak ada yang divalidasi.');
  process.exit(0);
}

for (const file of files) {
  validateTopic(readFileSync(file, 'utf8'), file);
}

// Prasyarat harus menunjuk topik yang benar-benar ada.
for (const { topic, needs } of allPrerequisites) {
  if (!seenTopicIds.has(needs)) {
    warn(topic, `prasyarat "${needs}" belum ada sebagai topik`);
  }
}

console.log(`Memeriksa ${files.length} berkas topik\n`);

if (warnings.length) {
  console.log(`PERINGATAN (${warnings.length}):`);
  for (const w of warnings) console.log(`  ~ ${w}`);
  console.log('');
}

if (problems.length) {
  console.log(`ERROR (${problems.length}):`);
  for (const p of problems) console.log(`  x ${p}`);
  console.log('');
  console.log('Validasi GAGAL.');
  process.exit(1);
}

const d = totals.byDifficulty;
const easy = (d[1] ?? 0) + (d[2] ?? 0);
const mid = d[3] ?? 0;
const hard = (d[4] ?? 0) + (d[5] ?? 0);
const pct = (n: number) =>
  totals.questions ? `${Math.round((n / totals.questions) * 100)}%` : '0%';

console.log(
  `OK — ${totals.topics} topik, ${totals.cards} kartu, ${totals.questions} soal`
);
console.log(
  `Sebaran kesulitan: 1–2 ${pct(easy)} (target ~30%), 3 ${pct(mid)} (target ~50%), 4–5 ${pct(hard)} (target ~20%)`
);
