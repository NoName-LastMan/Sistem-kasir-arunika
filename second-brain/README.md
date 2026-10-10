# POS Backend & Frontend — Second Brain

> Ringkasan hemat-token untuk AI agent dan developer. Selalu perbarui dokumen ini bila route, aturan bisnis, atau skema berubah.

---

## Snapshot Proyek

| Area | Status Implementasi |
| --- | --- |
| **Stack** | Laravel 13, PHP 8.3+, MySQL, Laravel Sanctum, Vue 3, Vite, Tailwind CSS, Pinia |
| **Service Layer** | `OrderPricingService` (kalkulasi harga), `InventoryService` (mutasi stok + audit trail + deduct bahan baku), `ReportService` (laporan/laba), `ReconciliationService` (rekonsiliasi stok + anomaly detection) |
| **Auth & Role** | Login token Sanctum, profil user aktif, role `superadmin` (owner), `admin` (gudang/staf), `cashier`, `kitchen` |
| **Kasir Cepat** | Shortcut keyboard (`F2`, `F4`, `F7`, `F8`, `ESC`); Pecahan uang cepat; Kembalian realtime; Cetak struk thermal |
| **Katalog & Barcode** | Barcode/SKU lookup (`/products/by-barcode/{code}`); Auto HID scanner listener |
| **Hold Order** | Simpan sementara transaksi (`POST /orders/hold`), antrean held orders, resume ke keranjang |
| **Diskon & Pajak** | Diskon % & Rp, pajak dinamis (default 10%), kalkulasi berjenjang aman server-side via `OrderPricingService` |
| **Shift Kasir** | Buka shift, monitoring live status, tutup shift & rekonsiliasi kas, cetak struk rekap shift |
| **Laporan & Analytics** | Omzet harian; 10 produk terlaris; KPI ringkasan; Laba kotor (*Gross profit* dari HPP); Breakdown 4 metode bayar; Ekspor CSV |
| **Void & Order History** | Void order hari ini + restock otomatis (produk + bahan baku); Riwayat transaksi kasir (F9); Cetak ulang struk; Audit trail (alasan, oleh, kapan) |
| **Receipt Dinamis** | Struk baca dari Store Settings (nama, alamat, telepon, footer) — bukan hardcoded |
| **Admin Executive Suite** | **Selesai** (Lihat [ADMIN_PLAN.md](ADMIN_PLAN.md)): Dark Slate Sidebar Kiri Elegan, Management User/Kasir, Full Product & Modifier Master, Table Management, Inventory Stock Adjustment & Audit Log, Store & Receipt Settings |
| **Front-End Komersial (SaaS Grade)** | **Selesai**: Layar Dapur Minimalis (`/kitchen`), Rekonsiliasi Kasir & Transaksi Per Shift (Owner Tracking), Dynamic QRIS + Simulasi Demo, Split Bill Patungan, Denah Meja Interaktif (`F3`), Live Preview Struk 58mm/80mm, Split-Screen Login dengan Demo Chips, Web Audio Sound FX |
| **Sistem Bahan Baku & Resep (BOM)** | **Selesai**: Tabel `ingredients` (multi-unit: kg/liter/pcs), `product_ingredients` (resep per porsi + conversion factor), auto deduct bahan saat checkout, restore saat void |
| **Waste & Spoilage Tracking** | **Selesai**: Tabel `waste_records` (alasan: expired/damaged/spoilage/cooking_error/other), auto deduct stok bahan, laporan summary per periode |
| **Rekonsiliasi Stok (Stock Opname)** | **Selesai**: Hybrid reconciliation (sistem hitung expected + input manual fisik), auto-flag anomali > 5%, audit trail user + timestamp |
| **Monitoring Owner** | **Selesai**: Halaman khusus superadmin, semua aktivitas stok tercatat (siapa, kapan, apa), filter tipe/user/tanggal, anomaly banner mencolok |
| **Role Superadmin vs Admin** | **Selesai**: `superadmin` (owner) bisa akses semua termasuk rekonsiliasi & monitoring; `admin` (staf) bisa kelola bahan, catat waste, tapi tidak bisa lihat monitoring/rekonsiliasi |

---

## Navigasi Cepat

- [VALUE_PROPOSITION.md](VALUE_PROPOSITION.md): Keunggulan produk, pemecahan masalah bisnis, dan diferensiasi kompetitif.
- [ADMIN_PLAN.md](ADMIN_PLAN.md): Cetak biru & spesifikasi Admin Panel Elegan & Master Data Management.
- [API.md](API.md): Endpoint, autentikasi, input/output, dan aturan request.
- [DOMAIN.md](DOMAIN.md): Entitas, relasi, rumus kalkulasi keuangan, service layer, dan rekonsiliasi.
- [CODEMAP.md](CODEMAP.md): Peta file backend & frontend termasuk service layer, serta titik awal perubahan per fitur.
- [PLANS.md](PLANS.md): Rencana pengembangan, status implementasi, dan panduan shortcut.

---

## Konvensi API & Bisnis

- Base route: `/api`.
- Semua endpoint selain `POST /api/login` memerlukan `Authorization: Bearer <token>`.
- **Role `superadmin`**: Akses penuh ke semua fitur termasuk rekonsiliasi stok & monitoring owner. Route di `/api/superadmin/*`.
- **Role `admin`**: Kelola master data, bahan baku, resep, catat waste, laporan penjualan. TIDAK bisa akses rekonsiliasi & monitoring. Route di `/api/admin/*`.
- Middleware: `EnsureAdmin` (izinkan admin + superadmin), `EnsureSuperAdmin` (izinkan superadmin saja).
- Semua kalkulasi uang melewati service layer (`OrderPricingService`, `InventoryService`, `ReportService`, `ReconciliationService`). Tidak ada kalkulasi harga atau perubahan stok yang dilakukan langsung di controller.
