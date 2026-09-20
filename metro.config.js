// Konfigurasi Metro.
//
// Target utama proyek ini Android. Target web dipakai untuk pemeriksaan
// cepat saat pengembangan, dan expo-sqlite di web memuat wa-sqlite dalam
// bentuk .wasm — ekstensi itu harus didaftarkan sebagai aset.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
