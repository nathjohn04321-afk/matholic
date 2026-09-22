# DECISIONS.md

Catatan keputusan teknis yang ambigu di SPEC.md, beserta alasannya.
Aturan yang dipakai: **pilih yang paling sederhana** (SPEC.md bagian 15).

---

## M1 — Fondasi

### Expo SDK 57

SPEC.md bagian 3 meminta "SDK stabil terbaru" dan melarang menebak versi dari
ingatan. Versi diambil dari dist-tag `latest` di registry npm saat proyek
dibuat: **Expo SDK 57.0.24**, React Native 0.86.3, React 19.2.3.

`docs.expo.dev` diblokir oleh proxy jaringan lingkungan kerja ini, jadi versi
paket native tidak diambil dari dokumentasi melainkan dari
`node_modules/expo/bundledNativeModules.json` — daftar versi yang dipasangkan
Expo sendiri untuk SDK ini. Ini penting: `npm view <paket> version` memberi
versi `latest` yang **tidak** cocok dengan SDK 57.

| Paket | `latest` di npm | Dipakai (sesuai SDK 57) |
|---|---|---|
| `react-native-webview` | 14.0.1 | **13.16.1** |
| `@react-native-async-storage/async-storage` | 3.1.1 | **2.2.0** |

### Proyek diletakkan di akar repositori

SPEC.md bagian 4 menggambarkan folder `mathdeck/` sebagai akar. Repositori ini
sendiri bernama `matholic`, jadi isi `mathdeck/` ditaruh langsung di akar repo
supaya tidak ada folder bersarang tanpa guna. Nama aplikasi tetap **MathDeck**.

### Template Expo dirampingkan

`create-expo-app` template bawaan memasang `@expo/ui`, `expo-glass-effect`,
`expo-symbols`, `expo-image`, `expo-web-browser`, dan `expo-device`. Semuanya
dilepas: SPEC.md bagian 3 melarang library UI berat dan meminta komponen dibuat
sendiri. Template juga memakai folder `src/`; diubah ke tata letak SPEC.md
bagian 4 (`app/`, `components/`, `lib/`, `content/`), dan alias `@/*` diarahkan
ke akar repo.

### Token tema di `lib/theme.ts`

SPEC.md bagian 4 tidak menyebut berkas tema. Token (palet, tipografi, jarak)
ditaruh di `lib/theme.ts` karena isinya data murni, sedangkan Context-nya di
`components/ThemeProvider.tsx` karena itu komponen React.

### Palet terang diturunkan sendiri

SPEC.md bagian 10 hanya memberi palet gelap dan menyebut terang sebagai opsi.
Palet terang diturunkan dengan mempertahankan peran tiap warna dan menggelapkan
aksen (`#4A9EFF` → `#1B6FD6`) supaya kontras teks di atas latar terang tetap
memadai.

### Migrasi SQLite bernomor

Migrasi 1 menyalin SQL di SPEC.md bagian 5.5 **apa adanya** supaya gampang
diaudit terhadap spesifikasi. Perubahan sesudahnya jadi migrasi terpisah:

- **Migrasi 2** menambah kolom `error_log.resolved_at` — dibutuhkan tombol
  "sudah dipahami" di Buku Kesalahan (SPEC.md 7.7), yang tidak punya tempat di
  skema asli — plus indeks untuk query jatuh tempo, status, dan riwayat.

Versi dilacak lewat `PRAGMA user_version`.

### Satu koneksi database bersama

`lib/db.ts` menyimpan satu promise koneksi. Kalau pembukaan gagal, promise-nya
dibuang supaya percobaan berikutnya tidak tersangkut di kegagalan lama — layar
akar menyediakan tombol "Coba lagi".

### `ProgressRing` ditunda

SPEC.md bagian 4 menyebut `components/ProgressRing.tsx`, tapi M1 menyebut
komponen dasar secara spesifik: tombol, kartu, header. Cincin progres baru
berguna ketika ada angka progres nyata, jadi dibuat bersama layar Belajar dan
Beranda (M3/M5) agar tidak dibuat dua kali.

### Layar Pengaturan sebagian aktif di M1

Pengaturan ada di M5, tapi tema dan ukuran font adalah hasil kerja M1. Dua
pengatur itu dibuat berfungsi sekarang supaya sistem tema benar-benar teruji;
sisanya (jumlah kartu baru, ekspor, reset) menyusul di M5.

### `eas.json` ditunda ke M7

Ada di daftar folder SPEC.md bagian 4, tapi M7 yang bertugas mengonfigurasi
build. Menuliskannya sekarang hanya akan jadi berkas yang belum pernah diuji.

### Tema react-navigation ikut disetel

`components/Screen.tsx` sudah mewarnai latar sesuai palet, tapi navigator
punya temanya sendiri untuk permukaan di luar layar — termasuk celah yang
terlihat saat transisi geser. Bawaannya tema terang (`#F2F2F2`), yang
berkedip abu-abu di balik aplikasi gelap. Ketahuan saat menelusuri tata letak
render: ada lapisan `rgb(242, 242, 242)` menutupi `#0F1419` milik kita.

Perbaikannya: palet aplikasi disuntikkan ke `ThemeProvider` milik expo-router
di `app/_layout.tsx`. Di SDK 57 expo-router memuat react-navigation di dalam
dirinya, jadi `ThemeProvider`, `DarkTheme`, dan `DefaultTheme` diimpor dari
`expo-router`, **bukan** dari `@react-navigation/native` — paket itu tidak
ada di `node_modules`.

### `metro.config.js` mendaftarkan `.wasm`

Target proyek ini Android. Target web dipakai untuk memeriksa tampilan dan
navigasi dengan cepat selama pengembangan — di lingkungan tanpa emulator,
itu satu-satunya cara menjalankan aplikasi sungguhan. `expo-sqlite` di web
memuat wa-sqlite sebagai `.wasm`, dan Metro menolaknya sampai ekstensi itu
didaftarkan sebagai aset. Tidak berpengaruh pada bundel Android.

---

## M6 — Cakupan konten

Kurikulum terisi **52 topik, 263 kartu, 532 soal**: 10 Dasar, 21 Menengah,
9 Lanjut, 12 Olimpiade. Sebaran kesulitan 31/48/20 terhadap target SPEC 30/50/20.

SPEC.md bagian 6 menyebut sekitar 68 topik sebagai gambaran cakupan, bukan
daftar yang mengikat. Yang ditulis di sini adalah 52 topik yang masing-masing
memenuhi seluruh aturan bagian 12 — badan 80–200 kata, minimal dua soal per
kartu, kartu konsep yang menjawab "mengapa", jebakan yang spesifik, dan solusi
berlangkah. Beberapa topik dalam daftar SPEC digabung karena materinya memang
satu alur (misalnya substitusi dan integral parsial menjadi satu topik teknik
integrasi), dan itu menghasilkan kartu yang lebih runtut daripada memecahnya
demi mencocokkan hitungan.

Perkakas yang dipakai dan tetap tersedia untuk menambah topik:
- validator menolak kartu yang melanggar aturan bagian 12
- `npm run build-content-index` mendaftarkan topik baru tanpa menyentuh kode
- indeks pencarian ikut terbangun ulang
- CI menolak perubahan yang lupa menjalankan generatornya

### Letak kunci jawaban diacak, dan validator menjaganya

Saat kurikulum selesai, 89% kunci jawaban ternyata berada di pilihan pertama.
Penyebabnya cara penulisannya: jawaban benar ditulis lebih dulu, pengecohnya
menyusul. Akibatnya nyata — siapa pun yang menyadarinya bisa menjawab benar
tanpa memahami materinya sama sekali, dan aplikasinya berhenti mengajar.

Urutan pilihan diacak ulang dengan kunci yang dibangkitkan dari id soal, jadi
hasilnya tetap sama setiap kali dijalankan. Sebarannya kini 27/22/27/24.

Sebelum diacak, sembilan pembahasan yang merujuk pilihan lewat posisinya
("pilihan terakhir keliru karena...") ditulis ulang supaya merujuk isinya.
Rujukan posisional akan menjadi salah begitu urutannya berubah — dan menyebut
isi pilihannya memang lebih jelas dibaca.

Validator sekarang menolak berkas konten yang salah satu posisinya melewati
40%, dan memperingatkan di atas 33%. Pemeriksaannya baru berlaku mulai 40 soal
pilihan ganda, supaya kumpulan konten kecil tidak gagal karena kebetulan.

Pemeriksaan ini diuji dengan menjalankannya pada konten sebelum diacak; ia
memang menolaknya.

### `order` wajib unik per jalur

Urutan topik pada layar Belajar diambil dari `topic.order`. Dua topik yang
`order`-nya sama membuat urutannya bergantung pada urutan pembacaan berkas —
stabil, tapi bukan urutan yang disengaja siapa pun. Dua tabrakan semacam ini
sempat ada (`das-bilangan` dengan `das-linear`, dan `alj-fungsi` dengan
`kal-limit-aljabar`) dan baru ketahuan saat jalur Menengah hampir penuh.

Validator sekarang menolaknya, dan aturan itu diuji dengan tabrakan buatan
untuk memastikan pemeriksaannya benar-benar berjalan.

### Jawaban soal diverifikasi dengan program, bukan dikira-kira

Saat menulis topik teori bilangan, dua kunci jawaban ternyata salah: `3a41`
habis dibagi 9 pada $a=1$ (bukan $0$), dan $7219 \bmod 11 = 3$ (bukan $0$).
Keduanya ketahuan karena aritmetikanya dihitung ulang dengan Python sebelum
kontennya ditulis. Sejak itu setiap jawaban numerik diperiksa lebih dulu —
integral diperiksa dengan sympy, modulo dengan `pow(a, b, m)`.

Kesalahan kunci jawaban adalah jenis bug terburuk untuk aplikasi belajar:
diam-diam mengajarkan yang keliru.

---

## M7 — Build APK

### Build dipindahkan ke GitHub Actions

Lingkungan tempat kode ini ditulis memblokir `dl.google.com` (proxy menjawab 403
untuk CONNECT), padahal di situlah Android SDK, Android Gradle Plugin, dan
seluruh pustaka AndroidX berada. `maven.google.com` hanya mengalihkan ke sana.
`api.expo.dev` juga diblokir, jadi EAS Build pun tidak bisa dipakai dari sini.

Runner ubuntu GitHub sudah membawa Android SDK, jadi build dipindahkan ke sana.
Berkas APK-nya sendiri juga tidak bisa diunduh dari lingkungan ini — penyimpanan
artifact GitHub ada di blob Azure, yang diblokir oleh kebijakan yang sama.

### Penandatanganan memakai kunci debug

Template Expo menyetel `buildTypes.release` memakai `signingConfigs.debug`,
jadi APK-nya langsung bisa dipasang tanpa menyiapkan keystore. Ini sama dengan
yang dihasilkan `eas build --profile preview` untuk distribusi internal.

Untuk rilis sungguhan ke Play Store, keystore sendiri wajib dibuat — caranya
ada di README. Keystore tidak dibuat di sini karena kuncinya harus dipegang
pemilik aplikasi, bukan dibangkitkan lalu ditinggal di dalam repositori.

### Ikon dibuat sendiri

Ikon bawaan template adalah logo Expo. Diganti dengan dua tumpuk kartu dan
tanda akar, memakai palet SPEC.md bagian 10. Ikon adaptif Android dipisah jadi
foreground, background, dan monochrome (untuk themed icon Android 13+), dengan
ruang aman lebih lebar pada foreground supaya tidak terpotong saat dipangkas
bulat.

### CI menolak berkas bangkitan yang basi

`lib/content-index.ts`, `lib/search-index.json`, dan `lib/katex-css.ts` ikut
di-commit supaya `npm ci && npm start` langsung jalan. Risikonya, seseorang bisa
menambah topik tapi lupa menjalankan generatornya — topiknya lalu tidak muncul
di aplikasi tanpa pesan error apa pun. CI membangun ulang ketiganya dan gagal
bila hasilnya berbeda dari yang di-commit.
