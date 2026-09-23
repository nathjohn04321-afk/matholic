# MathDeck

Aplikasi Android **offline** untuk belajar matematika, dari tingkat dasar
sampai olimpiade. Materi disajikan sebagai kartu pendek plus contoh soal, dan
kartu dimunculkan lagi lewat jadwal pengulangan supaya materi melekat.

Seluruh isi aplikasi dibundel di dalam APK. Aplikasi tidak pernah menghubungi
internet.

> **Status: milestone 1–7 selesai.**
>
> Semua layar berfungsi: membaca materi, latihan soal, pengulangan terjadwal,
> Buku Kesalahan, pencarian, statistik, dan pengaturan. APK bisa dibangun.
>
> Kurikulum terisi **52 topik, 263 kartu, 532 soal**:
>
> | Jalur | Topik | Kartu | Soal |
> |---|--:|--:|--:|
> | Dasar | 10 | 50 | 100 |
> | Menengah | 21 | 108 | 217 |
> | Lanjut | 9 | 45 | 94 |
> | Olimpiade | 12 | 60 | 121 |
>
> Sebaran kesulitan 31% / 48% / 20% terhadap target SPEC 30/50/20.
> Setiap jawaban numerik diverifikasi dengan Python atau sympy sebelum ditulis.
>
> Menambah topik tidak perlu mengubah kode sama sekali; lihat bagian
> "Menambah materi baru" di bawah.

---

## Untuk yang baru pertama membuka repo ini

Yang perlu dipasang di komputer:

1. **Node.js versi 22 atau lebih baru.** Unduh dari <https://nodejs.org>
   (pilih versi LTS). Untuk mengecek, buka Terminal lalu ketik `node --version`.
2. Tidak perlu memasang Android Studio kalau kamu hanya ingin **menjalankan**
   aplikasi di HP. Perlu, kalau kamu ingin **membuat file APK sendiri**
   (lihat bagian "Membangun APK — Jalur B").

## Menjalankan aplikasi

Buka Terminal di folder proyek ini, lalu:

```bash
npm install        # sekali saja, mengunduh semua yang dibutuhkan
npm start          # menyalakan server pengembangan
```

Akan muncul kode QR di Terminal.

- **Di HP Android:** pasang aplikasi **Expo Go** dari Play Store, buka, lalu
  pindai kode QR itu. HP dan komputer harus di Wi-Fi yang sama.
- **Di emulator:** jalankan `npm run android` (butuh Android Studio).

Kalau ada yang berubah di kode, aplikasi di HP ikut berubah sendiri.

## Memeriksa kode sebelum menyimpan pekerjaan

```bash
npm run typecheck          # memeriksa kesalahan tipe TypeScript
npm test                   # menguji algoritma pengulangan (lib/srs.ts)
npm run validate-content   # memeriksa seluruh materi terhadap aturan penulisan
```

Ketiganya harus lolos tanpa pesan error. Perintah yang sama dijalankan otomatis
di GitHub setiap kali ada perubahan dikirim.

---

## Menambah materi baru

Materi bukan bagian dari kode — semuanya berkas JSON di folder `content/`,
terbagi empat jalur:

```
content/
├── dasar/        bilangan, aljabar dasar, geometri bidang
├── menengah/     21 materi lomba — inti aplikasi
├── lanjut/       sisa kurikulum SMA
└── olimpiade/    teori bilangan, kombinatorika, aljabar, geometri
```

Satu berkas = satu topik. Contoh `content/menengah/alj-nilai-mutlak.json`:

```json
{
  "id": "alj-nilai-mutlak",
  "track": "menengah",
  "title": "Persamaan & Pertidaksamaan Nilai Mutlak",
  "order": 3,
  "prerequisites": ["alj-persamaan-linear"],
  "estimatedMinutes": 25,
  "summary": "Nilai mutlak sebagai jarak.",
  "tags": ["aljabar", "un"],
  "cards": [
    {
      "id": "alj-nilai-mutlak-c1",
      "type": "konsep",
      "title": "Nilai mutlak adalah jarak",
      "body": "$|x - a|$ adalah **jarak** $x$ dari titik $a$.",
      "keyPoints": ["$|x| < a \\iff -a < x < a$"],
      "pitfall": "Mengkuadratkan $|A| = B$ padahal $B$ bisa negatif.",
      "questions": [ ... ]
    }
  ]
}
```

Aturan menulis yang wajib diikuti:

- **Badan kartu 80–200 kata.** Lebih dari itu, pecah jadi dua kartu.
- **Setiap kartu minimal 2 soal.** Kartu tanpa soal ditolak.
- **Solusi harus menunjukkan langkah**, bukan cuma hasil akhir.
- `pitfall` diisi kesalahan spesifik, bukan nasihat umum.
- Rumus ditulis dengan LaTeX: `$...$` untuk di tengah kalimat, `$$...$$` untuk
  baris sendiri.
- `type` kartu: `konsep`, `rumus`, `prosedur`, `contoh`, `jebakan`, `teknik`.

Panduan lengkap ada di SPEC.md bagian 12.

Setelah menambah atau mengubah berkas, jalankan tiga perintah ini:

```bash
npm run validate-content    # periksa aturan penulisan
npm run build-content-index # daftarkan topik baru ke aplikasi
npm run build-index         # perbarui indeks pencarian
```

Perintah kedua penting: aplikasi memuat topik lewat daftar yang dibangkitkan,
jadi topik baru tidak akan muncul sampai perintah itu dijalankan. GitHub akan
menolak perubahan yang lupa menjalankannya.

Pemeriksa menolak kartu yang badan materinya di luar 80–200 kata, kartu dengan
kurang dari dua soal, tanda `$` yang tidak berpasangan, kunci jawaban di luar
jangkauan pilihan, dan id yang kembar.

---

## Membangun APK

### Jalur A — EAS Build (lewat cloud, butuh akun Expo gratis)

Paling mudah: tidak perlu memasang Android SDK di komputer.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Setelah selesai, tautan unduhan APK muncul di Terminal dan di
<https://expo.dev>.

### Jalur B — build di komputer sendiri (tanpa akun)

Yang perlu dipasang lebih dulu:

- **JDK 17** — `java -version` harus menunjukkan versi 17.
- **Android SDK.** Cara termudah: pasang
  [Android Studio](https://developer.android.com/studio), buka menu
  *Settings → Languages & Frameworks → Android SDK*, lalu centang
  **Android SDK Platform 35** dan **Android SDK Build-Tools**.
- Set variabel lingkungan `ANDROID_HOME` ke folder SDK itu
  (biasanya `~/Android/Sdk` di Linux, `~/Library/Android/sdk` di macOS,
  `C:\Users\<nama>\AppData\Local\Android\Sdk` di Windows).

Lalu:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

File APK berada di `android/app/build/outputs/apk/release/`.

### Membuat keystore untuk rilis

APK rilis harus ditandatangani. Buat kunci sekali saja:

```bash
keytool -genkeypair -v \
  -keystore mathdeck.keystore \
  -alias mathdeck \
  -keyalg RSA -keysize 2048 -validity 10000
```

Perintah itu menanyakan kata sandi dan identitas — simpan baik-baik, kalau
hilang kamu tidak bisa memperbarui aplikasi yang sudah terpasang. **Jangan
pernah** memasukkan berkas `.keystore` ke Git (sudah dicegah di `.gitignore`).

Lalu isi `android/gradle.properties`:

```properties
MATHDECK_UPLOAD_STORE_FILE=mathdeck.keystore
MATHDECK_UPLOAD_KEY_ALIAS=mathdeck
MATHDECK_UPLOAD_STORE_PASSWORD=<kata sandi>
MATHDECK_UPLOAD_KEY_PASSWORD=<kata sandi>
```

### Jalur C — unduh langsung dari GitHub (paling mudah, tanpa memasang apa pun)

Setiap kali perubahan dikirim ke GitHub, APK dibangun otomatis di sana lalu
diterbitkan ke halaman Releases.

**Cara tercepat, bisa langsung dari HP:**

<https://github.com/nathjohn04321-afk/matholic/releases/tag/apk-terbaru>

Buka tautan itu, ketuk `mathdeck.apk` di bagian **Assets**. Tidak perlu login
dan tidak perlu membuka zip. Tag-nya tetap, isinya ditimpa setiap build, jadi
tautan ini selalu menunjuk APK terbaru.

Ada dua berkas di sana:

| Berkas | Untuk |
|---|---|
| `mathdeck.apk` | Hampir semua HP Android (arm64-v8a, sejak sekitar 2017) |
| `mathdeck-armeabi-v7a.apk` | HP 32-bit yang lebih tua |

Ambil yang pertama kecuali HP-mu memang sangat lama. Kalau salah pilih, Android
akan menolak memasangnya dan kamu tinggal mengunduh yang satu lagi.

APK dirakit terpisah per arsitektur dengan sengaja. APK gabungan memuat pustaka
native untuk keempat arsitektur sekaligus — termasuk x86 dan x86_64 yang hanya
dipakai emulator — dan ukurannya membengkak jadi 107 MB, melewati batas 60 MB
pada SPEC.md bagian 13.

Saat memasangnya, Android akan meminta izin **"Instal aplikasi tidak dikenal"**
untuk peramban atau pengelola berkas yang kamu pakai — wajar untuk APK yang
tidak lewat Play Store.

**Alternatif lewat Actions** (butuh login GitHub, hasilnya berupa zip):

1. Buka halaman **Actions** pada repositori ini
2. Klik run paling atas, tunggu tanda centang hijau
3. Gulir ke bawah ke bagian **Artifacts**
4. Unduh **mathdeck-apk**, lalu buka berkas zip-nya

Alur ini ada di `.github/workflows/build-apk.yml`.

---

## Peta folder

| Folder | Isi |
|---|---|
| `app/` | Layar aplikasi. Nama berkas = alamat layar (expo-router). |
| `components/` | Komponen yang dipakai ulang: tombol, kartu, header. |
| `content/` | **Seluruh materi** dalam bentuk JSON. |
| `lib/` | Logika: database, algoritma pengulangan, tema, tipe data. |
| `assets/` | Gambar, font, dan KaTeX (mesin penulis rumus). |
| `scripts/` | Alat bantu: pemeriksa konten, pembangun indeks pencarian. |

Dokumen pendamping:

- **SPEC.md** — spesifikasi lengkap produk.
- **DECISIONS.md** — keputusan teknis dan alasannya.
- **IDEAS.md** — ide di luar spesifikasi, belum dikerjakan.
