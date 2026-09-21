/**
 * DIBUAT OTOMATIS oleh scripts/build-content-index.mjs — jangan disunting tangan.
 *
 * Metro memerlukan impor statis, jadi seluruh berkas topik didaftarkan di sini.
 * Jalankan ulang skripnya setelah menambah atau menghapus berkas topik.
 */

import type { Topic } from './types';

import topik0 from "@/content/dasar/das-aljabar.json";
import topik1 from "@/content/dasar/das-bilangan.json";
import topik2 from "@/content/dasar/das-garis.json";
import topik3 from "@/content/dasar/das-geometri.json";
import topik4 from "@/content/dasar/das-kuadrat.json";
import topik5 from "@/content/dasar/das-linear.json";
import topik6 from "@/content/dasar/das-pythagoras.json";
import topik7 from "@/content/dasar/das-rasio.json";
import topik8 from "@/content/dasar/das-splv.json";
import topik9 from "@/content/menengah/alj-eksponen-logaritma.json";
import topik10 from "@/content/menengah/alj-nilai-mutlak.json";
import topik11 from "@/content/menengah/kal-limit-aljabar.json";
import topik12 from "@/content/lanjut/lan-integral-tentu.json";
import topik13 from "@/content/olimpiade/osn-keterbagian.json";

export const RAW_TOPICS: Topic[] = [
  topik0 as unknown as Topic,
  topik1 as unknown as Topic,
  topik2 as unknown as Topic,
  topik3 as unknown as Topic,
  topik4 as unknown as Topic,
  topik5 as unknown as Topic,
  topik6 as unknown as Topic,
  topik7 as unknown as Topic,
  topik8 as unknown as Topic,
  topik9 as unknown as Topic,
  topik10 as unknown as Topic,
  topik11 as unknown as Topic,
  topik12 as unknown as Topic,
  topik13 as unknown as Topic,
];
