# FLOWMATE

Web intervensi dismenore: skrining WaLIDD, kuesioner kualitas hidup, rekomendasi nonfarmakologis, jurnal harian, FEM AI.

## Menjalankan
Jalankan lewat server lokal (bukan klik dua kali index.html):
    python3 -m http.server 8080      # lalu buka http://localhost:8080
Butuh internet untuk Tailwind, font, jsPDF (PDF) dan SheetJS (Excel) via CDN.

## Akun awal (ubah di src/assets/js/db.js -> seedUsers)
- superadmin / Flowmate@2026
- sitirahma (pasien contoh) / Pasien@2026

## Struktur
- src/assets/js/db.js         penyimpanan (localStorage) + akun awal -> ganti ke API saat backend
- src/assets/js/walidd.js     bobot & kategori WaLIDD, kuesioner 15 butir, red flag, aturan rekomendasi
- src/assets/js/fembot_kb.js  basis pengetahuan FEM AI (tambah topik cukup tambah baris T(...))
- src/assets/js/ml_engine.js  mesin jawaban FEM AI
- src/assets/js/ref_data.js   statistik dari dataset (dibuat oleh scripts/build_reference.py)
- src/assets/js/export.js     PDF pasien & Excel admin
- src/pages/pasien | admin    halaman per peran
