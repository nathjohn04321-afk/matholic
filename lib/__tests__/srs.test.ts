/**
 * Tes untuk lib/srs.ts (SPEC.md bagian 15).
 *
 * Jalankan: npm test
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addDays,
  BACKLOG_LIMIT,
  buildQueue,
  daysBetween,
  demoteAfterWrongAnswer,
  EASE_MAX,
  EASE_MIN,
  masteryPercent,
  newCardProgress,
  review,
} from '../srs.ts';
import type { CardProgress } from '../types.ts';

const TODAY = '2026-09-20';

function baseProgress(over: Partial<CardProgress> = {}): CardProgress {
  return { ...newCardProgress('c1', TODAY), ...over };
}

describe('bantuan tanggal', () => {
  it('menambah hari melintasi batas bulan', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01');
    assert.equal(addDays('2026-02-28', 1), '2026-03-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  });

  it('menangani tahun kabisat', () => {
    // 2028 kabisat, 2027 tidak
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(addDays('2027-02-28', 1), '2027-03-01');
  });

  it('menghitung selisih hari dengan tanda yang benar', () => {
    assert.equal(daysBetween('2026-09-20', '2026-09-23'), 3);
    assert.equal(daysBetween('2026-09-23', '2026-09-20'), -3);
    assert.equal(daysBetween('2026-09-20', '2026-09-20'), 0);
  });
});

describe('review — jawaban lupa', () => {
  it('mengulang dari awal dan menandai lemah', () => {
    const before = baseProgress({ repetitions: 5, intervalDays: 30, ease: 2.5 });
    const after = review(before, 'lupa', TODAY);

    assert.equal(after.repetitions, 0);
    assert.equal(after.intervalDays, 1);
    assert.equal(after.status, 'lemah');
    assert.equal(after.dueDate, '2026-09-21');
  });

  it('menurunkan ease tapi tidak di bawah batas bawah', () => {
    let p = baseProgress({ ease: 1.4 });
    for (let i = 0; i < 5; i++) p = review(p, 'lupa', TODAY);
    assert.equal(p.ease, EASE_MIN);
  });
});

describe('review — jawaban benar', () => {
  it('memakai tangga interval 1 lalu 3', () => {
    let p = baseProgress();

    p = review(p, 'bisa', TODAY);
    assert.equal(p.intervalDays, 1);
    assert.equal(p.repetitions, 1);
    assert.equal(p.status, 'belajar');

    p = review(p, 'bisa', TODAY);
    assert.equal(p.intervalDays, 3);
    assert.equal(p.repetitions, 2);
    assert.equal(p.status, 'belajar');
  });

  it('menandai kuasai pada pengulangan ketiga', () => {
    let p = baseProgress();
    p = review(p, 'bisa', TODAY);
    p = review(p, 'bisa', TODAY);
    p = review(p, 'bisa', TODAY);
    assert.equal(p.repetitions, 3);
    assert.equal(p.status, 'kuasai');
  });

  it('mengalikan interval dengan ease LAMA, bukan ease baru', () => {
    // Urutan ini ditetapkan SPEC.md bagian 9 dan mudah terbalik tanpa ketahuan.
    //
    // Nilai 'mudah' dipakai justru karena ia MENGUBAH ease: 2.5 -> 2.6.
    // Dengan begitu kedua urutan memberi hasil berbeda dan tesnya bermakna:
    //   ease lama: round(10 * 2.5) = 25   <- yang benar
    //   ease baru: round(10 * 2.6) = 26
    // Memakai 'bisa' tidak bisa membedakan keduanya, karena ease-nya tetap.
    const before = baseProgress({ repetitions: 2, intervalDays: 10, ease: 2.5 });
    const after = review(before, 'mudah', TODAY);

    assert.equal(after.intervalDays, 25);
    assert.ok(Math.abs(after.ease - 2.6) < 1e-9, 'ease harus naik jadi 2,6');
  });

  it('menaikkan ease untuk mudah dan menahannya di batas atas', () => {
    let p = baseProgress({ ease: 2.7 });
    for (let i = 0; i < 10; i++) p = review(p, 'mudah', TODAY);
    assert.equal(p.ease, EASE_MAX);
  });

  it('membiarkan ease tetap untuk nilai bisa', () => {
    // Untuk grade 4: 0.1 - 1*(0.08 + 1*0.02) = 0.1 - 0.1 = 0
    const before = baseProgress({ ease: 2.5 });
    const after = review(before, 'bisa', TODAY);
    assert.equal(after.ease, 2.5);
  });

  it('menurunkan ease untuk nilai sulit', () => {
    const before = baseProgress({ ease: 2.5 });
    const after = review(before, 'sulit', TODAY);
    // grade 3: 0.1 - 2*(0.08 + 2*0.02) = 0.1 - 0.24 = -0.14
    assert.ok(after.ease < 2.5);
    assert.ok(Math.abs(after.ease - 2.36) < 1e-9);
  });

  it('menetapkan jatuh tempo sesuai interval', () => {
    const before = baseProgress({ repetitions: 2, intervalDays: 10, ease: 2.0 });
    const after = review(before, 'bisa', TODAY);
    assert.equal(after.intervalDays, 20);
    assert.equal(after.dueDate, addDays(TODAY, 20));
    assert.equal(after.lastReview, TODAY);
  });
});

describe('jawaban salah di sesi latihan', () => {
  it('menurunkan status jadi lemah dan menjadwalkan besok', () => {
    const before = baseProgress({
      repetitions: 4,
      intervalDays: 21,
      status: 'kuasai',
      ease: 2.6,
    });
    const after = demoteAfterWrongAnswer(before, TODAY);

    assert.equal(after.status, 'lemah');
    assert.equal(after.repetitions, 0);
    assert.equal(after.intervalDays, 1);
    assert.equal(after.dueDate, '2026-09-21');
    // ease tidak diubah — yang menilai kekuatan ingatan adalah review
    assert.equal(after.ease, 2.6);
  });
});

describe('antrean belajar', () => {
  it('mendahulukan yang jatuh tempo terlama', () => {
    const q = buildQueue({
      tracked: [
        baseProgress({ cardId: 'b', dueDate: '2026-09-19', status: 'belajar' }),
        baseProgress({ cardId: 'a', dueDate: '2026-09-15', status: 'belajar' }),
        baseProgress({ cardId: 'c', dueDate: '2026-09-20', status: 'lemah' }),
      ],
      allCardIds: ['a', 'b', 'c'],
      today: TODAY,
      newPerDay: 10,
    });
    assert.deepEqual(q.due, ['a', 'b', 'c']);
  });

  it('tidak memasukkan kartu yang belum jatuh tempo', () => {
    const q = buildQueue({
      tracked: [
        baseProgress({ cardId: 'a', dueDate: '2026-09-25', status: 'belajar' }),
      ],
      allCardIds: ['a'],
      today: TODAY,
      newPerDay: 10,
    });
    assert.deepEqual(q.due, []);
  });

  it('tidak menghitung kartu berstatus baru sebagai jatuh tempo', () => {
    const q = buildQueue({
      tracked: [baseProgress({ cardId: 'a', dueDate: '2026-09-01' })],
      allCardIds: ['a', 'b'],
      today: TODAY,
      newPerDay: 10,
    });
    assert.deepEqual(q.due, []);
  });

  it('membatasi kartu baru sesuai pengaturan', () => {
    const q = buildQueue({
      tracked: [],
      allCardIds: ['a', 'b', 'c', 'd', 'e'],
      today: TODAY,
      newPerDay: 2,
    });
    assert.deepEqual(q.fresh, ['a', 'b']);
  });

  it('tidak memperkenalkan kartu baru bila batasnya nol', () => {
    const q = buildQueue({
      tracked: [],
      allCardIds: ['a', 'b'],
      today: TODAY,
      newPerDay: 0,
    });
    assert.deepEqual(q.fresh, []);
  });

  it('memotong tunggakan dan melaporkan sisanya', () => {
    const tracked = Array.from({ length: BACKLOG_LIMIT + 12 }, (_, i) =>
      baseProgress({
        cardId: `c${String(i).padStart(3, '0')}`,
        dueDate: '2026-09-01',
        status: 'belajar',
      })
    );
    const q = buildQueue({
      tracked,
      allCardIds: tracked.map((t) => t.cardId),
      today: TODAY,
      newPerDay: 10,
    });

    assert.equal(q.due.length, BACKLOG_LIMIT);
    assert.equal(q.hiddenBacklog, 12);
  });

  it('tidak menawarkan kartu yang sudah pernah dibuka sebagai kartu baru', () => {
    const q = buildQueue({
      tracked: [baseProgress({ cardId: 'a', status: 'belajar', dueDate: '2026-09-30' })],
      allCardIds: ['a', 'b'],
      today: TODAY,
      newPerDay: 10,
    });
    assert.deepEqual(q.fresh, ['b']);
  });
});

describe('persentase penguasaan', () => {
  it('menghitung dari total kartu, bukan dari yang sudah dibuka', () => {
    const tracked = [
      baseProgress({ cardId: 'a', status: 'kuasai' }),
      baseProgress({ cardId: 'b', status: 'belajar' }),
    ];
    // 1 dari 10 kartu = 10%, bukan 1 dari 2 = 50%
    assert.equal(masteryPercent(tracked, 10), 10);
  });

  it('mengembalikan nol bila belum ada kartu', () => {
    assert.equal(masteryPercent([], 0), 0);
  });
});
