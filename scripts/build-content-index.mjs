/**
 * Membangun lib/content-index.ts: daftar impor statis seluruh berkas topik.
 *
 * Metro tidak bisa memuat berkas berdasarkan nama yang dihitung saat runtime,
 * jadi setiap topik harus diimpor secara eksplisit. Berkas ini dibuat ulang
 * setiap kali ada topik baru:  npm run build-content-index
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const TRACKS = ['dasar', 'menengah', 'lanjut', 'olimpiade'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.json') && entry !== 'manifest.json') out.push(full);
  }
  return out;
}

const files = [];
for (const track of TRACKS) {
  const dir = join('content', track);
  try {
    files.push(...walk(dir).sort());
  } catch {
    // folder jalur boleh belum ada
  }
}

const imports = [];
const entries = [];
files.forEach((file, i) => {
  const name = `topik${i}`;
  const path = `@/${relative('.', file).split('\\').join('/')}`;
  imports.push(`import ${name} from ${JSON.stringify(path)};`);
  entries.push(`  ${name} as unknown as Topic,`);
});

const out = `/**
 * DIBUAT OTOMATIS oleh scripts/build-content-index.mjs — jangan disunting tangan.
 *
 * Metro memerlukan impor statis, jadi seluruh berkas topik didaftarkan di sini.
 * Jalankan ulang skripnya setelah menambah atau menghapus berkas topik.
 */

import type { Topic } from './types';

${imports.join('\n')}

export const RAW_TOPICS: Topic[] = [
${entries.join('\n')}
];
`;

writeFileSync('lib/content-index.ts', out);
console.log(`${files.length} topik didaftarkan -> lib/content-index.ts`);
for (const f of files) console.log(`  - ${f}`);
