/**
 * Buku Kesalahan (SPEC.md 7.7).
 * Daftar dari tabel error_log, dikelompokkan menurut penyebab — milestone 4.
 */

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function BukuKesalahan() {
  return (
    <Screen>
      <Header title="Buku kesalahan" />
      <Placeholder
        icon="bookmark-outline"
        title="Buku kesalahan"
        note="Daftar jawaban salah beserta penyebabnya, dikelompokkan dan bisa ditandai sudah dipahami. Diisi pada milestone 4."
      />
    </Screen>
  );
}
