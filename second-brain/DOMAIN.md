# Domain dan Aturan Bisnis

## Entitas Inti

| Entitas | Data penting | Relasi |
| --- | --- | --- |
| User | `role`: superadmin/admin/cashier/kitchen, `is_active` | Membuat order, shift kasir, mutasi stok, waste records |
| Category | nama, slug, image, aktif | Memiliki banyak product |
| Product | kategori, SKU/Barcode, harga jual/modal (HPP), stok, track_stock, aktif | Milik category; banyak modifier group; banyak ingredient (resep); mutasi stok |
| Ingredient | nama, base_unit (kg/liter/pcs), stok, min_stock_alert, cost_per_unit, supplier_info | Banyak product (via resep); mutasi stok; waste records |
| ProductIngredient | product, ingredient, quantity_needed, recipe_unit, conversion_factor | Pivot tabel resep/BOM |
| ModifierGroup | nama, wajib, min/max pilihan | Memiliki banyak modifier item; many-to-many product |
| ModifierItem | group, nama, harga | Dipakai order item modifier |
| Table | nomor, kapasitas, status | Dapat dipakai order dine-in |
| Shift | kasir, waktu buka/tutup, kas awal/aktual/ekspektasi, selisih | Terhubung langsung ke orders via `shift_id` |
| HeldOrder | user, meja, tipe, data keranjang (JSON), catatan | Transaksi yang disimpan sementara (antrean hold) |
| StockMutation | produk/ingredient, user, tipe (in/out/opname), quantity, sebelum, sesudah, reference_type, reference_id, catatan | Pencatatan audit trail inventaris (produk + bahan baku) |
| WasteRecord | ingredient, quantity, reason (expired/damaged/spoilage/cooking_error/other), user, shift, catatan, foto bukti | Pencatatan waste/spoilage bahan baku |
| Setting | store_name, address, phone, receipt_header/footer, tax_rate, invoice_prefix | Konfigurasi global toko & struk |
| Order | invoice, kasir, meja, shift, subtotal, diskon, pajak, total, pembayaran | Memiliki banyak order item |
| OrderItem | produk, jumlah, harga dasar, subtotal, catatan | Memiliki banyak modifier tercatat |

**Order Statuses:**
- `status`: `pending`, `processing`, `completed`, `cancelled` — default `completed` saat checkout
- `payment_status`: `unpaid`, `paid`, `refunded` — default `paid` saat checkout
- Void fields: `void_reason` (text), `voided_at` (timestamp), `voided_by` (user FK)

**Stock Mutation Types:**
- `in`: Penambahan stok (restock, pengembalian void)
- `out`: Pengurangan stok (penjualan, waste, kerusakan)
- `opname`: Penyesuaian stok fisik (rekonsiliasi)

**Stock Mutation Reference Types:**
- `order`: Penjualan via POS checkout
- `manual`: Penyesuaian manual admin
- `opname`: Stock opname/rekonsiliasi
- `waste`: Waste/spoilage
- `supplier`: Restock dari supplier

---

## Relasi Data

```text
Category 1 ── * Product * ── * ModifierGroup 1 ── * ModifierItem
                         \
                          * ProductIngredient ── 1 Ingredient
                                                    |
                          * OrderItem * ── * OrderItemModifier ── 1 ModifierItem
                                                    |
Ingredient 1 ── * StockMutation
Ingredient 1 ── * WasteRecord

User 1 ── * Order
User 1 ── * Shift ── * Order (via orders.shift_id)
User 1 ── * HeldOrder
User 1 ── * StockMutation
User 1 ── * WasteRecord
Product 1 ── * StockMutation
Product 1 ── * OrderItem
Table 1 ── * Order / HeldOrder
```

---

## Service Layer

Semua kalkulasi keuangan dan mutasi stok **wajib melewati service class** — tidak ada kalkulasi uang atau perubahan stok yang boleh dilakukan langsung di controller.

| Service | Fungsi |
| --- | --- |
| `OrderPricingService` | Semua kalkulasi harga: line item, diskon, pajak, kembalian. Entry point: `calculateOrderPricing()` |
| `InventoryService` | Semua mutasi stok: manual adjust, potong stok order (+audit trail), set awal, update delta, **deduct/restore bahan baku per resep** |
| `ReportService` | Kalkulasi laporan: laba kotor (HPP), ringkasan penjualan (KPI) |
| `ReconciliationService` | **Baru**: Hitung expected stock, rekonsiliasi stok (opname), deteksi anomali > 5%, laporan rekonsiliasi |

**Aturan kalkulasi uang:**
- Semua intermediate monetary value **wajib** `round($val, 2)` untuk hindari float precision error
- Tidak boleh pakai `(float)` tanpa rounding
- DB menggunakan `decimal(12,2)` untuk semua kolom uang, `decimal(12,3)` untuk stok bahan baku

---

## Aturan Restriksi Keamanan & Role Access

1. **Role `superadmin` (Owner)**: Akses penuh ke SEMUA fitur termasuk rekonsiliasi stok & monitoring owner. Hanya role ini yang bisa melihat siapa melakukan perubahan stok bahan baku.
2. **Role `admin` (Staf Gudang)**: Kelola master data, bahan baku, resep, catat waste/spoilage, laporan penjualan. TIDAK bisa akses rekonsiliasi stok & monitoring owner.
3. **Role `cashier`**: Hanya dapat mengakses layar Kasir POS, fitur shift kasir milik sendiri, hold order, dan laporan sederhana. Terblokir dari rute `/admin/*` dan `/api/admin/*`.
4. **Role `kitchen`**: Khusus antarmuka tampilan pesanan dapur.

**Middleware:**
- `EnsureAdmin`: Izinkan role `admin` DAN `superadmin` (digunakan untuk `/api/admin/*`)
- `EnsureSuperAdmin`: Izinkan role `superadmin` SAJA (digunakan untuk `/api/superadmin/*`)

**Frontend Guard:**
- `requiresAdmin`: Router guard izinkan `admin` dan `superadmin`
- `requiresSuperAdmin`: Router guard izinkan `superadmin` saja, redirect ke dashboard jika admin biasa
- Sidebar computed: Menu Rekonsiliasi & Monitoring hanya muncul untuk superadmin

---

## Multi-Unit Bahan Baku (Recipe Conversion)

Sistem mendukung unit penyimpanan berbeda dari unit resep:

```text
Contoh:
- Minyak Goreng: base_unit = "liter", stok = 10 liter
- Resep Nasi Goreng: 50ml minyak, conversion_factor = 0.001
- Saat jual 1 porsi: 50 × 0.001 = 0.05 liter dikurangi dari stok

- Beras: base_unit = "kg", stok = 25 kg
- Resep Nasi Goreng: 200gr beras, conversion_factor = 0.001
- Saat jual 1 porsi: 200 × 0.001 = 0.2 kg dikurangi dari stok
```

Formula: `total_kebutuhan = quantity_needed × conversion_factor × item_quantity`

---

## Formula Keuangan & Rekonsiliasi

Semua formula ini diimplementasikan di `OrderPricingService` dan `ReportService`:

```text
1. subtotal = Σ ((product.price + Σ modifier.price) × item.quantity)
2. discount_amount:
     - Jika 'percentage': round((subtotal × min(100, discount_value)) / 100, 2)
     - Jika 'fixed': min(subtotal, discount_value)
3. taxable_amount = max(0, subtotal - discount_amount)
4. tax_amount = round((taxable_amount × tax_rate) / 100, 2)
5. total_amount = taxable_amount + tax_amount
6. gross_profit = round((total_revenue - total_discounts) - Σ (order_items.quantity × products.cost_price), 2)
```

**Formula Rekonsiliasi Stok:**
```text
expected_stock = stok_awal + total_masuk - total_keluar (penjualan + waste)
selisih = actual_stock - expected_stock
selisih_percent = abs(selisih) / expected_stock × 100
is_anomaly = selisih_percent > 5%
```

---

## Audit Trail Stok

Setiap perubahan stok **wajib** menciptakan record `StockMutation`:

| Aksi | Tipe | Reference Type | Dijalankan oleh |
| --- | --- | --- | --- |
| Potong stok produk saat checkout | `out` (negatif) | `order` | `InventoryService::deductForOrder()` via OrderController |
| Potong stok bahan baku saat checkout | `out` (negatif) | `order` | `InventoryService::deductIngredientsForOrder()` via OrderController |
| Stok awal saat buat produk | `in` | - | `InventoryService::setInitialStock()` via AdminProductController |
| Update stok via admin edit | `in`/`out` (delta) | - | `InventoryService::updateStock()` via AdminProductController |
| Penyesuaian manual admin | `in`/`out`/`opname` | `manual` | `InventoryService::adjustStock()` via InventoryController |
| Void order (produk) | `in` (per item) | `order` | `InventoryService::restoreForVoid()` via OrderController |
| Void order (bahan baku) | `in` (per bahan) | `order` | `InventoryService::restoreIngredientsForVoid()` via OrderController |
| Waste/spoilage | `out` (negatif) | `waste` | WasteController + StockMutation |
| Restock bahan baku | `in` | `supplier` | IngredientController |
| Rekonsiliasi stock opname | `opname` | `opname` | `ReconciliationService::reconcile()` via SuperadminController |
