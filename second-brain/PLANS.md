# Rencana & Status Pengembangan Fitur POS Lengkap

Dokumen ini berisi peta jalan (roadmap) dan status implementasi teknis untuk sistem POS (Backend & Frontend).

---

## 1. Status Implementasi Fitur Kasir & POS

| Modul Fitur | Status | Detail yang Telah Diimplementasikan |
| --- | --- | --- |
| **Kasir Cepat (Quick POS)** | Selesai | Shortcut keyboard (`F2` Cari/Scan, `F4` Hold, `F7` Daftar Hold, `F8` Bayar, `ESC` Batal), tombol pecahan uang cepat (Uang Pas, 20k, 50k, 100k), kembalian otomatis realtime, antarmuka responsif. |
| **Support Barcode Scanner** | Selesai | Endpoint instant query `/api/products/by-barcode/{code}`, auto-scan listener USB/Bluetooth HID (`useBarcodeScanner`) dengan auto-add to cart & notifikasi scan toast. |
| **Hold Order (Simpan Sementara)** | Selesai | Tabel `held_orders`, controller `HeldOrderController`, dialog simpan dengan catatan/meja, drawer daftar held order dengan tombol Ambil Order (*Resume*) & Hapus. |
| **Rekap Shift & Rekonsiliasi Kasir** | Selesai | Relasi `orders.shift_id` terikat otomatis, endpoint `GET /shift/current` (metrik berjalan live), `POST /shift/open`, `POST /shift/close` (rekonsiliasi fisik vs ekspektasi kas), cetak struk rekap shift kasir. |
| **Diskon & Pajak Dinamis** | Selesai | Pilihan diskon persen (%) dan nominal (Rp) per transaksi, toggle/custom rate pajak, formula kalkulasi bertingkat via `OrderPricingService`. |
| **Laporan Penjualan Lengkap** | Selesai | Filter tanggal (Hari Ini, 7 Hari, 30 Hari, Custom), 4 KPI Cards (Omzet Bersih, Transaksi Selesai, Laba Kotor dari HPP, Diskon/Pajak), breakdown 4 metode bayar & tipe order, tabel omzet & best seller, serta Ekspor CSV. |

---

## 2. Status Implementasi Admin Executive Suite (Lihat [ADMIN_PLAN.md](ADMIN_PLAN.md))

| Modul Admin | Status | Detail yang Telah Diimplementasikan |
| --- | --- | --- |
| **Layout Dark Slate Sidebar** | Selesai | `AdminLayout.vue` dengan sidebar kiri gelap (Slate-900 / Zinc-900) terpisah, **sidebar computed berdasarkan role (superadmin vs admin)**, top header executive, & navigasi terkelompok. |
| **User & Role Management** | Selesai | `AdminUserController.php` & `UserManagement.vue` (CRUD Staf/Kasir/Kitchen, reset password, toggle status aktif). **Role: superadmin, admin, cashier, kitchen.** |
| **Product & Modifier Master** | Selesai | `AdminProductController.php`, `ProductManagement.vue`, `ModifierManagement.vue` (CRUD Produk, HPP/Cost, Barcode, Kategori, Modifier). Stok di-handle via `InventoryService`. |
| **Table & Floor Management** | Selesai | `AdminTableController.php` & `TableManagement.vue` (CRUD Meja restoran & kapasitas kursi). |
| **Inventory & Stock Adjustment** | Selesai | `InventoryController.php` & `InventoryManagement.vue` (Stock In/Out/Opname via `InventoryService`, log mutasi `stock_mutations`, low stock alert). |
| **Store & Receipt Settings** | Selesai | `SettingController.php` & `StoreSettings.vue` (Profil toko, struk thermal header/footer, default tax rate %). |

---

## 3. Fitur POS Tambahan (Void, Order History, Receipt Fix)

| Modul | Status | Detail |
| --- | --- | --- |
| **Void/Cancel Order** | Selesai | `POST /api/orders/{order}/void` — batalkan order hari ini + kembalikan stok **produk + bahan baku** via `InventoryService::restoreForVoid()` + `restoreIngredientsForVoid()` + audit trail (void_reason, voided_at, voided_by). Hanya cashier pemilik atau admin. |
| **Order History (F9)** | Selesai | Riwayat order hari ini untuk kasir — daftar, detail, cetak ulang struk. Endpoint existing `GET /api/orders?today_only=1`. |
| **Receipt Dinamis** | Selesai | Struk baca dari Store Settings (nama toko, alamat, telepon, footer) — bukan hardcoded. Endpoint `GET /api/settings/store` (read-only, non-admin). |

---

## 4. Status Refactoring Service Layer

| Modul | Status | Detail |
| --- | --- | --- |
| **OrderPricingService** | Selesai | Semua kalkulasi harga (line item, diskon, pajak, kembalian) diextrak dari `OrderController` ke service. Semua intermediate pakai `round($val, 2)`. |
| **InventoryService** | Selesai | Semua mutasi stok (adjust, deduct order, set awal, update delta) diextrak ke service. **Baru: `deductIngredientsForOrder()` & `restoreIngredientsForVoid()` untuk auto deduct/restore bahan baku berdasarkan resep.** |
| **ReportService** | Selesai | Kalkulasi profit/loss dan sales summary diextrak dari `ReportController`. |
| **ReconciliationService** | **Selesai** | **Baru: `calculateExpectedStock()` hitung stok seharusnya, `reconcile()` stock opname + anomaly detection > 5%, `getReconciliationReport()` laporan semua bahan.** |
| **Model Enrichment** | Selesai | `StockMutation` punya type constants + reference_type + ingredient_id, `Product` punya `hasEnoughStock()` & `effectiveUnitPrice()` & `ingredients()`, `Shift` punya relasi, `Order` punya decimal casts. **Baru: `Ingredient`, `WasteRecord` models.** |
| **Unit Tests** | Selesai | Test untuk `OrderPricingService`, `InventoryService`, dan **`IngredientInventoryTest`** (9 test: deduct, restore, waste, reconciliation, anomaly detection) di `tests/Unit/Services/`. |

---

## 5. Status Penyempurnaan Front-End Komersial (SaaS Grade)

| Modul | Status | Detail |
| --- | --- | --- |
| **Rekonsiliasi Kas & Transaksi Kasir Per Shift** | Selesai | Tab Modal Shift Kasir: (1) Ringkasan Modal + Penjualan Tunai vs Uang Fisik Aktual + Selisih Kas, (2) Daftar transaksi kasir berjalan hari ini (nomor invoice, metode bayar, detail), (3) Kalkulator hitung lembaran uang fisik kasir (100rb, 50rb, 20rb, dst.). |
| **Laporan Penjualan & Owner Tracking** | Selesai | `AdminReports.vue` terintegrasi di Admin Suite (`/admin/reports`): Tabel performa kasir (transaksi, cash masuk, non-cash, total omzet), KPI laba kotor dari HPP, top 6 produk, dan ekspor CSV. |
| **Layar Dapur & Bar / KDS Sederhana** | Selesai | `KitchenDisplay.vue` (`/kitchen`): Tampilan antrean order aktif minimalis, timer tunggu, highlight varian & catatan koki, tombol "Tandai Selesai" satu ketukan. |
| **Denah Meja Restoran (Floor Plan)** | Selesai | Modal visual pemilih meja (`F3`), kapasitas kursi, status meja (Tersedia/Terisi), dan opsi pesanan bungkus (takeaway). Endpoint `GET /api/tables` dibuka untuk kasir. |
| **Dynamic QRIS & Multi-Payment Simulator** | Selesai | Tampilan QRIS standar dengan QR Code dinamis sesuai nominal, timer 5 menit, dan tombol simulasi scan sukses untuk kemudahan demo. Pilihan bank EDC & transfer. |
| **Split Bill (Bagi Rata Tagihan)** | Selesai | Modal kalkulasi patungan per orang (2-5 orang) dengan pelacakan status pembayaran per orang langsung dari keranjang kasir. |
| **Live Thermal Receipt Preview (58mm/80mm)** | Selesai | Preview fisik struk kasir dengan switcher ukuran kertas thermal sebelum dicetak fisik ke printer. |
| **Redesign Login Split-Screen & Demo Chips** | Selesai | Tampilan login fintech modern, Quick-Fill Demo Chips (👑 Superadmin: `owner@pos.com`, 🔧 Admin: `admin@pos.com`, 💼 Kasir: `kasir@pos.com`, 🍳 Kitchen: `kitchen@pos.com`), password visibility toggle. |
| **Web Audio Sound Effects** | Selesai | `useSoundFx.js`: Synthesizer audio native tanpa dependensi file eksternal (beep scan, success chime, warning). |

---

## 6. Sistem Bahan Baku, Resep & Fraud Prevention

| Modul | Status | Detail |
| --- | --- | --- |
| **Bahan Baku (Ingredients)** | Selesai | `IngredientController.php` & `IngredientManagement.vue`: CRUD bahan baku multi-unit (kg/liter/pcs/butir), stok, min alert, harga per unit, info supplier, low stock alert, riwayat mutasi per bahan. |
| **Resep Produk (BOM)** | Selesai | `RecipeController.php` & `RecipeManagement.vue`: Atur resep per produk (bahan + jumlah per porsi + unit + conversion factor), estimasi biaya bahan per porsi, auto deduct stok bahan saat checkout. |
| **Waste & Spoilage** | Selesai | `WasteController.php` & `WasteManagement.vue`: Catat waste (expired/damaged/spoilage/cooking_error/other), foto bukti, auto deduct stok bahan, laporan summary per periode. |
| **Rekonsiliasi Stok** | Selesai | `ReconciliationController.php` & `ReconciliationPage.vue`: Hybrid reconciliation (sistem hitung expected + input fisik), auto-flag anomali > 5%, audit trail. **Khusus superadmin.** |
| **Monitoring Owner** | Selesai | `OwnerMonitoring.vue`: Halaman khusus superadmin, semua aktivitas stok (siapa, kapan, apa), anomaly banner merah mencolok, filter tipe/user/tanggal, low stock list, rekonsiliasi summary. |
| **Role Superadmin vs Admin** | Selesai | Migration tambah role `superadmin`, middleware `EnsureSuperAdmin`, routes `/api/superadmin/*`, sidebar computed, router guard `requiresSuperAdmin`. Admin biasa tidak bisa akses rekonsiliasi & monitoring. |
| **Seeder Simulasi** | Selesai | `IngredientSeeder.php`: 20 bahan baku, 9 resep produk, 14 hari simulasi restock/penjualan/waste, simulasi anomali stok. |

