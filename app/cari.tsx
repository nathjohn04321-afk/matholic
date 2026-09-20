/**
 * Pencarian (SPEC.md 7.8).
 * Indeks dibangun saat build oleh scripts/build-index.ts — milestone 5.
 */

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function Cari() {
  return (
    <Screen>
      <Header title="Cari" />
      <Placeholder
        icon="search-outline"
        title="Pencarian"
        note="Mencari judul kartu, badan materi, dan poin kunci lewat indeks build-time. Diisi pada milestone 5."
      />
    </Screen>
  );
}
