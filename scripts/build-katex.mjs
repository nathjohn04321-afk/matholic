/**
 * Membangun lib/katex-css.ts dari paket katex di node_modules.
 *
 * KaTeX harus dibundel sebagai aset lokal, bukan dari CDN (SPEC.md bagian 8).
 * Font woff2 disisipkan sebagai data URI supaya berkas CSS berdiri sendiri —
 * tidak ada permintaan jaringan, dan tidak ada jalur font yang perlu
 * diselesaikan di dalam WebView.
 *
 * Jalankan ulang setelah menaikkan versi katex:  node scripts/build-katex.mjs
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const katexPkg = require.resolve('katex/package.json');
const distDir = join(dirname(katexPkg), 'dist');
const version = JSON.parse(readFileSync(katexPkg, 'utf8')).version;

let css = readFileSync(join(distDir, 'katex.min.css'), 'utf8');

// Ganti seluruh blok src @font-face dengan satu data URI woff2.
let embedded = 0;
css = css.replace(
  /src:url\(fonts\/([\w-]+)\.woff2\)[^;}]*/g,
  (_match, name) => {
    const b64 = readFileSync(join(distDir, 'fonts', `${name}.woff2`)).toString('base64');
    embedded++;
    return `src:url(data:font/woff2;base64,${b64}) format("woff2")`;
  }
);

const leftover = css.match(/url\(fonts\//g);
if (leftover) {
  throw new Error(`Masih ada ${leftover.length} rujukan font yang belum disisipkan.`);
}

const hash = createHash('sha256').update(css).digest('hex').slice(0, 12);

const out = `/**
 * DIBUAT OTOMATIS oleh scripts/build-katex.mjs — jangan disunting tangan.
 *
 * KaTeX ${version}, ${embedded} font woff2 disisipkan sebagai data URI.
 * Jalankan ulang skripnya setelah menaikkan versi katex.
 */

export const KATEX_VERSION = ${JSON.stringify(version)};

/** Dipakai sebagai nama berkas supaya pembaruan otomatis menulis ulang cache. */
export const KATEX_CSS_HASH = ${JSON.stringify(hash)};

export const KATEX_CSS = ${JSON.stringify(css)};
`;

writeFileSync('lib/katex-css.ts', out);
console.log(`katex ${version}: ${embedded} font disisipkan`);
console.log(`css ${(css.length / 1024).toFixed(0)} KB -> lib/katex-css.ts (${(out.length / 1024).toFixed(0)} KB), hash ${hash}`);
