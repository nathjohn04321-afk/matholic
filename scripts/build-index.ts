/**
 * Membangun indeks pencarian dari seluruh berkas topik.
 *
 * SPEC.md 7.8 meminta indeks dibangun saat build, bukan saat runtime — supaya
 * membuka layar Cari tidak perlu membaca ulang seluruh materi.
 *
 * Jalankan:  npm run build-index
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface RawQuestion {
  id: string;
}

interface RawCard {
  id: string;
  type: string;
  title: string;
  body: string;
  keyPoints?: string[];
  pitfall?: string;
  questions: RawQuestion[];
}

interface RawTopic {
  id: string;
  track: string;
  title: string;
  cards: RawCard[];
}

interface IndexEntry {
  cardId: string;
  topicId: string;
  topicTitle: string;
  track: string;
  type: string;
  title: string;
  /** Teks gabungan yang sudah dinormalkan, dipakai untuk mencocokkan. */
  haystack: string;
  /** Potongan badan materi untuk ditampilkan di hasil. */
  snippet: string;
}

/**
 * Buang penanda LaTeX dan Markdown supaya pencarian mengenai kata, bukan
 * simbol. "$|x-a|$" tidak berguna sebagai kata kunci.
 */
function toSearchable(text: string): string {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[*`_#>\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function makeSnippet(body: string): string {
  const plain = body
    .replace(/\$\$[\s\S]*?\$\$/g, ' [rumus] ')
    .replace(/\$[^$]*\$/g, ' [rumus] ')
    .replace(/[*`_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.json') && entry !== 'manifest.json') {
      out.push(full);
    }
  }
  return out;
}

const entries: IndexEntry[] = [];
let cardCount = 0;

for (const file of walk('content').sort()) {
  const topic = JSON.parse(readFileSync(file, 'utf8')) as RawTopic;
  for (const card of topic.cards) {
    cardCount++;
    const parts = [
      card.title,
      card.body,
      ...(card.keyPoints ?? []),
      card.pitfall ?? '',
      topic.title,
    ];
    entries.push({
      cardId: card.id,
      topicId: topic.id,
      topicTitle: topic.title,
      track: topic.track,
      type: card.type,
      title: card.title,
      haystack: toSearchable(parts.join(' ')),
      snippet: makeSnippet(card.body),
    });
  }
}

// Tanpa stempel waktu: keluarannya harus fungsi murni dari isi content/,
// supaya membangun ulang di mesin mana pun menghasilkan berkas yang sama
// persis. CI membandingkan hasil bangun ulang dengan yang di-commit, dan
// stempel waktu membuat perbandingan itu selalu gagal.
const index = {
  version: 1,
  entries,
};

writeFileSync('lib/search-index.json', `${JSON.stringify(index, null, 2)}\n`);
console.log(`Indeks pencarian dibangun: ${entries.length} kartu dari ${cardCount} total`);
