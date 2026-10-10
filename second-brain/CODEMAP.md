# Peta Kode (Backend & Frontend)

> Buka file yang disebut di bawah lebih dulu. Hindari pencarian proyek penuh kecuali fitur yang dicari belum tercantum atau dokumentasi sudah tidak sesuai source code.

---

## 1. Backend (Laravel 13)

### Service Layer
| File | Tanggung jawab |
| --- | --- |
| `app/Services/OrderPricingService.php` | Semua kalkulasi harga: line item, diskon, pajak, kembalian, full order pricing breakdown. Semua intermediate pakai `round($val, 2)` |
| `app/Services/InventoryService.php` | Semua mutasi stok: adjustStock (in/out/opname), deductForOrder, **deductIngredientsForOrder** (+audit trail), **restoreIngredientsForVoid**, setInitialStock, updateStock |
| `app/Services/ReportService.php` | Kalkulasi laporan: profitLoss (gross profit dari HPP), salesSummary (KPI, breakdown metode bayar & tipe order) |
| `app/Services/ReconciliationService.php` | **Baru**: calculateExpectedStock(), reconcile() (stock opname + anomaly detection), getReconciliationReport() |

### Routing & Middleware
| File | Tanggung jawab |
| --- | --- |
| `routes/api.php` | Semua route HTTP API: Kasir, Admin (`/api/admin/*`), **Superadmin (`/api/superadmin/*`)** |
| `app/Http/Middleware/EnsureAdmin.php` | Middleware pembatasan role: izinkan `admin` DAN `superadmin` |
| `app/Http/Middleware/EnsureSuperAdmin.php` | **Baru**: Middleware pembatasan role: izinkan `superadmin` SAJA |

### Admin Controllers (`app/Http/Controllers/Api/Admin/`)
| File | Tanggung jawab |
| --- | --- |
| `AdminUserController.php` | CRUD staf/kasir/admin, reset password, & toggle aktif |
| `AdminProductController.php` | Master produk, HPP `cost_price`, stok (via `InventoryService`), SKU, & modifier sync |
| `AdminCategoryController.php` | Master kategori & jumlah produk |
| `AdminModifierController.php` | Master grup modifier & item varian/topping |
| `AdminTableController.php` | Master meja restoran & floor plan |
| `InventoryController.php` | Penyesuaian stok via `InventoryService` & log mutasi |
| `IngredientController.php` | **Baru**: CRUD bahan baku, low stock alert, riwayat mutasi per bahan |
| `RecipeController.php` | **Baru**: CRUD resep per produk (BOM), estimasi biaya per porsi |
| `WasteController.php` | **Baru**: Catat waste/spoilage, laporan summary, auto deduct stok bahan |
| `ReconciliationController.php` | **Baru**: Stock opname hybrid (expected vs actual), anomaly detection > 5% |
| `SettingController.php` | Profil toko, pesan struk header/footer, & pajak default |

### POS Controllers (`app/Http/Controllers/Api/`)
| File | Tanggung jawab |
| --- | --- |
| `OrderController.php` | Checkout: validasi → `OrderPricingService` → `InventoryService::deductForOrder()` + **`deductIngredientsForOrder()`** → response. Void: `InventoryService::restoreForVoid()` (produk + bahan baku) |
| `ReportController.php` | Laporan: delegate kalkulasi ke `ReportService`, CSV export |
| `ShiftController.php` | Buka/tutup shift, rekonsiliasi kas, metrik ( semua intermediate `round($val, 2)`) |

### Model & Database
| File | Tanggung jawab |
| --- | --- |
| `app/Models/Product.php` | Relasi + `hasEnoughStock(int)`, `effectiveUnitPrice(float...)`, relasi `orderItems()`, `stockMutations()`, **`ingredients()` (many-to-many via product_ingredients)** |
| `app/Models/Ingredient.php` | **Baru**: Model bahan baku, relasi `products()`, `stockMutations()`, `wasteRecords()`, `isLowStock()` |
| `app/Models/WasteRecord.php` | **Baru**: Model waste/spoilage, relasi `ingredient()`, `user()`, `shift()` |
| `app/Models/StockMutation.php` | Constants `TYPE_IN`, `TYPE_OUT`, `TYPE_OPNAME`. **Baru**: `ingredient_id`, `reference_type`, `reference_id` |
| `app/Models/Shift.php` | Relasi `user()`, `orders()` |
| `app/Models/Order.php` | `casts()` untuk semua kolom decimal |
| `database/migrations/2026_09_02_100000_create_settings_table.php` | Migration tabel settings |
| `database/migrations/2026_09_02_110000_create_stock_mutations_table.php` | Migration tabel stock_mutations |
| `database/migrations/2026_09_04_000001_create_ingredients_table.php` | **Baru**: Tabel bahan baku (nama, base_unit, stok, min_alert, cost_per_unit) |
| `database/migrations/2026_09_04_000002_create_product_ingredients_table.php` | **Baru**: Pivot resep/BOM (quantity_needed, recipe_unit, conversion_factor) |
| `database/migrations/2026_09_04_000003_create_waste_records_table.php` | **Baru**: Tabel waste (alasan, foto bukti) |
| `database/migrations/2026_09_04_000004_update_stock_mutations_table.php` | **Baru**: Tambah ingredient_id, reference_type, reference_id |
| `database/migrations/2026_09_04_000005_add_superadmin_role_to_users_table.php` | **Baru**: Tambah role `superadmin` ke enum users |
| `database/seeders/IngredientSeeder.php` | **Baru**: Seeder bahan baku (20 item), resep (9 produk), waste, stock mutations 14 hari |

---

## 2. Frontend (Vue 3 + Pinia + Tailwind CSS)

### Layout & Navigation
| File | Tanggung jawab |
| --- | --- |
| `src/layouts/AdminLayout.vue` | Layout Admin dengan Dark Slate Sidebar Kiri Elegan, **sidebar computed berdasarkan role** (menu Rekonsiliasi & Monitoring hanya untuk superadmin), Top Header Executive, & quick navigation |
| `src/router.js` | Konfigurasi Vue Router: Kasir POS, Dashboard Laporan, Admin Suite `/admin/*`, **guard `requiresSuperAdmin`** untuk route rekonsiliasi & monitoring |

### Views Kasir & Operasional (`src/views/`)
| File | Tanggung jawab |
| --- | --- |
| `src/views/POS.vue` | Layar Kasir Utama: Denah meja interaktif (`F3`), Split Bill, Dynamic QRIS + EDC + Cash presets, Live Preview Struk 58mm/80mm, Tab Rekonsiliasi Kas Laci & Riwayat Transaksi Shift Kasir |
| `src/views/KitchenDisplay.vue` | Layar Dapur & Bar Minimalis (KDS): Antrean order aktif, highlight varian & catatan koki, timer durasi tunggu, tombol satu ketukan "Tandai Selesai" |
| `src/views/Login.vue` | Split-Screen Login SaaS modern, showcase fitur, Quick-Fill Demo Chips (Superadmin, Admin, Kasir, Kitchen), password visibility toggle |

### Admin Views (`src/views/admin/`)
| File | Tanggung jawab |
| --- | --- |
| `AdminDashboard.vue` | Dasbor Executive Admin, KPI metrics, low stock alert widget, & quick access |
| `AdminReports.vue` | Laporan Penjualan Terpadu, analisis laba kotor dari HPP, tabel performa & rekap kas per kasir (Owner Tracking), top menu, & ekspor CSV |
| `UserManagement.vue` | Kelola staf/kasir, modal CRUD user, toggle aktif, & reset password |
| `ProductManagement.vue` | Master produk lengkap, filter kategori, search, HPP, & modal CRUD produk |
| `CategoryManagement.vue` | Kelola kategori menu |
| `ModifierManagement.vue` | Kelola grup modifier & item topping/varian |
| `TableManagement.vue` | Management meja restoran & kapasitas kursi |
| `InventoryManagement.vue` | Form penyesuaian stok manual & tabel audit log mutasi stok |
| `IngredientManagement.vue` | **Baru**: CRUD bahan baku, low stock alert, riwayat mutasi per bahan, filter stok menipis |
| `RecipeManagement.vue` | **Baru**: Atur resep/BOM per produk, estimasi biaya bahan per porsi, auto-set conversion factor |
| `WasteManagement.vue` | **Baru**: Catat waste/spoilage, summary bulanan, breakdown per alasan & bahan |
| `ReconciliationPage.vue` | **Baru**: Stock opname hybrid (sistem vs fisik), auto-flag anomali > 5%. **Khusus superadmin.** |
| `OwnerMonitoring.vue` | **Baru**: Monitoring SEMUA aktivitas stok (siapa, kapan, apa), anomaly banner, filter tipe/user/tanggal, low stock list, rekonsiliasi summary. **Khusus superadmin.** |
| `StoreSettings.vue` | Pengaturan profil toko, struk thermal header/footer, & default pajak |

### Composables & Stores (`src/composables/`, `src/stores/`)
| File | Tanggung jawab |
| --- | --- |
| `src/composables/useSoundFx.js` | Synthesizer efek suara kasir native Web Audio API (`playBeep`, `playSuccess`, `playWarning`) |
| `src/composables/useBarcodeScanner.js` | Listener HID Barcode scanner USB/Bluetooth otomatis |
| `src/stores/pos.js` | Pinia Store: Cart, kategori, produk, meja, shift kasir, transaksi shift aktif kasir, diskon & pajak |
