/**
 * Menjalankan tes di lib/__tests__/.
 *
 * Kode sumber memakai impor tanpa ekstensi (`./types`), yang dipahami Metro
 * tapi tidak oleh ESM Node. Karena itu berkas tes dibundel dulu dengan
 * esbuild, baru dijalankan node --test.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TEST_DIR = 'lib/__tests__';
const out = mkdtempSync(join(tmpdir(), 'mathdeck-tests-'));

try {
  const files = readdirSync(TEST_DIR).filter((f) => f.endsWith('.test.ts'));
  if (files.length === 0) {
    console.log('Belum ada berkas tes.');
    process.exit(0);
  }

  const bundled = [];
  for (const file of files) {
    const target = join(out, file.replace(/\.ts$/, '.mjs'));
    execFileSync(
      'node_modules/.bin/esbuild',
      [
        join(TEST_DIR, file),
        '--bundle',
        '--platform=node',
        '--format=esm',
        '--log-level=error',
        `--outfile=${target}`,
      ],
      { stdio: 'inherit' }
    );
    bundled.push(target);
  }

  execFileSync('node', ['--test', ...bundled], { stdio: 'inherit' });
} finally {
  rmSync(out, { recursive: true, force: true });
}
