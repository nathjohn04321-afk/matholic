/**
 * DIBUAT OTOMATIS oleh scripts/build-content-index.mjs — jangan disunting tangan.
 *
 * Metro memerlukan impor statis, jadi seluruh berkas topik didaftarkan di sini.
 * Jalankan ulang skripnya setelah menambah atau menghapus berkas topik.
 */

import type { Topic } from './types';

import topik0 from "@/content/menengah/alj-eksponen-logaritma.json";
import topik1 from "@/content/menengah/alj-nilai-mutlak.json";
import topik2 from "@/content/menengah/kal-limit-aljabar.json";

export const RAW_TOPICS: Topic[] = [
  topik0 as unknown as Topic,
  topik1 as unknown as Topic,
  topik2 as unknown as Topic,
];
