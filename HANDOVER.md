# DOKUMEN SERAH TERIMA PROYEK (PROJECT HANDOVER)

**Sistem Kasir Arunika (Warmindo & Cafe POS Suite)**

---

## 1. Ringkasan Eksekutif Proyek

### 1.1 Tentang Sistem

**Sistem Kasir Arunika** adalah platform Point of Sale (POS) dan Enterprise Resource Planning (ERP) mini berbasis web yang dirancang khusus untuk operasional bisnis Food & Beverage (F&B) seperti kafe, warmindo, resto, dan kedai kopi.

Sistem ini tidak hanya berfungsi sebagai pencatat transaksi kasir biasa, melainkan dirancang sebagai solusi pencegahan kebocoran bisnis (**Fraud Prevention & Inventory Control**) dengan fitur unggulan:

- **Resep & Bahan Baku Otomatis (Bill of Materials / BOM)**: Penjualan 1 porsi menu otomatis memotong takaran bahan baku mentah (misal: gramasi beras, butir telur, ml minyak).
- **Audit Trail Anti-Kecurangan**: Setiap perubahan stok barang jadi maupun bahan baku mentah tercatat otomatis (siapa pelakunya, kapan, berapa delta perubahan, dan alasan).
- **Rekonsiliasi Stok (Stock Opname) & Anomaly Detection**: Sistem menghitung estimasi sisa stok secara matematis dan membandingkannya dengan hitungan fisik riil. Jika selisih > 5%, sistem otomatis menandai anomali dengan banner peringatan.
- **Perhitungan Laba Kotor Realtime**: Menghitung _Gross Profit_ riil berdasarkan Harga Pokok Penjualan (HPP / _Cost of Goods Sold_), bukan sekadar omzet kotor.
- **Manajemen Shift Kasir Terintegrasi**: Mengontrol kas modal awal, penerimaan tunai/non-tunai, perhitungan lembar uang fisik laci kasir, hingga selisih kas saat pergantian shift.

---

## 2. Arsitektur & Teknologi (Tech Stack)

### 2.1 Backend (`pos-backend`)

- **Framework**: Laravel 13.x (PHP 8.3+)
- **Autentikasi**: Laravel Sanctum (Token-based Bearer Authentication)
- **Database**: MySQL / MariaDB (Mendukung SQLite untuk lokal dev/testing)
- **Pola Desain**: _Service Layer Pattern_ (Semua kalkulasi uang, mutasi stok, dan laporan diisolasi di service khusus, bukan di controller)
- **Pengujian Unit**: PHPUnit 12.x (Mencakup test kalkulasi harga, mutasi stok bahan, void, waste, dan rekonsiliasi anomali)

### 2.2 Frontend (Standarisasi React)

- **Framework**: React 18 (Hooks & Functional Components)
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router DOM (dengan Protected Route RBAC)
- **Styling**: Tailwind CSS
- **Icon Set**: Lucide React
- **Status Migrasi**: Frontend kasir lama berbasis Vue 3 telah dihapus total. Sistem antarmuka distandarisasi ke ekosistem React 18 (selaras dengan `cafe-frontend`).
- **Hardware & Device Target**:
  - _HID Barcode Scanner_: Keyboard event listener stream USB/Bluetooth barcode scanner via custom hook.
  - _Sound Feedback_: Web Audio API native synthesizer (chime/beep transaksi).

### 2.3 Dokumentasi & Knowledge Base (`docs/`)

Repositori dilengkapi folder `docs/` yang berisi cetak biru komprehensif:

- `DOMAIN.md`: Model entitas, skema database, rumus keuangan, dan service layer.
- `CODEMAP.md`: Panduan titik awal perubahan kode per fitur.
- `API.md`: Kamus endpoint REST API lengkap.
- `FORECASTING_AI_PLAN.md`: Cetak biru lengkap arsitektur hybrid microservice peramalan inventaris F&B.

### 2.4 AI & Forecasting Microservice Engine (`forecasting-engine`)

- **Framework**: Python 3.14 + FastAPI + Uvicorn (Port 8001)
- **Model Routing**:
  - *Tier 1 (Fast-Moving Items)*: AutoETS (Exponential Smoothing Holt-Winters dengan Weekend Seasonality Factor & Safety Stock P90).
  - *Tier 2 (Intermittent Demand)*: Croston's Method untuk bahan baku dengan pemakaian berselang/sporadis.
  - *Tier 3 (Cold-Start / Sparse Data)*: Weighted Moving Average (WMA) sebagai proteksi bahan baru.
- **Hybrid Decoupled Architecture**:
  - Background scheduler (`forecast:generate-daily`) berjalan otomatis pukul 01:00 WIB, menyimpan snapshot ter-materialisasi ke tabel `forecast_snapshots` & briefing naratif AI ke `ai_briefing_logs`.
  - Event-driven Real-time Stock Sync: Setiap mutasi stok bahan baku (`Ingredient::saved`) otomatis menyelaraskan sisa hari (`days_until_stockout`), estimasi biaya belanja, dan status urgensi tanpa membebani server dengan kalkulasi time-series ulang.
  - Silent Fallback: Jika microservice Python offline, Laravel fallback ke kalkulasi statistik internal dalam 1.5s tanpa melempar error 500.
  - Peluncuran 1-Klik: Tersedia script [`run-all.bat`](file:///d:/Sistem-kasir-arunika/run-all.bat) & [`run-all.ps1`](file:///d:/Sistem-kasir-arunika/run-all.ps1) untuk menjalankan seluruh layanan sekaligus.

---

## 3. Struktur Hak Akses (Role-Based Access Control)

| Role                           | Akses Fitur Utama                                                                                                                                           | Lingkup Izin                                                                   |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **`superadmin`** (Owner)       | Akses Penuh: Monitoring Audit Mutasi Stok, Rekonsiliasi Stok & Anomali, Master Data, Laporan Laba Kotor, Pengaturan Toko.                                   | Seluruh rute API `/api/superadmin/*` dan `/api/admin/*`                        |
| **`admin`** (Gudang / Manajer) | Master Produk, Kategori, Modifier/Topping, Meja, Bahan Baku, Resep Menu (BOM), Pencatatan Waste, Penyesuaian Stok Manual, Laporan Penjualan.                | Rute `/api/admin/*` (Tidak dapat mengakses laporan audit & rekonsiliasi owner) |
| **`cashier`** (Kasir)          | Layar Kasir POS, Barcode Scan, Denah Meja, Split Bill, Hold/Resume Order, Buka/Tutup Shift, Rekap Laci Kasir, Cetak Struk Thermal, Void Transaksi Hari Ini. | Rute transaksi `/api/orders`, `/api/shift/*`, `/api/orders/hold`               |
| **`kitchen`** (Koki / Barista) | Kitchen Display System (KDS): Melihat antrean tiket pesanan yang harus dimasak secara realtime, varian/topping, catatan khusus, dan menandai selesai.       | Rute `/kitchen` & `/api/orders?today_only=1`                                   |

---

## 4. Akun Default & Kredensial Pengujian (Demo)

Sistem telah dilengkapi data seeder 30 hari transaksi realistis dan akun demo siap pakai:

| Role                   | Email             | Password Default | Tujuan Evaluasi                                               |
| :--------------------- | :---------------- | :--------------- | :------------------------------------------------------------ |
| **Superadmin (Owner)** | `owner@pos.com`   | `password`       | Menguji monitoring audit, stock opname, dan laba kotor        |
| **Admin (Gudang)**     | `admin@pos.com`   | `password`       | Menguji CRUD produk, bahan baku, resep, dan pencatatan waste  |
| **Kasir Utama**        | `kasir@pos.com`   | `password`       | Menguji transaksi kasir, shift, split bill, shortcut keyboard |
| **Kasir Siang**        | `kasir2@pos.com`  | `password`       | Menguji pergantian shift kasir berbeda                        |
| **Koki Dapur (KDS)**   | `kitchen@pos.com` | `password`       | Menguji layar antrean pesanan dapur minimalis                 |

> _Catatan: Pada halaman login frontend (`/login`), tersedia tombol **Quick Fill Demo Chips** untuk mengisi kredensial di atas secara instan._

---

## 5. Fitur-Fitur Utama & Alur Kerja Sistem

### 5.1 Alur Transaksi Kasir (Quick POS)

1. **Shortcut Keyboard**:
   - `F2`: Fokus pencarian produk / Scan barcode.
   - `F3`: Buka denah meja (_interactive floor plan_).
   - `F4`: Simpan transaksi sementara (_Hold Order_).
   - `F7`: Buka daftar transaksi tersimpan (_Held Orders Drawer_).
   - `F8`: Buka modal pembayaran.
   - `ESC`: Batalkan modal / bersihkan input.
2. **Pilihan Pembayaran Lengkap**: Tunai dengan tombol pecahan cepat (Uang Pas, 20k, 50k, 100k), QRIS Dinamis (lengkap dengan simulasi pembayaran demo), Kartu Debit/Kredit, dan Transfer Bank.
3. **Split Bill (Patungan)**: Mendukung pembagian total belanja menjadi beberapa orang dengan checklist status pembayaran per orang.
4. **Cetak Struk Thermal**: Format standar printer kasir 58mm dan 80mm dengan header, footer, dan detail pajak dinamis dari pengaturan toko.
5. **Void Transaksi**: Pembatalan transaksi salah yang otomatis mengembalikan stok produk barang jadi dan stok bahan baku mentah ke gudang disertai alasan void dan nama kasir/admin penanggung jawab.

### 5.2 Alur Bahan Baku & Resep (BOM System)

1. Admin mendaftarkan bahan baku mentah di menu **Bahan Baku (Ingredients)** (misal: Beras [kg], Minyak [liter], Telur [butir], Kopi [kg]).
2. Admin mengatur takaran pada menu **Resep Produk (BOM)** (misal: 1 porsi "Nasi Goreng Spesial" membutuhkan Beras 0.2 kg, Minyak 0.05 liter, Telur 2 butir).
3. Saat kasir melakukan transaksi 2 porsi Nasi Goreng Spesial:
   - Sistem secara otomatis memotong Beras sebanyak `0.4 kg`.
   - Sistem secara otomatis memotong Minyak sebanyak `0.1 liter`.
   - Sistem secara otomatis memotong Telur sebanyak `4 butir`.
   - Tiap pengurangan dicatat dalam tabel `stock_mutations` dengan referensi nomor invoice order.

### 5.3 Alur Pencatatan Waste & Kerusakan

1. Jika bahan baku kedaluwarsa, tumpah, atau rusak, staf menginput via menu **Waste & Spoilage**.
2. Staf memilih bahan, jumlah, alasan (_expired, damaged, spoilage, cooking_error, other_), dan catatan.
3. Stok bahan baku otomatis terpotong dan masuk ke laporan bulanan kerugian bahan baku.

### 5.4 Alur Stock Opname & Deteksi Anomali

1. Owner membuka menu **Rekonsiliasi Stok**.
2. Sistem menampilkan **Stok Sistem (Expected)** hasil kalkulasi matematis mutasi masuk dikurangi penjualan dan waste.
3. Owner menghitung fisik di gudang lalu memasukkan **Stok Aktual Fisik**.
4. Sistem menghitung selisih (_discrepancy_):
   - Jika selisih > 5%, muncul badge merah **ANOMALI** dan tercatat di timeline audit.

---

## 6. Panduan Instalasi & Menjalankan Aplikasi

### 6.1 Prasyarat Lingkungan (Environment Prerequisites)

- **PHP**: Versi 8.3 atau lebih baru (Ekstensi: `pdo_mysql`, `openssl`, `mbstring`, `curl`, `xml`, `fileinfo`)
- **Composer**: Versi 2.x
- **Node.js**: Versi 20.x atau lebih baru (dengan `npm`)
- **Database**: MySQL 8.0+ / MariaDB 10.5+ (atau SQLite untuk uji coba lokal)

---

### 6.2 Menjalankan Backend (`pos-backend`)

Buka terminal pada direktori `pos-backend`:

```bash
cd d:\Sistem-kasir-arunika\pos-backend

# 1. Salin konfigurasi environment jika belum ada
copy .env.example .env

# 2. Install dependensi PHP (jika belum terpasang)
composer install

# 3. Generate application key
php artisan key:generate

# 4. Jalankan migrasi dan seeder data lengkap
php artisan migrate:fresh --seed

# 5. Jalankan server backend development
php artisan serve
# Backend akan berjalan di http://127.0.0.1:8000
```

---

### 6.3 Menjalankan Frontend (`pos-frontend`)

Buka terminal kedua pada direktori `pos-frontend`:

```bash
cd d:\Sistem-kasir-arunika\pos-frontend

# 1. Install dependensi Node.js (jika belum terpasang)
npm install

# 2. Jalankan server frontend Vite
npm run dev
# Frontend akan berjalan di http://localhost:5173
```

Akses peramban di `http://localhost:5173` lalu masuk menggunakan salah satu akun demo pada **Tabel 4**.

---

## 7. Lokasi File Kunci & Penanggung Jawab Logika

| Modul                         | File Lokasi                                                                                                                                | Deskripsi Tanggung Jawab                                                                     |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Kalkulasi Harga & Pajak**   | [`pos-backend/app/Services/OrderPricingService.php`](file:///d:/Sistem-kasir-arunika/pos-backend/app/Services/OrderPricingService.php)     | Logika diskon, pajak, subtotal, uang kembalian.                                              |
| **Mutasi Stok & Bahan**       | [`pos-backend/app/Services/InventoryService.php`](file:///d:/Sistem-kasir-arunika/pos-backend/app/Services/InventoryService.php)           | Potong stok order, potong resep BOM, pengembalian void, audit log.                           |
| **Forecasting & Reorder**     | [`pos-backend/app/Services/StockForecastingService.php`](file:///d:/Sistem-kasir-arunika/pos-backend/app/Services/StockForecastingService.php) | Multi-tier routing, safety stock P90, evaluasi akurasi WAPE, RBAC masking.                  |
| **Python Forecasting Engine** | [`forecasting-engine/main.py`](file:///d:/Sistem-kasir-arunika/forecasting-engine/main.py)                                                 | Microservice FastAPI AutoETS, Croston, & WMA.                                                |
| **Stock Opname & Anomali**    | [`pos-backend/app/Services/ReconciliationService.php`](file:///d:/Sistem-kasir-arunika/pos-backend/app/Services/ReconciliationService.php) | Perhitungan stok ekspektasi vs fisik, flag anomali > 5%.                                     |
| **Laporan & HPP**             | [`pos-backend/app/Services/ReportService.php`](file:///d:/Sistem-kasir-arunika/pos-backend/app/Services/ReportService.php)                 | Laba kotor (_gross profit_), KPI omzet, breakdown pembayaran.                                |
| **State Toko & Keranjang**    | [`pos-frontend/src/stores/authStore.js`](file:///d:/Sistem-kasir-arunika/pos-frontend/src/stores/authStore.js)                             | State Zustand autentikasi, sesi kasir, dan RBAC token.                                      |
| **Antarmuka Kasir (POS)**     | [`pos-frontend/src/pages/cashier/PosPage.jsx`](file:///d:/Sistem-kasir-arunika/pos-frontend/src/pages/cashier/PosPage.jsx)                 | UI POS React, barcode scanner, QRIS, split bill, preview struk.                             |
| **Layar Dapur (KDS)**         | [`pos-frontend/src/pages/kitchen/KitchenPage.jsx`](file:///d:/Sistem-kasir-arunika/pos-frontend/src/pages/kitchen/KitchenPage.jsx)         | Tiket pesanan aktif dapur & tombol selesai masak.                                            |
| **Forecasting Backoffice UI** | [`pos-frontend/src/pages/admin/ForecastingPage.jsx`](file:///d:/Sistem-kasir-arunika/pos-frontend/src/pages/admin/ForecastingPage.jsx)     | Dashboard proyeksi stok, filter urgensi, export WhatsApp PO, AI digest.                      |
| **Layout Admin Executive**    | [`pos-frontend/src/layouts/AdminLayout.jsx`](file:///d:/Sistem-kasir-arunika/pos-frontend/src/layouts/AdminLayout.jsx)                     | Sidebar navigasi berbasis role admin/superadmin.                                             |
| **Portal Pelanggan & Brand**  | [`cafe-frontend/src/pages/HomePage.jsx`](file:///d:/Sistem-kasir-arunika/cafe-frontend/src/pages/HomePage.jsx)                             | Website publik Arunika UNIMUS Semarang, hero visual, cerita, fasilitas ruang.                |
| **Pemesanan QR Meja & Menu**  | [`cafe-frontend/src/pages/MenuPage.jsx`](file:///d:/Sistem-kasir-arunika/cafe-frontend/src/pages/MenuPage.jsx)                             | Katalog menu live, filtering, modal varian/modifier, scan QR meja (`/meja/:kode`).           |
| **Pelacakan Tiket Realtime**  | [`cafe-frontend/src/pages/TrackPage.jsx`](file:///d:/Sistem-kasir-arunika/cafe-frontend/src/pages/TrackPage.jsx)                           | Polling pintar status dapur/kasir dengan chime notifikasi Web Audio saat pesanan siap.       |
| **Riwayat Pesanan Pelanggan** | [`cafe-frontend/src/pages/HistoryPage.jsx`](file:///d:/Sistem-kasir-arunika/cafe-frontend/src/pages/HistoryPage.jsx)                       | Riwayat mandiri pesanan tamu (`/riwayat`), filter status, pelacakan ulang, & reorder 1-klik. |

---

## 8. Rekomendasi Pengembangan Selanjutnya (Future Roadmap)

1. **Web Installer GUI (`/install`)**:
   - Jika ingin dikomersialisasikan di marketplace seperti CodeCanyon, buat wizard instalasi berbasis web untuk memeriksa ekstensi PHP, koneksi database, dan pembuatan akun owner otomatis tanpa menyentuh command line (lihat panduan di [`second-brain/CODECANYON_SELLING_PLAN.md`](file:///d:/Sistem-kasir-arunika/second-brain/CODECANYON_SELLING_PLAN.md)).
2. **Integrasi Printer Web Bluetooth / ESC-POS Direct**:
   - Mengintegrasikan direct printing thermal via Web Bluetooth API atau WebUSB agar kasir tidak perlu melalui dialog print browser bawaan.
3. **Payment Gateway Nyata**:
   - Menghubungkan endpoint QRIS Dinamis ke agregator pembayaran (seperti Midtrans, Xendit, atau Doku) jika ingin menerima pembayaran digital otomatis tanpa pengecekan manual kasir.
4. **PWA & Offline Support**:
   - Menambahkan Service Worker untuk caching katalog produk sehingga kasir tetap dapat menginput pesanan saat koneksi internet terputus sementara.

---

## 9. Status Serah Terima

- **Status Kode**: Bersih, modular, dan seluruh logika kritis tercakup dalam unit test di [`pos-backend/tests/Unit/Services/`](file:///d:/Sistem-kasir-arunika/pos-backend/tests/Unit/Services/).
- **Dokumentasi Lengkap**: Tersedia di direktori [`second-brain/`](file:///d:/Sistem-kasir-arunika/second-brain/).
- **Kondisi Serah Terima**: Sistem dalam kondisi siap dijalankan (_ready to run_) untuk pengujian maupun penyebaran lingkungan produksi.
