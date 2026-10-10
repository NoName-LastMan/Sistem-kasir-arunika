# Rencana Penjualan Warmindo POS ke CodeCanyon

> Dokumen ini adalah panduan lengkap untuk mendaftarkan dan menjual produk POS ini di CodeCanyon (Envato Market).

---

## 1. Analisis Produk & Positioning

### Nama Produk yang Direkomendasikan
**"Warmindo POS — Restaurant & Café Point of Sale with Inventory & Fraud Prevention"**

### Target Pembeli
- Pemilik warmindo, coffee shop, café kecil, kantin, bakery, restoran single outlet
- Pengusaha F&B yang ingin kontrol penuh tanpa langganan bulanan (self-hosted)
- Developer yang mencari script POS siap jual untuk klien F&B mereka

### Harga yang Direkomendasikan
| Lisensi | Harga | Alasan |
|---------|-------|--------|
| Regular License | $39–$49 | Kompetitif untuk POS F&B self-hosted di CodeCanyon |
| Extended License | $199–$249 | Untuk developer yang menjual ke klien akhir |

### USP (Unique Selling Points) — Yang Membedakan dari Kompetitor
1. **All-in-One**: POS + Inventory Bahan Baku (BOM) + Resep + Waste Tracking + Rekonsiliasi — bukan POS biasa
2. **Fraud Prevention**: Audit trail lengkap + role terpisah (owner vs staff) + monitoring owner + anomaly detection
3. **F&B Specific**: Multi-unit conversion, resep/BOM, waste kategori makanan, estimasi biaya per porsi
4. **Real-time**: Semua perubahan stok langsung tercatat dan bisa dipantau owner dari jarak jauh
5. **Modern Stack**: Laravel 13 + Vue 3 + Tailwind CSS + Pinia — bukan stack legacy

---

## 2. Checklist Teknis Sebelum Submit

### 2.1 Infrastruktur & Packaging (WAJIB)

- [ ] **Web Installer**: Buat halaman `/install` yang melakukan:
  - Preflight check PHP extension (openssl, pdo_mysql, mbstring, xml, curl, gd, zip)
  - Cek folder permission (storage/, bootstrap/cache/)
  - Form input database connection (host, port, db name, user, password)
  - Jalankan migration + seeder secara otomatis
  - Buat owner account (superadmin) dengan input custom
  - Generate `.env` dari form input
  - Redirect ke login setelah selesai

- [ ] **Compiled Assets**: Build frontend (`npm run build`) dan sertakan folder `public/build/` dalam paket. Pembeli TIDAK boleh perlu Node.js di server produksi.

- [ ] **Demo Data Seeder**: Seeder realistis 30 hari (sudah ada di `IngredientSeeder.php`, perlu diperluas ke data penjualan, order, shift, dll.)

- [ ] **Clean Package**: Hapus dari paket:
  - `.env` (sertakan `.env.example` dengan komentar)
  - `node_modules/`
  - `vendor/` (pembeli jalankan `composer install`)
  - File testing yang tidak perlu
  - Database produksi / credentials
  - Asset tanpa lisensi (gambar, font, icon)

- [ ] **Server Requirements Document**: PHP 8.3+, MySQL 8.0+ / MariaDB 10.5+, Composer 2.x, Apache/Nginx

### 2.2 Fitur yang Harus Diuji & Stabil (P0)

| Area | Yang Harus Dicek |
|------|-----------------|
| **RBAC** | Cashier TIDAK bisa akses endpoint admin (tes langsung via API, bukan hanya UI). Admin TIDAK bisa akses superadmin routes. |
| **Harga & Diskon** | Feature test untuk semua formula: subtotal, discount %, discount fixed, tax, total, kembalian |
| **Stok** | Feature test: deduct saat checkout, restore saat void, manual adjust, waste deduct, rekonsiliasi |
| **Shift** | Feature test: buka shift, close shift, rekonsiliasi kas, selisih kas |
| **Void** | Feature test: void order hari ini (berhasil), void order kemarin (ditolak), void oleh cashier lain (ditolak) |
| **Barcode** | Tes lookup barcode, tes scanner listener |
| **Struk** | Pastikan struk baca dari Store Settings (bukan hardcoded) |

### 2.3 Fitur yang Harus Ada untuk Listing (Sudah Implementasi)

| Fitur | Status | Catatan |
|-------|--------|---------|
| Quick POS dengan shortcut | ✅ Selesai | F2, F4, F7, F8, ESC |
| Barcode scanner support | ✅ Selesai | USB/Bluetooth HID |
| Hold & resume order | ✅ Selesai | |
| Shift & cash reconciliation | ✅ Selesai | |
| Discount & tax | ✅ Selesai | % dan nominal |
| Void order + restock | ✅ Selesai | Dengan audit trail |
| Admin dashboard (KPI) | ✅ Selesai | |
| User & role management | ✅ Selesai | superadmin/admin/cashier/kitchen |
| Product & modifier master | ✅ Selesai | |
| Table & floor management | ✅ Selesai | |
| Inventory & stock adjustment | ✅ Selesai | |
| Store & receipt settings | ✅ Selesai | |
| Reports + CSV export | ✅ Selesai | |
| Kitchen display | ✅ Selesai | |
| Ingredient & recipe (BOM) | ✅ Selesai | |
| Waste tracking | ✅ Selesai | |
| Stock reconciliation | ✅ Selesai | |
| Owner monitoring | ✅ Selesai | |
| Dynamic QRIS | ✅ Selesai | Simulasi demo |
| Split bill | ✅ Selesai | |
| Thermal receipt preview | ✅ Selesai | 58mm/80mm |

---

## 3. Persiapan Listing CodeCanyon

### 3.1 Screenshot (Minimal 8–10 gambar, resolusi 1920×1080)

Urutan screenshot yang optimal untuk konversi:

1. **Dashboard Executive** — KPI overview, grafik penjualan, top products
2. **POS / Kasir Screen** — Layout keranjang, produk grid, meja
3. **Payment Flow** — Pilih metode bayar, QRIS, kembalian
4. **Receipt Preview** — Struk thermal 58mm/80mm
5. **Product Management** — Master produk, modifier, HPP
6. **Inventory / Ingredient Management** — Bahan baku, stok, low stock alert
7. **Recipe / BOM** — Resep produk, estimasi biaya per porsi
8. **Owner Monitoring** — Audit trail, anomaly detection
9. **Reports** — Grafik, tabel, CSV export
10. **Login Screen** — Split-screen modern dengan demo chips

### 3.2 Video Demo (60–90 detik)

Alur video yang direkomendasikan:
1. **[0:00–0:10]** Login sebagai owner (superadmin) — tampilkan demo chips
2. **[0:10–0:25]** Dashboard overview — KPI, grafik, best seller
3. **[0:25–0:40]** POS kasir — scan barcode, tambah item, pilih meja, apply diskon
4. **[0:40–0:50]** Payment — pilih metode, QRIS, cetak struk
5. **[0:50–1:05]** Admin: kelola produk, cek inventory, lihat resep
6. **[1:05–1:20]** Owner monitoring — audit trail, anomaly detection, rekonsiliasi stok
7. **[1:20–1:30]** Login sebagai kasir — tampilan kasir saja, tidak bisa akses admin

### 3.3 Deskripsi Listing

**Judul:**
> Warmindo POS — Restaurant & Café Point of Sale with Inventory, Recipes & Fraud Prevention

**Tagline:**
> All-in-one F&B POS with real-time ingredient tracking, recipe management, waste monitoring, and owner fraud prevention. Built with Laravel 13 & Vue 3.

**Fitur Utama (Feature List untuk listing):**
- Quick POS with keyboard shortcuts & barcode scanner
- Hold/resume orders, split bill, dynamic QRIS
- Shift management & cash reconciliation
- Discount (% & amount) & dynamic tax
- Void orders with automatic stock restore & audit trail
- Executive dashboard with KPI analytics
- Role-based access: Superadmin (Owner), Admin, Cashier, Kitchen
- Product management with modifiers/toppings/variations
- Ingredient inventory with multi-unit conversion (kg/liter/ml/pcs)
- Recipe/BOM with automatic cost calculation per serving
- Waste & spoilage tracking with photo evidence
- Stock reconciliation with anomaly detection (>5% auto-flag)
- Owner monitoring dashboard (who, when, what — full audit trail)
- Kitchen display system (KDS)
- Table management & floor plan
- Thermal receipt preview (58mm & 80mm)
- Sales reports, profit analysis, CSV export
- Web installer — no coding required
- Responsive admin panel with dark sidebar
- 4 demo roles included

**Tags:**
`pos, point of sale, restaurant, cafe, warmindo, laravel, vue, inventory management, recipe management, barcode, shift management, f&b, food and beverage, self-hosted`

### 3.4 Live Demo Setup

**Hosting yang Direkomendasikan:**
- VPS dengan Laravel Forge / Ploi / DigitalOcean ($5–10/bulan)
- Atau shared hosting (Hostinger, Niagahoster) untuk demo

**Demo Credentials (tampilkan jelas di halaman login):**
```
Superadmin (Owner): owner@pos.com / password
Admin (Staff):      admin@pos.com / password
Cashier:            kasir@pos.com / password
Kitchen:            kitchen@pos.com / password
```

**Pengamanan Demo:**
- Reset database setiap 6 jam (cron job)
- Blokir akses ke payment gateway eksternal
- Blokir upload file berbahaya
- Nonaktifkan fitur email

---

## 4. Dokumentasi yang Harus Disertakan (Bahasa Inggris)

### 4.1 File Dokumentasi

| File | Isi |
|------|-----|
| `README.md` | Overview, fitur, screenshot, demo credentials |
| `INSTALLATION.md` | Step-by-step install (web installer + manual) |
| `UPGRADE.md` | Cara update versi tanpa kehilangan data |
| `CONFIGURATION.md` | Pengaturan toko, pajak, receipt, printer |
| `ROLES.md` | Penjelasan 4 role + permission matrix |
| `PRINTING.md` | Setup printer thermal (58mm/80mm), jaringan |
| `BACKUP.md` | Backup & restore database |
| `TROUBLESHOOTING.md` | FAQ umum & solusi masalah |
| `CHANGELOG.md` | Riwayat versi |
| `CREDITS.md` | Lisensi asset (icon, font, library) |

### 4.2 Contoh INSTALLATION.md (Outline)

```markdown
# Installation Guide

## Server Requirements
- PHP 8.3+ with extensions: openssl, pdo_mysql, mbstring, xml, curl, gd, zip
- MySQL 8.0+ or MariaDB 10.5+
- Composer 2.x
- Web server: Apache with mod_rewrite or Nginx

## Quick Install (Web Installer)
1. Upload all files to your web server
2. Point your domain to the `public/` folder
3. Visit `https://yourdomain.com/install`
4. Follow the on-screen instructions
5. Login with your admin credentials

## Manual Install
1. Upload files
2. Run `composer install --no-dev`
3. Copy `.env.example` to `.env`
4. Run `php artisan key:generate`
5. Configure database in `.env`
6. Run `php artisan migrate --seed`
7. Run `php artisan storage:link`
8. Set folder permissions

## Post-Installation
- Configure store settings at Admin → Settings
- Set up receipt header/footer
- Add your products and categories
- Create staff accounts with appropriate roles
```

---

## 5. Strategi Pricing & Penjualan

### 5.1 Pricing Strategy

| Tahap | Harga Regular | Strategi |
|-------|---------------|----------|
| **Launch (bulan 1–2)** | $29 | Harga perkenalan untuk mendapatkan review pertama |
| **Growth (bulan 3–6)** | $39 | Naikkan setelah 10+ review bintang 4–5 |
| **Mature (bulan 6+)** | $49 | Harga final setelah 30+ review |

### 5.2 Strategi Mendapatkan Review Pertama
- Berikan license gratis ke 5–10 temen/kenalan yang punya bisnis F&B
- Minta mereka meninggalkan review jujur di CodeCanyon
- Responsif terhadap pertanyaan dan bug report (target: < 24 jam)

### 5.3 Support Strategy
- Siapkan dokumentasi lengkap (mengurangi support ticket 60–70%)
- Buat FAQ/KB (Knowledge Base) di halaman listing
- Balas semua komentar dan pertanyaan dengan cepat
- Rilis update berkala (fitur baru + bug fix) untuk maintain sales

### 5.4 Update Roadmap untuk Buyer

| Versi | Fitur Target | Timeline |
|-------|-------------|----------|
| **v1.0** | Launch: Semua fitur P0 yang sudah selesai | Submit segera |
| **v1.1** | Customer CRM, loyalty points, QR table ordering | 1–2 bulan setelah launch |
| **v1.2** | Kitchen ticket system, waiter role, scheduled orders | 2–3 bulan setelah launch |
| **v1.3** | Multi-outlet, branch permission, stock transfer | 3–6 bulan setelah launch |

---

## 6. Urutan Eksekusi (Priority Order)

### Phase 1: Teknis (Estimasi: 1–2 minggu)
1. Buat web installer (`/install` route + controller + Vue page)
2. Build frontend assets & verify clean package
3. Tulis dokumentasi bahasa Inggris (minimal: INSTALLATION, CONFIGURATION, ROLES, CHANGELOG)
4. Run full QA: semua feature test lulus, tes manual semua role
5. Buat `.env.example` yang bersih dengan komentar
6. Siapkan CHANGELOG.md

### Phase 2: Demo & Media (Estimasi: 3–5 hari)
7. Deploy live demo ke VPS/hosting
8. Setup cron reset database demo (setiap 6 jam)
9. Ambil 10 screenshot (1920×1080) — urutan sesuai section 3.1
10. Rekam video demo 60–90 detik
11. Edit video (tambah musik latar, transisi, text overlay)

### Phase 3: Listing (Estimasi: 1–2 hari)
12. Buat akun Envato/CodeCanyon (jika belum punya)
13. Upload paket ZIP ke CodeCanyon
14. Isi listing: judul, deskripsi, tag, fitur, screenshot, video
15. Set pricing: $29 (launch price)
16. Submit untuk review

### Phase 4: Post-Launch (Berkelanjutan)
17. Monitor dan balas komentar/pertanyaan (< 24 jam)
18. Kumpulkan feedback dari buyer pertama
19. Rilis update v1.1 dengan fitur baru
20. Naikkan harga bertahap sesuai review

---

## 7. Template Pesan untuk Envato Reviewer

Saat submit, CodeCanyon akan review produk. Siapkan penjelasan:

```
Warmindo POS is a complete restaurant point-of-sale system built with 
Laravel 13 and Vue 3. It is designed specifically for F&B businesses 
(warung, cafes, small restaurants) and includes:

- Full POS with keyboard shortcuts, barcode scanning, and hold orders
- Role-based access control (4 roles: owner, admin, cashier, kitchen)
- Real-time ingredient inventory with recipe/BOM management
- Waste tracking and stock reconciliation with anomaly detection
- Owner monitoring dashboard with complete audit trail
- Thermal receipt printing support (58mm/80mm)
- Web installer for easy setup — no coding required

Live demo: https://demo.yourdomain.com
Demo credentials are shown on the login page.

All features are fully functional and tested.
```

---

## 8. Risk & Mitigation

| Risiko | Mitigasi |
|--------|----------|
| Reviewer menolak karena bug | QA ketat sebelum submit, jalankan semua feature test |
| Komplain "fitur X tidak berfungsi" | Dokumentasi lengkap + video tutorial + FAQ |
| Kompetitor meniru | Update berkala dengan fitur baru, maintain review bagus |
| Pembeli minta refund | Responsif, bantu troubleshoot, rilis fix cepat |
| Listing kurang konversi | A/B test screenshot, perbaiki deskripsi, tambah video |

---

## 9. Template File yang Perlu Dibuat

| File | Tujuan | Prioritas |
|------|--------|-----------|
| `install/` (routes + controller + views) | Web installer otomatis | P0 |
| `docs/` folder (markdown/html) | Dokumentasi bahasa Inggris | P0 |
| `.env.example` | Template environment | P0 |
| `CHANGELOG.md` | Riwayat versi | P0 |
| `CREDITS.md` | Lisensi asset | P1 |
| `UPGRADE.md` | Panduan update | P1 |
| `CONTRIBUTING.md` | Panduan kontribusi (opsional) | P2 |
