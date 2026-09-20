/**
 * Sesi pengulangan terjadwal (SPEC.md 7.6).
 * Algoritma di lib/srs.ts dan alur penilaian diri diisi milestone 4.
 */

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function Review() {
  return (
    <Screen>
      <Header title="Review" />
      <Placeholder
        icon="repeat-outline"
        title="Pengulangan terjadwal"
        note="Kartu jatuh tempo ditampilkan satu per satu, lalu dinilai Lupa / Sulit / Bisa / Mudah. Diisi pada milestone 4."
      />
    </Screen>
  );
}
