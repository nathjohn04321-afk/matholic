/**
 * Ekspor dan reset progres (SPEC.md 7.10).
 *
 * Ekspor menghasilkan berkas JSON yang bisa dibaca manusia — bukan cadangan
 * biner — supaya pemiliknya bisa memeriksa isinya sendiri.
 */

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getDatabase, resetAllProgress } from './db';

export interface ExportBundle {
  app: 'MathDeck';
  version: number;
  exportedAt: string;
  cardProgress: unknown[];
  questionAttempts: unknown[];
  studySessions: unknown[];
  bookmarks: unknown[];
  errorLog: unknown[];
}

async function collect(): Promise<ExportBundle> {
  const db = await getDatabase();
  const [cardProgress, questionAttempts, studySessions, bookmarks, errorLog] =
    await Promise.all([
      db.getAllAsync('SELECT * FROM card_progress'),
      db.getAllAsync('SELECT * FROM question_attempts'),
      db.getAllAsync('SELECT * FROM study_sessions'),
      db.getAllAsync('SELECT * FROM bookmarks'),
      db.getAllAsync('SELECT * FROM error_log'),
    ]);

  return {
    app: 'MathDeck',
    version: 1,
    exportedAt: new Date().toISOString(),
    cardProgress,
    questionAttempts,
    studySessions,
    bookmarks,
    errorLog,
  };
}

export interface ExportResult {
  uri: string;
  fileName: string;
  bytes: number;
  shared: boolean;
}

/**
 * Tulis progres ke berkas JSON dan tawarkan lembar berbagi bila tersedia.
 * Kalau berbagi tidak tersedia, berkasnya tetap tersimpan dan jalurnya
 * dikembalikan.
 */
export async function exportProgress(): Promise<ExportResult> {
  const bundle = await collect();
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `mathdeck-progres-${stamp}.json`;

  const dir = new Directory(Paths.document, 'ekspor');
  if (!dir.exists) dir.create({ intermediates: true });

  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.create({ intermediates: true });

  const json = JSON.stringify(bundle, null, 2);
  file.write(json);

  let shared = false;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan progres MathDeck',
    });
    shared = true;
  }

  return { uri: file.uri, fileName, bytes: json.length, shared };
}

export async function resetProgress(): Promise<void> {
  await resetAllProgress();
}
