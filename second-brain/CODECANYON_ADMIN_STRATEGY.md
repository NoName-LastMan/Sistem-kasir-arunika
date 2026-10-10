# Admin Suite — Product Plan untuk CodeCanyon

> Target: mengubah POS kasir menjadi produk self-hosted yang siap dioperasikan owner, mudah didemo, dan punya pembeda nyata. Ini adalah spesifikasi target; jangan promosi sebagai fitur tersedia sebelum implementasi dan QA selesai.

## Positioning

**Warmindo POS** adalah Restaurant & Small-Retail POS berbasis Laravel + Vue: kasir cepat, menu dengan modifier, kontrol operasional harian, dan admin dashboard yang dapat digunakan owner tanpa keahlian akuntansi.

Target awal: warmindo, coffee shop, café kecil, kantin, bakery, dan restoran single outlet. Jangan klaim ERP, SaaS multi-tenant, atau offline-first sebelum benar-benar teruji.

### Nilai yang dijual

1. **Cepat di kasir** — shortcut, scan barcode, hold order, pembayaran, dan cetak struk.
2. **Terkendali oleh owner** — uang, stok, staf, dan performa terlihat tanpa mengubah riwayat secara sembarangan.
3. **Siap untuk F&B** — dine-in, meja, modifier/topping, shift, dan alur dapur sebagai roadmap.
4. **Mudah dipasang** — installer web, demo data, dokumentasi Inggris, dan kompatibel dengan shared hosting umum.

## Prinsip UX admin

- Sidebar Dark Slate; area kerja terang; header dengan pencarian global, notifikasi, dan profil.
- Setiap list: pencarian, filter, sort, pagination, empty/loading/error state, dan ekspor bila relevan.
- Form: validasi langsung, `Save`/`Cancel` jelas, indikator unsaved change, toast sukses/gagal.
- Aksi berisiko (hapus, void, stock adjustment, reset password) wajib konfirmasi dan audit log.
- KPI dashboard harus dapat diklik untuk menuju data detail yang sudah difilter.
- Responsif untuk tablet; POS diprioritaskan pada desktop/tablet lanskap.

## Navigasi admin v1

```text
Dashboard
Sales: Orders & Receipts · Shifts / Cash Register · Discounts & Taxes
Catalog: Products · Categories · Modifiers · Barcode Labels
Inventory: Stock Movements · Stock Adjustment · Low-stock Alerts
People: Staff & Roles
Reports
Settings: Store & Receipt · Tax/Currency/Locale · Security & Audit Log
```

## Scope rilis v1 (wajib sebelum listing)

| Modul | Nilai pembeli | Definition of done | Prioritas |
| --- | --- | --- | --- |
| Executive dashboard | Owner langsung paham kondisi toko | KPI periode, tren, best seller, metode bayar, low stock, shift terbuka, recent orders | P0 |
| RBAC nyata | Endpoint admin aman | `admin/cashier/kitchen`, middleware/policy server-side; frontend guard hanya UX | P0 |
| Product + modifier master | Menu F&B dapat dikelola penuh | CRUD, image, SKU/barcode, HPP, aktif/nonaktif, import/export CSV, required/min/max modifier tervalidasi saat checkout | P0 |
| Order control | Riwayat finansial dapat dipercaya | List/detail/filter, receipt reprint, void/refund beralasan dan berpermission; order lama immutable | P0 |
| Shift + cash register | Mengurangi selisih kas | Rekap per shift/kasir, cash in/out beralasan, close summary/print | P0 |
| Inventory ledger | Pembeda dari POS sederhana | Stock in, sale, adjustment, waste; saldo before/after, actor, reason, reference; alert stok rendah | P0 |
| Settings | Siap dipakai setelah install | Profil toko, logo, currency/locale/timezone, invoice prefix, pajak default, receipt header/footer | P0 |
| Audit + staff | Owner bisa menelusuri aksi penting | Audit login, role/user, setting, stok, void/refund; deactivate/reset/revoke token | P0 |
| Reports + export | Nilai bisnis yang jelas | Sales, product/category, payment, shift, gross profit; date filters dan CSV | P0 |

## Roadmap pembeda setelah v1

| Rilis | Fitur | Alasan |
| --- | --- | --- |
| v1.1 | Customer CRM, loyalty, QR table ordering, floor plan sederhana, printer profiles, multi-payment | Nilai lebih untuk café/restoran |
| v1.2 | Kitchen Display System, ticket dapur, waiter role, scheduled/pre-order, delivery metadata | Melengkapi alur restoran |
| v1.3 | Multi-outlet, branch permission, stock transfer, purchase order, supplier | Ekspansi saat core single outlet stabil |
| v1.4 | PWA/offline queue + conflict sync | Pembeda kuat, tetapi perlu desain sinkronisasi serius |

## Fondasi teknis yang perlu ada

```text
Vue Admin View → API route → Form Request → Policy/Middleware
                         → Service (pricing/inventory/shift/report)
                         → Eloquent → DB transaction + audit event
```

- Buat `OrderPricingService`, `InventoryService`, dan `ShiftService`; jangan biarkan controller money-critical membesar.
- Gunakan decimal/integer currency secara konsisten; jangan gunakan float untuk uang.
- Semua write endpoint tervalidasi server-side dan dibungkus transaction bila menyentuh uang/stok.
- Jangan hard-delete order atau produk yang sudah direferensikan transaksi.
- Tambahkan: `settings`, `stock_movements` (immutable), `cash_movements`, `audit_logs`, `permissions`, serta `refunds/voids`.

## Paket CodeCanyon yang meningkatkan konversi

### Demo dan presentasi

- Live demo role terpisah (Admin/Cashier/Kitchen), kredensial jelas, data reset berkala, dan seed realistis 30 hari.
- Screenshot 1920×1080: Dashboard → POS → Payment → Receipt → Inventory movement → Report → Settings.
- Video 60–90 detik: “sale to stock and report”.
- Demo harus memblokir payment/email eksternal dan upload berbahaya.

### Deliverables

- Web installer: preflight PHP extension, folder permission, database connection, migration, seed, owner account, `.env` setup.
- Dokumentasi **bahasa Inggris** HTML/PDF: install, upgrade, config, roles, printer/receipt, backup/restore, troubleshooting, dan asset credits.
- `CHANGELOG.md`, sample `.env`, server requirements, demo credentials, database backup guide.

### Klaim yang aman

Klaim hanya jika diuji: “Self-hosted”, “Full source code”, “Laravel + Vue”, “Role-based access”, “Inventory audit trail”, “Responsive admin.” Jangan memakai “offline”, “multi-branch”, “accounting”, “secure”, atau “SaaS-ready” tanpa implementasi/test/dokumentasi.

## Checklist sebelum submit

- [ ] Fresh install pada MySQL/MariaDB berhasil tanpa Node build di server produksi (compiled assets disertakan).
- [ ] Semua demo role berjalan, termasuk saat live preview di iframe.
- [ ] Cashier tidak bisa mengakses endpoint admin langsung.
- [ ] Jalur harga, tax, discount, refund, stok, dan close shift punya feature test.
- [ ] Tidak ada secret, `.env`, database produksi, asset tanpa lisensi, atau dependency dev tak perlu di paket.
- [ ] Dokumentasi Inggris mencakup instalasi, konfigurasi, penggunaan, dan credits.
- [ ] Listing, screenshot, dan demo hanya menjanjikan fitur yang tersedia.

## Urutan kerja

1. Fondasi: MySQL production config, RBAC/policy, Form Requests, service layer, test data.
2. Core P0: master product/modifier, inventory ledger, settings, staff, shift cash movements.
3. Dashboard, reports/export, audit log, lalu polish UX.
4. Installer, docs, demo, screenshot/video, fresh-install dan security QA.
5. Rilis v1.0; gunakan feedback buyer untuk menentukan roadmap berikutnya.
