# SPEC.md — Aplikasi Belajar Matematika (Android APK)

> **Dokumen ini adalah brief untuk Claude Code.**
> Baca seluruhnya sebelum menulis kode. Kerjakan per milestone di Bagian 11, jangan langsung membangun semuanya sekaligus. Setelah tiap milestone, hentikan dan laporkan hasilnya.

---

## 1. RINGKASAN PRODUK

**Nama kerja:** MathDeck

**Satu kalimat:** Aplikasi Android offline berisi seluruh konsep matematika dari tingkat dasar sampai olimpiade, disajikan sebagai materi singkat plus contoh soal, dengan sistem pengulangan terjadwal agar materi benar-benar melekat.

**Masalah yang dipecahkan:** Belajar dari PDF membuat orang membaca ulang hal yang sudah dikuasai dan melewatkan yang lemah. Aplikasi ini melacak apa yang sudah dan belum dikuasai, lalu memunculkan kembali materi tepat sebelum terlupa.

**Prinsip desain — urut berdasarkan prioritas:**

1. **Offline sepenuhnya.** Tidak ada panggilan jaringan. Semua materi dibundel dalam APK.
2. **Materi singkat.** Satu kartu = satu ide yang bisa dibaca dalam 2 menit.
3. **Soal selalu menyertai konsep.** Tidak ada materi tanpa contoh.
4. **Pengulangan terjadwal**, bukan sekadar daftar isi.
5. **Cepat dibuka.** Dari ikon ke sesi belajar kurang dari 3 detik.

**Bukan tujuan (non-goals):** akun pengguna, sinkronisasi cloud, fitur sosial, iklan, pembelian dalam aplikasi, papan peringkat online, chat AI. Jangan bangun ini meski terasa berguna.

---

## 2. PENGGUNA

Pengguna tunggal (pemilik perangkat), pelajar SMA Indonesia yang sedang menyiapkan diri untuk:
- Ulangan dan ujian sekolah
- Lomba matematika tingkat sekolah/kabupaten (standar UN/UTBK)
- Olimpiade (OSN) — materi berbeda dari kurikulum sekolah

Bahasa antarmuka dan seluruh konten: **Bahasa Indonesia**. Istilah teknis matematika tetap baku Indonesia (turunan, bukan derivative).

---

## 3. STACK TEKNOLOGI

| Lapis | Pilihan | Alasan |
|---|---|---|
| Framework | **React Native + Expo** (SDK stabil terbaru) | Jalur paling pendek ke file APK, tooling matang |
| Bahasa | **TypeScript** (strict mode) | Skema konten banyak, butuh type safety |
| Navigasi | **expo-router** | Berbasis file, mudah dirawat |
| Database lokal | **expo-sqlite** | Menyimpan progres, jadwal review, statistik |
| Penyimpanan ringan | **AsyncStorage** | Preferensi (tema, ukuran font) |
| Render matematika | **react-native-webview + KaTeX** (dibundel lokal) | Lihat Bagian 8 — ada aturan khusus |
| State | React Context + hooks | Cukup; jangan pakai Redux |
| Styling | StyleSheet native | Jangan pasang library UI berat |

**Larangan keras:**
- Tidak ada dependensi yang butuh jaringan saat runtime
- KaTeX harus dibundel sebagai aset lokal, **bukan** dimuat dari CDN
- Jangan pasang library UI besar (NativeBase, UI Kitten). Komponen dibuat sendiri.

**Verifikasi dulu:** sebelum menulis kode, cek versi Expo SDK terbaru yang stabil dan sesuaikan semua dependensi. Jangan asumsikan versi dari ingatan.

---

## 4. STRUKTUR FOLDER

```
mathdeck/
├── app/                        # expo-router screens
│   ├── _layout.tsx
│   ├── index.tsx               # Beranda
│   ├── belajar/
│   │   ├── index.tsx           # Pilih jalur & topik
│   │   └── [topicId].tsx       # Daftar kartu dalam topik
│   ├── kartu/[cardId].tsx      # Satu kartu materi
│   ├── latihan/
│   │   ├── index.tsx           # Pilih mode latihan
│   │   └── sesi.tsx            # Sesi soal berjalan
│   ├── review.tsx              # Sesi pengulangan terjadwal
│   ├── cari.tsx                # Pencarian
│   └── statistik.tsx           # Progres
├── components/
│   ├── MathText.tsx            # Render LaTeX — komponen kunci
│   ├── CardView.tsx
│   ├── QuestionCard.tsx
│   ├── ProgressRing.tsx
│   └── ...
├── content/                    # SELURUH MATERI — file JSON
│   ├── manifest.json
│   ├── dasar/
│   ├── menengah/
│   ├── lanjut/
│   └── olimpiade/
├── lib/
│   ├── db.ts                   # Skema & query SQLite
│   ├── srs.ts                  # Algoritma pengulangan
│   ├── content.ts              # Loader & indexer konten
│   └── types.ts
├── assets/
│   ├── katex/                  # katex.min.css, katex.min.js, fonts
│   └── fonts/
├── scripts/
│   ├── validate-content.ts     # Validasi semua JSON
│   └── build-index.ts          # Bangun indeks pencarian
└── eas.json
```

---

## 5. MODEL DATA

### 5.1 Hierarki Konten

```
Jalur (track)  →  Topik (topic)  →  Kartu (card)  →  Soal (question)
```

- **Jalur** = tingkat: `dasar`, `menengah`, `lanjut`, `olimpiade`
- **Topik** = satu bab, misal "Nilai Mutlak"
- **Kartu** = satu ide yang bisa dibaca 2 menit
- **Soal** = latihan yang menempel pada kartu

### 5.2 Skema Topik (`content/<jalur>/<topicId>.json`)

```json
{
  "id": "alj-nilai-mutlak",
  "track": "menengah",
  "title": "Persamaan & Pertidaksamaan Nilai Mutlak",
  "order": 3,
  "prerequisites": ["alj-persamaan-linear"],
  "estimatedMinutes": 25,
  "summary": "Nilai mutlak sebagai jarak; menyelesaikan persamaan dan pertidaksamaan.",
  "tags": ["aljabar", "un", "utbk"],
  "cards": [ /* array Kartu */ ]
}
```

### 5.3 Skema Kartu

```json
{
  "id": "alj-nilai-mutlak-c1",
  "type": "konsep",
  "title": "Nilai mutlak adalah jarak",
  "body": "Definisi yang berguna bukan \"membuat positif\", melainkan:\n\n$|x - a|$ adalah **jarak** $x$ dari titik $a$.\n\nKarena itu $|x-5| = 3$ berarti: cari titik berjarak 3 dari 5. Jawabannya langsung terlihat: $2$ dan $8$.",
  "keyPoints": [
    "$|x| = \\sqrt{x^2}$",
    "$|x| < a \\iff -a < x < a$ (terkurung)",
    "$|x| > a \\iff x < -a$ atau $x > a$ (terpisah)"
  ],
  "pitfall": "Mengkuadratkan $|A| = B$ padahal $B$ bisa negatif.",
  "questions": [ /* array Soal */ ]
}
```

**Nilai `type` yang diizinkan:**

| type | Isi |
|---|---|
| `konsep` | Penjelasan intuitif — mengapa, bukan hanya apa |
| `rumus` | Kumpulan rumus dalam satu tema |
| `prosedur` | Langkah baku untuk satu tipe soal |
| `contoh` | Satu soal dikerjakan penuh langkah demi langkah |
| `jebakan` | Kesalahan umum dan cara menghindarinya |
| `teknik` | Trik lanjutan (teleskop, luas dua cara, titik tetap) |

### 5.4 Skema Soal

```json
{
  "id": "alj-nilai-mutlak-q1",
  "difficulty": 2,
  "format": "pilihan-ganda",
  "prompt": "Himpunan penyelesaian $|2x-3| \\le 5$ adalah ...",
  "options": [
    "$\\{x \\mid x \\le 4\\}$",
    "$\\{x \\mid -1 \\le x \\le 4\\}$",
    "$\\{x \\mid -4 \\le x \\le 1\\}$",
    "$\\{x \\mid x \\ge -1\\}$"
  ],
  "answerIndex": 1,
  "solution": "Bentuk \"kurang dari\" berarti terkurung:\n$-5 \\le 2x-3 \\le 5$\n$-2 \\le 2x \\le 8$\n$-1 \\le x \\le 4$",
  "hint": "Tanda $\\le$ menghasilkan satu potong di tengah, bukan dua potong di pinggir.",
  "tags": ["un"]
}
```

- `difficulty`: 1–5 (1 = hafalan langsung, 5 = level olimpiade)
- `format`: `pilihan-ganda` | `isian` | `benar-salah`
- Untuk `isian`, ganti `options`/`answerIndex` dengan `answer` (string) dan `acceptedAnswers` (array string alternatif yang dianggap benar)

### 5.5 Skema Database (SQLite)

```sql
CREATE TABLE card_progress (
  card_id       TEXT PRIMARY KEY,
  ease          REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  due_date      TEXT NOT NULL,          -- ISO date
  last_review   TEXT,
  status        TEXT NOT NULL DEFAULT 'baru'  -- baru|belajar|kuasai|lemah
);

CREATE TABLE question_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  correct     INTEGER NOT NULL,          -- 0/1
  seconds     INTEGER,
  attempted_at TEXT NOT NULL
);

CREATE TABLE study_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at   TEXT NOT NULL,
  ended_at     TEXT,
  cards_seen   INTEGER DEFAULT 0,
  questions_done INTEGER DEFAULT 0,
  correct_count  INTEGER DEFAULT 0
);

CREATE TABLE bookmarks (
  card_id    TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE error_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  reason      TEXT,        -- salah-konsep | salah-hitung | tidak-cek-syarat | kehabisan-waktu
  note        TEXT,
  created_at  TEXT NOT NULL
);
```

**Catatan penting:** `error_log` adalah fitur pembeda aplikasi ini. Setiap kali pengguna menjawab salah, tawarkan memilih penyebabnya. Halaman "Buku Kesalahan" menampilkan daftar ini — inilah yang dibaca H-1 ujian.

---

## 6. KURIKULUM

Bangun konten dengan struktur ini. Milestone 4 mengisi seluruhnya; milestone-milestone awal cukup 3 topik contoh.

### Jalur DASAR (fondasi, setara SMP–awal SMA)
1. Bilangan bulat & pecahan
2. Rasio, perbandingan, persen
3. Bentuk aljabar & faktorisasi
4. Persamaan & pertidaksamaan linear
5. Persamaan kuadrat & fungsi kuadrat
6. Sistem persamaan linear (SPLDV, SPLTV)
7. Geometri bidang: segitiga, segiempat, lingkaran
8. Teorema Pythagoras & kesebangunan
9. Geometri analitik: gradien, persamaan garis, jarak
10. Notasi sigma & pengantar barisan

### Jalur MENENGAH (21 materi lomba — inti aplikasi)
1. Persamaan & Pertidaksamaan Nilai Mutlak
2. Eksponensial & Logaritma
3. Fungsi (komposisi & invers)
4. Barisan Aritmatika & Geometri
5. Matriks
6. Vektor
7. Program Linear
8. Polinomial
9. Perbandingan Trigonometri
10. Persamaan Trigonometri
11. Lingkaran
12. Dimensi Tiga
13. Statistik
14. Pencacahan
15. Peluang
16. Limit Fungsi Aljabar
17. Limit Tak Hingga
18. Limit Fungsi Trigonometri
19. Turunan Fungsi Aljabar
20. Turunan Fungsi Trigonometri
21. Integral Fungsi Aljabar

### Jalur LANJUT (sisa kurikulum SMA)
1. Integral fungsi trigonometri
2. Integral tentu & aplikasi (luas, volume benda putar)
3. Teknik integrasi (substitusi, parsial)
4. Irisan kerucut (parabola, elips, hiperbola)
5. Transformasi geometri
6. Bilangan kompleks & De Moivre
7. Logika matematika & induksi
8. Distribusi binomial dan normal
9. Matematika keuangan (bunga, anuitas, penyusutan)

### Jalur OLIMPIADE (empat pilar OSN)
**Teori Bilangan:** keterbagian, kongruensi/modulo, Teorema Fermat Kecil, fungsi Euler, Teorema Sisa Cina, persamaan Diophantine, fungsi lantai

**Kombinatorika:** counting in two ways, rekursi, fungsi pembangkit, prinsip sarang merpati, invarian & monovarian, pengantar teori graf, kombinatorika ekstremal

**Aljabar:** ketaksamaan (AM-GM, Cauchy-Schwarz, Chebyshev, rearrangement), persamaan fungsional, polinomial lanjut (Vieta, akar rasional, polinomial siklotomik)

**Geometri:** segiempat siklik, kuasa titik, Ceva & Menelaus, garis Euler, lingkaran sembilan titik, pengantar inversi

---

## 7. SPESIFIKASI LAYAR

### 7.1 Beranda (`/`)
- Sapaan + tanggal
- **Kartu besar "Review hari ini"**: jumlah kartu jatuh tempo, tombol mulai. Kalau nol, tampilkan "Tidak ada yang perlu diulang — lanjut materi baru?"
- Baris progres 4 jalur (persen kartu berstatus `kuasai`)
- **Lanjutkan**: kartu terakhir yang dibuka
- Akses cepat: Latihan Acak, Buku Kesalahan, Cari

### 7.2 Belajar (`/belajar`)
- Tab untuk 4 jalur
- Daftar topik dengan cincin progres kecil dan estimasi waktu
- Topik yang prasyaratnya belum dikuasai tetap **bisa dibuka**, tapi tampilkan catatan halus: "Disarankan selesaikan [prasyarat] dulu." Jangan dikunci.

### 7.3 Daftar Kartu (`/belajar/[topicId]`)
- Judul topik, ringkasan, daftar kartu dengan ikon `type`
- Tombol "Mulai dari awal" dan "Latihan topik ini"

### 7.4 Kartu (`/kartu/[cardId]`)

Tata letak dari atas:
1. Judul + label tipe
2. Badan materi (LaTeX ter-render)
3. Blok "Poin kunci" dengan latar berbeda
4. Blok "Jebakan" (kalau ada) dengan aksen peringatan
5. Tombol **Coba soal** → membuka soal-soal kartu ini
6. Setelah soal selesai → tombol penilaian diri: **Lupa / Sulit / Bisa / Mudah**

Navigasi: geser kiri/kanan untuk kartu sebelum/sesudah. Tombol bookmark di header.

### 7.5 Sesi Latihan (`/latihan/sesi`)

Mode latihan yang harus ada:
- **Per topik** — semua soal dalam satu topik
- **Acak** — 10 soal campuran dari materi yang sudah dibuka
- **Kelemahan** — soal dari kartu berstatus `lemah`
- **Simulasi** — 20 soal, ada timer mundur, kunci baru muncul di akhir

Perilaku satu soal:
- Tampilkan `prompt`, opsi dapat disentuh
- Setelah memilih: langsung tampilkan benar/salah + `solution`
- Kalau salah: tampilkan pilihan penyebab kesalahan (4 tombol), simpan ke `error_log`
- Tombol "Lihat petunjuk" tersedia sebelum menjawab
- Progres "7 / 20" di header

Di akhir sesi: skor, waktu, daftar soal yang salah dengan tautan ke kartunya.

### 7.6 Review (`/review`)
Sesi pengulangan terjadwal. Menampilkan kartu jatuh tempo satu per satu: judul dulu, pengguna mencoba mengingat, lalu ketuk untuk membuka isi, lalu menilai diri (Lupa/Sulit/Bisa/Mudah). Nilai itu masuk ke algoritma di Bagian 9.

### 7.7 Buku Kesalahan
Daftar dari `error_log`, dikelompokkan menurut penyebab. Tiap baris: soal, penyebab, catatan pengguna, tautan ke kartu. Bisa ditandai "sudah dipahami" untuk mengarsipkan.

### 7.8 Cari (`/cari`)
Pencarian teks penuh pada judul kartu, badan, dan poin kunci. Indeks dibangun saat build oleh `scripts/build-index.ts`, bukan saat runtime.

### 7.9 Statistik
- Kalender heatmap 90 hari terakhir
- Akurasi per topik (bar horizontal)
- Total kartu dikuasai / total kartu
- Rentetan hari belajar berturut-turut

### 7.10 Pengaturan
Tema terang/gelap/ikut sistem, ukuran font (3 tingkat), jumlah kartu baru per hari (default 10), ekspor progres ke file JSON, reset progres (dengan konfirmasi dua langkah).

---

## 8. RENDER MATEMATIKA — BACA DENGAN TELITI

Ini risiko teknis terbesar proyek. Salah pendekatan di sini akan membuat aplikasi lambat dan sulit diperbaiki belakangan.

**Aturan:**

1. Konten ditulis dalam **Markdown + LaTeX**. LaTeX inline pakai `$...$`, blok pakai `$$...$$`.

2. Komponen `MathText.tsx` merender **satu kartu penuh dalam satu WebView**, bukan satu WebView per rumus. Satu WebView per rumus akan membuat daftar tersendat parah.

3. KaTeX (`katex.min.js`, `katex.min.css`, dan folder font) dibundel di `assets/katex/` dan dimuat lewat `expo-asset` sebagai string HTML inline. **Tidak boleh ada permintaan jaringan.**

4. WebView harus menyesuaikan tingginya sendiri: skrip di dalamnya mengirim `document.body.scrollHeight` lewat `postMessage`, komponen React mengatur tinggi sesuai pesan itu.

5. Tema WebView mengikuti tema aplikasi — warna latar dan teks disuntikkan sebagai CSS variable, bukan di-hardcode.

6. Teks pendek tanpa LaTeX (judul, opsi jawaban sederhana) dirender dengan `<Text>` biasa. Deteksi keberadaan `$` untuk memutuskan. Ini penting untuk performa daftar.

7. Kalau setelah dicoba WebView tetap terasa berat pada daftar panjang, alternatifnya: pra-render LaTeX menjadi SVG saat build lewat skrip Node, simpan sebagai aset. Ajukan opsi ini bila perlu; jangan lakukan tanpa memberi tahu.

**Uji wajib:** buat satu layar contoh berisi 30 kartu dengan LaTeX campuran dan pastikan scroll-nya mulus di perangkat kelas bawah sebelum melanjutkan ke milestone berikutnya.

---

## 9. ALGORITMA PENGULANGAN (SRS)

Gunakan SM-2 yang disederhanakan. Implementasikan di `lib/srs.ts` sebagai fungsi murni agar mudah diuji.

**Masukan:** status kartu saat ini + nilai penilaian diri
**Nilai:** `lupa` = 0, `sulit` = 3, `bisa` = 4, `mudah` = 5

```
function review(card, grade):
    if grade < 3:
        repetitions = 0
        interval = 1
        status = 'lemah'
    else:
        if repetitions == 0:  interval = 1
        elif repetitions == 1: interval = 3
        else:                  interval = round(interval * ease)
        repetitions += 1
        status = repetitions >= 3 ? 'kuasai' : 'belajar'

    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    ease = clamp(ease, 1.3, 2.8)

    due_date = today + interval days
```

**Aturan tambahan:**
- Kartu baru per hari dibatasi sesuai pengaturan (default 10)
- Kartu jatuh tempo selalu didahulukan sebelum kartu baru
- Kalau tunggakan melebihi 50 kartu, tampilkan 50 terlama saja dan beri catatan menenangkan — jangan tampilkan angka menakutkan
- Jawaban salah pada sesi latihan **juga** menurunkan status kartu terkait menjadi `lemah` dan menjadwalkannya besok

---

## 10. DESAIN VISUAL

- **Tema utama gelap**, karena banyak dipakai malam hari. Sediakan terang sebagai opsi.
- Palet: latar `#0F1419`, permukaan `#1A2029`, aksen `#4A9EFF`, benar `#3DD68C`, salah `#FF6B6B`, teks `#E8EDF2`, teks redup `#8B98A5`
- Tipografi: font sistem. Ukuran badan 16sp, judul 20sp, poin kunci 15sp. Tinggi baris 1,6 — materi matematika butuh ruang napas.
- Sudut membulat 12px, bayangan halus, jarak antarkartu 12px
- Target sentuh minimal 48×48dp
- Animasi sesingkat mungkin (150–200ms). Jangan ada animasi yang menunda pengguna membaca.
- Semua ikon dari `@expo/vector-icons`. Jangan pasang paket ikon tambahan.

---

## 11. MILESTONE

Kerjakan berurutan. **Berhenti dan laporkan setelah tiap milestone.** Jangan menggabungkan dua milestone dalam satu jalan.

### M1 — Fondasi
- Inisialisasi proyek Expo + TypeScript + expo-router
- Struktur folder sesuai Bagian 4
- Tema, palet warna, komponen dasar (tombol, kartu, header)
- Skema SQLite dibuat dan terhubung
- **Selesai bila:** aplikasi berjalan di emulator, navigasi antarlayar kosong berfungsi

### M2 — Render matematika
- `MathText.tsx` dengan KaTeX lokal
- Parser Markdown sederhana (bold, italic, daftar, kode)
- Layar uji berisi 30 kartu LaTeX campuran
- **Selesai bila:** LaTeX ter-render benar, scroll mulus, tinggi WebView otomatis, tema gelap/terang bekerja

### M3 — Konten & navigasi
- Skema JSON + validator di `scripts/validate-content.ts`
- Tiga topik contoh terisi penuh (Nilai Mutlak, Eksponen & Logaritma, Limit Fungsi Aljabar) — masing-masing minimal 6 kartu dan 10 soal
- Loader konten, layar Belajar, Daftar Kartu, dan Kartu berfungsi
- **Selesai bila:** bisa menjelajah dari beranda sampai membaca satu kartu utuh

### M4 — Latihan & SRS
- Komponen soal, empat mode latihan
- `lib/srs.ts` + penilaian diri di kartu
- Layar Review, penyimpanan progres, Buku Kesalahan
- **Selesai bila:** sesi latihan lengkap bisa diselesaikan dan jadwal review berubah sesuai jawaban

### M5 — Pelengkap
- Pencarian dengan indeks build-time
- Statistik + heatmap
- Pengaturan, ekspor/reset progres
- Bookmark
- **Selesai bila:** semua layar di Bagian 7 berfungsi

### M6 — Pengisian konten penuh
- Isi seluruh kurikulum Bagian 6 mengikuti panduan Bagian 12
- Jalankan validator sampai bersih
- **Selesai bila:** semua topik punya minimal 5 kartu dan 8 soal

### M7 — Build APK
- Konfigurasi `eas.json`, ikon, splash screen, nama paket
- Hasilkan APK
- **Selesai bila:** file APK terpasang dan berjalan di perangkat nyata

---

## 12. PANDUAN PENULISAN KONTEN

Ini menentukan kualitas aplikasi lebih dari kodenya. Patuhi ketat.

**Panjang kartu:** badan materi 80–200 kata. Kalau lebih, pecah jadi dua kartu.

**Kartu `konsep` harus menjawab "mengapa", bukan hanya "apa".** Contoh yang benar: "Determinan adalah faktor pengali luas. Kalau nol, seluruh bidang dipipihkan jadi garis — dan yang pipih tidak bisa dikembalikan. Itulah sebabnya matriks berdeterminan nol tidak punya invers." Contoh yang salah: "Determinan matriks 2×2 adalah ad − bc."

**Setiap kartu wajib punya minimal 2 soal.** Kartu tanpa soal ditolak validator.

**Distribusi tingkat kesulitan per topik:** kira-kira 30% difficulty 1–2, 50% difficulty 3, 20% difficulty 4–5.

**Solusi harus menunjukkan langkah**, bukan hanya hasil akhir. Tulis seperti guru yang mengerjakan di papan.

**`pitfall` diisi kesalahan spesifik**, bukan nasihat umum. Benar: "Lupa mengalikan turunan dalam pada aturan rantai." Salah: "Hati-hati dalam mengerjakan."

**Gaya bahasa:** kalimat pendek, langsung, tanpa basa-basi motivasional. Sapa pengguna dengan "kamu".

**Konten jalur olimpiade berbeda sifatnya:** lebih banyak kartu `teknik` dan soal pembuktian. Untuk soal pembuktian gunakan `format: "isian"` dengan solusi lengkap, dan turunkan bobot penilaian otomatis — yang dinilai adalah pengguna membandingkan pekerjaannya sendiri dengan solusi.

**Sumber materi awal:** jika pemilik menyediakan berkas di folder `content-source/`, gunakan sebagai bahan mentah. Pecah menjadi kartu sesuai aturan panjang di atas — jangan menyalin bab utuh menjadi satu kartu.

---

## 13. KRITERIA PENERIMAAN

Periksa semua sebelum menyatakan selesai:

**Fungsional**
- [ ] Aplikasi berjalan penuh dalam mode pesawat
- [ ] Semua rumus LaTeX ter-render benar, tidak ada yang tampil sebagai kode mentah
- [ ] Progres bertahan setelah aplikasi ditutup paksa
- [ ] Jadwal review berubah sesuai penilaian diri
- [ ] Jawaban salah tercatat di Buku Kesalahan
- [ ] Pencarian menemukan kartu dari kata di badan materi
- [ ] Ekspor progres menghasilkan file JSON yang bisa dibaca

**Kinerja**
- [ ] Waktu buka dingin di bawah 3 detik
- [ ] Scroll daftar 100+ kartu tanpa tersendat
- [ ] Ukuran APK di bawah 60 MB

**Kualitas**
- [ ] `npx tsc --noEmit` bersih
- [ ] `scripts/validate-content.ts` lolos tanpa error
- [ ] Tidak ada `console.log` tersisa di kode produksi
- [ ] Tidak ada dependensi yang mengakses jaringan

**Konten**
- [ ] Setiap topik punya minimal 5 kartu
- [ ] Setiap kartu punya minimal 2 soal
- [ ] Setiap soal punya solusi berisi langkah

---

## 14. CARA MEMBANGUN APK

Sediakan dua jalur dan dokumentasikan keduanya di `README.md`.

**Jalur A — EAS Build (butuh akun Expo, proses di cloud):**

`eas.json` harus memuat profil yang menghasilkan APK, bukan AAB:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal"
    }
  }
}
```

Perintah: `eas build --platform android --profile preview`

**Jalur B — build lokal (tanpa akun, butuh Android SDK + JDK):**

```
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK berada di `android/app/build/outputs/apk/release/`.

Sertakan di README: versi JDK yang dibutuhkan, cara memasang Android SDK, dan cara membuat keystore untuk penandatanganan rilis.

---

## 15. CATATAN UNTUK CLAUDE CODE

- **Verifikasi versi dependensi lewat dokumentasi resmi sebelum memasang.** Jangan andalkan ingatan tentang versi.
- **Jangan menambah fitur di luar dokumen ini.** Kalau ada ide bagus, tulis di `IDEAS.md` dan lanjutkan pekerjaan.
- **Kalau ada keputusan teknis yang ambigu, pilih yang paling sederhana** dan catat alasannya di `DECISIONS.md`.
- **Tulis tes untuk `lib/srs.ts`.** Bagian ini logika murni dan paling mudah salah secara diam-diam.
- **Commit per milestone** dengan pesan yang jelas.
- Buat `README.md` berisi cara menjalankan, cara menambah konten baru, dan cara membangun APK — ditulis untuk orang yang bukan programmer.
