/**
 * Satu kartu materi (SPEC.md 7.4).
 * Badan materi dirender MathText (milestone 2), isi dimuat milestone 3.
 */

import { useLocalSearchParams } from 'expo-router';

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function Kartu() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();

  return (
    <Screen>
      <Header title="Kartu" subtitle={cardId} />
      <Placeholder
        icon="document-text-outline"
        title="Isi kartu"
        note="Materi ber-LaTeX, poin kunci, jebakan, dan penilaian diri diisi pada milestone 2–4."
      />
    </Screen>
  );
}
