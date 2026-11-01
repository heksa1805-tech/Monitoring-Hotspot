# Monitoring Hotspot Karhutla TMK
Konfigurasi: wilayah PBPH, MODIS + VIIRS NRT, pembaruan terjadwal 3 jam.

## Instalasi pada repository
1. Salin seluruh isi folder ini ke root repository `Dashboard-karhutla-TMK`.
2. Tambahkan batas PBPH resmi TMK sebagai `data/batas_pbph.geojson` (Polygon/MultiPolygon, WGS84/EPSG:4326).
3. Repository Settings → Secrets and variables → Actions → New repository secret:
   - Name: `FIRMS_MAP_KEY`
   - Value: MAP_KEY NASA FIRMS pribadi.
4. Pastikan Actions diaktifkan, lalu jalankan workflow `Update NASA FIRMS Hotspots` dengan Run workflow.
5. Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
6. Buka URL GitHub Pages repository.

## Catatan penting
- NASA Area API membatasi day range 1–5 hari; workflow mengambil 5 hari terakhir untuk semua sensor NRT yang dipilih.
- Pencarian dilakukan pada bounding box poligon PBPH, lalu titik di luar poligon dibuang dengan point-in-polygon.
- Jadwal GitHub Actions berjalan setiap 3 jam (UTC); waktu mulai dapat bergeser karena antrean GitHub.
- Confidence mengikuti label asli NASA; interpretasikan sesuai produk sensor. Hotspot bukan bukti kebakaran terkonfirmasi.
- Arsip saat ini menampilkan data terbaru hasil pengambilan, bukan database historis permanen. Untuk histori jangka panjang, tambahkan mekanisme append/arsip harian.
