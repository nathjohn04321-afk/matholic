/**
 * Progres & statistik (SPEC.md 7.9).
 * Heatmap 90 hari dan akurasi per topik diisi milestone 5.
 */

import { Header } from '@/components/Header';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function Statistik() {
  return (
    <Screen>
      <Header title="Statistik" />
      <Placeholder
        icon="stats-chart-outline"
        title="Progres"
        note="Heatmap 90 hari, akurasi per topik, dan rentetan hari belajar diisi pada milestone 5."
      />
    </Screen>
  );
}
