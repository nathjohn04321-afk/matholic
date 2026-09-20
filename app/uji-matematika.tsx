/**
 * Layar uji render matematika (SPEC.md bagian 8, "Uji wajib").
 *
 * 30 kartu berisi LaTeX campuran — sebaris, blok, matriks, pecahan
 * bertingkat, integral, sigma — untuk memastikan scroll tetap mulus dan
 * tinggi WebView menyesuaikan sendiri.
 *
 * Layar ini alat bantu pengembangan, bukan bagian alur belajar.
 */

import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MathText } from '@/components/MathText';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { spacing } from '@/lib/theme';

interface Contoh {
  judul: string;
  isi: string;
}

const CONTOH: Contoh[] = [
  {
    judul: 'Nilai mutlak sebagai jarak',
    isi: 'Definisi yang berguna bukan "membuat positif", melainkan:\n\n$|x - a|$ adalah **jarak** $x$ dari titik $a$.\n\nKarena itu $|x-5| = 3$ berarti: cari titik berjarak 3 dari 5. Jawabannya langsung terlihat: $2$ dan $8$.',
  },
  {
    judul: 'Rumus kuadrat',
    isi: 'Akar persamaan $ax^2+bx+c=0$ dengan $a \\neq 0$:\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$\nBentuk $b^2-4ac$ disebut diskriminan.',
  },
  {
    judul: 'Pertidaksamaan nilai mutlak',
    isi: '- $|x| < a \\iff -a < x < a$ (terkurung)\n- $|x| > a \\iff x < -a$ atau $x > a$ (terpisah)\n- $|x| = \\sqrt{x^2}$',
  },
  {
    judul: 'Matriks 2×2 dan determinan',
    isi: 'Untuk $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ berlaku $\\det A = ad - bc$.\n$$A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$$',
  },
  {
    judul: 'Integral tentu',
    isi: 'Luas daerah di bawah kurva:\n$$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$\ndengan $F$ antiturunan dari $f$.',
  },
  {
    judul: 'Notasi sigma',
    isi: 'Jumlah $n$ bilangan asli pertama:\n$$\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$$\nDan kuadratnya: $\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}$.',
  },
  {
    judul: 'Limit',
    isi: 'Limit istimewa trigonometri:\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$\nDipakai untuk $\\lim_{x \\to 0} \\frac{\\sin 3x}{5x} = \\frac{3}{5}$.',
  },
  {
    judul: 'Turunan aturan rantai',
    isi: 'Kalau $y = f(g(x))$ maka $\\frac{dy}{dx} = f\'(g(x)) \\cdot g\'(x)$.\n\nContoh: $\\frac{d}{dx}\\sin(x^2) = 2x\\cos(x^2)$.',
  },
  {
    judul: 'Eksponen dan logaritma',
    isi: '- ${}^a\\log b = c \\iff a^c = b$\n- ${}^a\\log(xy) = {}^a\\log x + {}^a\\log y$\n- $a^{m} \\cdot a^{n} = a^{m+n}$',
  },
  {
    judul: 'Pecahan bertingkat',
    isi: 'Sederhanakan:\n$$\\cfrac{1}{1 + \\cfrac{1}{1 + \\cfrac{1}{2}}} = \\cfrac{1}{1 + \\cfrac{2}{3}} = \\frac{3}{5}$$',
  },
  {
    judul: 'Barisan geometri',
    isi: 'Suku ke-$n$: $U_n = ar^{n-1}$. Jumlah $n$ suku pertama:\n$$S_n = \\frac{a(r^n - 1)}{r - 1}, \\quad r \\neq 1$$',
  },
  {
    judul: 'Teorema Pythagoras',
    isi: 'Pada segitiga siku-siku dengan sisi miring $c$: $a^2 + b^2 = c^2$.\n\nTripel yang sering muncul: $(3,4,5)$, $(5,12,13)$, $(8,15,17)$.',
  },
  {
    judul: 'Trigonometri dasar',
    isi: 'Identitas pokok: $\\sin^2\\theta + \\cos^2\\theta = 1$.\n$$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}, \\quad \\cos 2\\theta = 1 - 2\\sin^2\\theta$$',
  },
  {
    judul: 'Peluang',
    isi: 'Kalau $A$ dan $B$ saling lepas: $P(A \\cup B) = P(A) + P(B)$.\n\nUmumnya: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.',
  },
  {
    judul: 'Kombinasi dan permutasi',
    isi: '$$C(n,k) = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}, \\qquad P(n,k) = \\frac{n!}{(n-k)!}$$',
  },
  {
    judul: 'Vektor',
    isi: 'Hasil kali titik: $\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta$.\n\nPanjang: $|\\vec{a}| = \\sqrt{a_1^2 + a_2^2 + a_3^2}$.',
  },
  {
    judul: 'Tanpa rumus sama sekali',
    isi: 'Kartu ini **tidak** punya LaTeX. Seharusnya dirender dengan `<Text>` biasa, bukan WebView — itu yang menjaga daftar tetap ringan.\n\n- butir pertama\n- butir kedua',
  },
  {
    judul: 'Akar bertingkat',
    isi: '$$\\sqrt{2 + \\sqrt{3}} = \\frac{\\sqrt{6} + \\sqrt{2}}{2}$$\nBisa diperiksa dengan mengkuadratkan kedua ruas.',
  },
  {
    judul: 'Sistem persamaan',
    isi: 'Selesaikan:\n$$\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}$$\nJumlahkan kedua baris: $3x = 9$, jadi $x = 3$ dan $y = 1$.',
  },
  {
    judul: 'Fungsi komposisi',
    isi: 'Kalau $f(x) = 2x+1$ dan $g(x) = x^2$ maka $(f \\circ g)(x) = 2x^2 + 1$, sedangkan $(g \\circ f)(x) = (2x+1)^2$.',
  },
  {
    judul: 'Deret tak hingga',
    isi: 'Untuk $|r| < 1$:\n$$S_\\infty = \\frac{a}{1-r}$$\nContoh: $1 + \\frac{1}{2} + \\frac{1}{4} + \\cdots = 2$.',
  },
  {
    judul: 'Modulo',
    isi: 'Notasi $a \\equiv b \\pmod{m}$ berarti $m \\mid (a-b)$.\n\nContoh: $17 \\equiv 2 \\pmod 5$ karena $5 \\mid 15$.',
  },
  {
    judul: 'Ketaksamaan AM-GM',
    isi: 'Untuk bilangan positif:\n$$\\frac{a+b}{2} \\ge \\sqrt{ab}$$\nSama dengan bila $a = b$.',
  },
  {
    judul: 'Lingkaran',
    isi: 'Persamaan pusat $(a,b)$ jari-jari $r$:\n$$(x-a)^2 + (y-b)^2 = r^2$$',
  },
  {
    judul: 'Statistik',
    isi: 'Rata-rata: $\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i$.\n\nSimpangan baku: $s = \\sqrt{\\frac{1}{n}\\sum (x_i - \\bar{x})^2}$.',
  },
  {
    judul: 'Program linear',
    isi: 'Maksimumkan $z = 3x + 4y$ dengan syarat $x + y \\le 10$, $x \\ge 0$, $y \\ge 0$. Nilai maksimum ada di titik pojok.',
  },
  {
    judul: 'Rumus salah tulis (uji ketahanan)',
    isi: 'Rumus rusak berikut harus tampil merah, bukan menjatuhkan kartu: $\\frac{1}{$ dan $\\unknowncommand{x}$.',
  },
  {
    judul: 'Dolar yang di-escape',
    isi: 'Harga buku itu \\$25 — tanda dolar ini **bukan** awal rumus, jadi kalimatnya harus utuh.',
  },
  {
    judul: 'Polinomial',
    isi: 'Menurut Vieta, untuk $ax^2+bx+c=0$: $x_1 + x_2 = -\\frac{b}{a}$ dan $x_1 x_2 = \\frac{c}{a}$.',
  },
  {
    judul: 'Rumus panjang (uji geser mendatar)',
    isi: '$$\\int_0^\\infty \\frac{x^{s-1}}{e^x - 1}\\,dx = \\Gamma(s)\\zeta(s) = \\sum_{n=1}^{\\infty}\\int_0^\\infty x^{s-1}e^{-nx}\\,dx$$',
  },
];

export default function UjiMatematika() {
  const data = useMemo(
    () => CONTOH.map((c, i) => ({ ...c, key: `uji-${i}` })),
    []
  );

  return (
    <Screen>
      <Header title="Uji render matematika" subtitle={`${CONTOH.length} kartu`} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        // Jendela render dijaga kecil: hanya beberapa WebView hidup sekaligus.
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <Card style={styles.card}>
            <View style={styles.cardHead}>
              <Text variant="label" muted weight="600">
                {index + 1}
              </Text>
              <Text weight="600" style={styles.cardTitle}>
                {item.judul}
              </Text>
            </View>
            <MathText content={item.isi} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'baseline',
  },
  cardTitle: {
    flex: 1,
  },
});
