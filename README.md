# ☕ Sistem Kasir & ERP Mini F&B (POS Suite)

Ekosistem Point of Sale (POS) dan Enterprise Resource Planning (ERP) mini berbasis web yang dirancang khusus untuk industri Food & Beverage (F&B) seperti kafe, warmindo, kedai kopi, dan restoran.

Sistem ini tidak hanya berfungsi sebagai kasir pencatat transaksi biasa, melainkan dilengkapi modul **Fraud Prevention & Inventory Control** untuk mencegah kebocoran bisnis.

---

## 🌟 Fitur Utama

- ⚡ **Kasir Cepat & Responsif**:
  - Dukungan shortcut keyboard (`F2` Cari, `F4` Bayar, `F7` Hold, `F8` Shift, `ESC` Batal).
  - Integrasi barcode scanner (HID Keystroke Stream) langsung tanpa setup tambahan.
  - Quick cash buttons, kalkulasi kembalian otomatis, dan simulasi QRIS Dinamis.
  - Cetak struk printer thermal (format 58mm & 80mm) dengan header/footer dinamis.
- 🌾 **Bahan Baku & Resep Otomatis (Bill of Materials / BOM)**:
  - Setiap menu dapat dihubungkan dengan takaran bahan baku (misal: 1 cup Es Kopi Susu = 18 gr espresso + 120 ml susu segar).
  - Stok bahan baku terpotong otomatis secara real-time saat transaksi berhasil (*Auto-Deduct*).
- 🛡️ **Pencegahan Kecurangan & Audit Mutasi Stok**:
  - Setiap perubahan stok (masuk, keluar, penjualan, void, atau penyesuaian) mencatat audit trail (siapa user pembuatnya, tanggal/jam, jumlah perubahan, dan sisa akhir).
  - Pelacakan bahan terbuang/basi (*Waste & Spoilage Tracking*).
- ⚖️ **Rekonsiliasi Stok (Stock Opname) & Anomaly Detection**:
  - Sistem menghitung ekspektasi stok seharusnya secara matematis dan membandingkannya dengan hitungan fisik riil.
  - Selisih stok di atas ambang batas (> 5%) otomatis ditandai sebagai indikasi anomali bagi Owner.
- 📊 **Laporan Finansial & Laba Bersih**:
  - Perhitungan Laba Kotor (*Gross Profit*) berbasis HPP (*Cost of Goods Sold*).
  - Laporan omzet kasir per shift, produk terlaris, dan ekspor data ke format CSV.
- 🍳 **Kitchen Display System (KDS)**:
  - Layar antrean pesanan khusus dapur dengan status pesanan real-time.
- 👥 **Role-Based Access Control (RBAC)**:
  - **Superadmin / Owner**: Akses penuh, audit mutasi, rekonsiliasi stok, dan monitoring anomali.
  - **Admin**: Master data (katalog, resep, meja, inventaris, pengguna, catat waste).
  - **Cashier**: Operasional POS, buka/tutup shift kasir, cetak struk, hold order.
  - **Kitchen**: Tampilan layar dapur KDS.

---

## 🏗️ Struktur Arsitektur Repository

```
POS/
├── pos-backend/          # REST API Engine (Laravel 12 / PHP 8.3+, Sanctum)
├── cafe-frontend/        # Client Pemesanan & POS Kafe (React 18, Vite, Zustand)
├── pos-frontend/         # [Dalam Rencana / Migrasi Penuh ke React]
└── docs/                 # Dokumentasi Lengkap Proyek
    ├── API.md            # Kamus Endpoint REST API
    ├── DOMAIN.md         # Model Domain, Database, & Service Layer
    └── CODEMAP.md        # Panduan File & Indeks Fitur
```

> **Catatan Frontend:** Kode `pos-frontend` sebelumnya yang berbasis Vue 3 telah **dihapus total**. Seluruh client frontend distandarisasi menggunakan ekosistem **React 18** (seperti yang berjalan pada `cafe-frontend`), dan frontend POS kasir/backoffice baru akan dibangun berbasis React.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Backend (`pos-backend`)
Pastikan PHP ≥ 8.2 dan Composer sudah terinstal di komputer Anda.

```bash
cd pos-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
Backend API akan berjalan di: `http://localhost:8000`

### 2. Frontend Kafe / React Client (`cafe-frontend`)
Pastikan Node.js ≥ 18 sudah terinstal.

```bash
cd cafe-frontend
npm install
npm run dev
```
Aplikasi berjalan di: `http://localhost:5174`

---

## 📚 Dokumentasi Lebih Lanjut

Untuk panduan mendalam mengenai API, rancangan sistem, dan alur kode, silakan buka folder [`docs/`](file:///c:/Users/lenov\Documents\POS\docs):
- [**API Reference**](docs/API.md) — Kamus endpoint lengkap, role izin, dan parameter.
- [**Domain & Arsitektur**](docs/DOMAIN.md) — Penjelasan Service Layer, diagram ERD, dan logika perhitungan.
- [**Codemap**](docs/CODEMAP.md) — Titik masuk perubahan kode per modul fitur.
