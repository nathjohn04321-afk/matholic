/**
 * Pencarian teks penuh pada judul kartu, badan, dan poin kunci (SPEC.md 7.8).
 *
 * Indeks dibangun saat build oleh scripts/build-index.ts, jadi di runtime
 * tinggal mencocokkan — tidak ada pembacaan ulang seluruh materi.
 */

import searchIndex from '@/content/search-index.json';

import type { CardType, Track } from './types';

export interface SearchEntry {
  cardId: string;
  topicId: string;
  topicTitle: string;
  track: Track;
  type: CardType;
  title: string;
  haystack: string;
  snippet: string;
}

export interface SearchHit extends SearchEntry {
  score: number;
}

const ENTRIES = (searchIndex as { entries: SearchEntry[] }).entries;

function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Cari kartu. Judul diberi bobot lebih tinggi daripada badan materi, dan
 * kartu yang memuat semua kata kunci didahulukan.
 */
export function search(query: string, limit = 30): SearchHit[] {
  const q = normalise(query);
  if (q.length < 2) return [];

  const terms = q.split(' ').filter(Boolean);
  const hits: SearchHit[] = [];

  for (const entry of ENTRIES) {
    const title = entry.title.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      const inTitle = title.includes(term);
      const inBody = entry.haystack.includes(term);
      if (!inTitle && !inBody) {
        matchedAll = false;
        break;
      }
      // Judul jauh lebih menentukan relevansi daripada badan materi.
      if (inTitle) score += 10;
      if (inBody) score += 1;
    }

    if (!matchedAll) continue;
    // Frasa utuh di judul adalah sinyal terkuat.
    if (title.includes(q)) score += 25;
    hits.push({ ...entry, score });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}

export function searchIndexSize(): number {
  return ENTRIES.length;
}
