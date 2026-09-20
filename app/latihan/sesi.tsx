/**
 * Sesi soal berjalan (SPEC.md 7.5).
 * Alur soal, pencatatan jawaban, dan Buku Kesalahan diisi milestone 4.
 */

import { useLocalSearchParams } from 'expo-router';

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function SesiLatihan() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  return (
    <Screen>
      <Header title="Sesi latihan" subtitle={mode ?? 'acak'} />
      <Placeholder
        icon="help-circle-outline"
        title="Sesi soal"
        note="Soal, kunci, penyebab kesalahan, dan rekap skor diisi pada milestone 4."
      />
    </Screen>
  );
}
