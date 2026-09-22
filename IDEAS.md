# IDEAS.md

Ide yang muncul saat mengerjakan tapi **di luar SPEC.md**. Tidak dikerjakan
kecuali pemilik memintanya (SPEC.md bagian 15).

- Mode "ujian cepat": 5 soal acak dari kartu berstatus `lemah`, sekali ketuk
  dari beranda. (Mirip mode Kelemahan, tapi lebih pendek.)
- Ekspor Buku Kesalahan ke PDF satu halaman untuk dibaca H-1 ujian.
- Rentetan (streak) dengan pengingat lokal — butuh `expo-notifications`,
  yang menambah izin baru; perlu persetujuan dulu.
- Acak urutan pilihan saat soal ditampilkan, bukan hanya sekali saat ditulis.
  Sekarang urutannya tetap di dalam berkas konten, jadi seseorang yang
  mengulang soal yang sama berkali-kali bisa menghafal letak jawabannya
  alih-alih materinya. Mengacaknya saat tampil menutup celah itu, tapi
  mengubah cara soal dirender dan perlu dipikirkan bagaimana Buku Kesalahan
  menampilkan jawaban yang dulu dipilih.
- Statistik per topik: persentase benar untuk tiap topik, supaya kelemahan
  terlihat pada tingkat bab, bukan hanya per kartu.
