# API Reference

Base path: `/api`. Semua endpoint kecuali `POST /login` membutuhkan Bearer token Sanctum.

---

## Auth

| Method | Path | Tujuan |
| --- | --- | --- |
| POST | `/login` | Login dan membuat token baru |
| GET | `/me` | Profil user yang sedang login |
| POST | `/logout` | Menghapus token yang dipakai request |

---

## Kasir & Transaksi POS

| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/categories` | Semua kategori aktif |
| GET | `/products` | Grid produk aktif |
| GET | `/products/by-barcode/{code}` | Instant lookup barcode/SKU produk |
| GET | `/orders` | Riwayat pesanan (filter: `status`, `payment_method`, `date`, `user_id`, `shift_id`, `today_only`) |
| POST | `/orders` | Membuat order selesai & lunas (Diskon %/Rp & Pajak dinamis) |
| POST | `/orders/{order}/void` | Void/batalkan order + kembalikan stok (hari ini saja) |
| GET | `/orders/held` | Mengambil transaksi tertahan (*held orders*) |
| POST | `/orders/hold` | Menyimpan sementara transaksi keranjang |
| DELETE | `/orders/held/{heldOrder}` | Menghapus transaksi tertahan |
| GET | `/tables` | Daftar meja restoran (dibuka untuk role kasir & admin) |
| GET | `/settings/store` | Pengaturan toko untuk POS frontend (read-only) |
| GET | `/shift/current` | Status shift aktif & omzet berjalan kasir |
| POST | `/shift/open` | Buka shift kasir |
| POST | `/shift/close` | Tutup shift kasir & rekonsiliasi kas |
| GET | `/reports/sales-summary` | KPI ringkasan penjualan & breakdown pembayaran (filter: `user_id`) |
| GET | `/reports/cashier-sales` | Rekapitulasi penjualan & performa kasir (Owner Tracking) |
| GET | `/reports/profit-loss` | Laba kotor (Gross profit) dari HPP (`cost_price`) |
| GET | `/reports/export-csv` | Download file CSV laporan penjualan |

---

## Admin Executive Suite (`/api/admin/*`)

*Catatan: Semua endpoint di bawah dilindungi oleh middleware `auth:sanctum` dan `EnsureAdmin` (`role:admin`).*

### 👥 Manajemen User & Staf
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/users` | Daftar seluruh staf (filter: `role`, `search`) |
| POST | `/admin/users` | Tambah staf/kasir/admin baru |
| PUT | `/admin/users/{user}` | Edit profil, role, atau toggle `is_active` |
| POST | `/admin/users/{user}/reset-password` | Reset password user |
| DELETE | `/admin/users/{user}` | Hapus staf/user |

### 📦 Master Produk & Katalog
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/products` | Master semua produk (termasuk yang nonaktif) |
| POST | `/admin/products` | Tambah produk (Nama, SKU, Harga, HPP `cost_price`, Stok, Modifier) |
| GET | `/admin/products/{product}` | Detail produk master |
| PUT | `/admin/products/{product}` | Edit produk master |
| DELETE | `/admin/products/{product}` | Hapus produk |
| GET | `/admin/categories` | Master kategori & jumlah produk |
| POST | `/admin/categories` | Tambah kategori |
| PUT | `/admin/categories/{category}` | Edit kategori |
| DELETE | `/admin/categories/{category}` | Hapus kategori |

### 🧩 Modifier & Varian
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/modifier-groups` | List grup modifier beserta item varian |
| POST | `/admin/modifier-groups` | Tambah grup modifier (Mandatory, Min/Max) |
| PUT | `/admin/modifier-groups/{modifierGroup}` | Edit grup modifier |
| DELETE | `/admin/modifier-groups/{modifierGroup}` | Hapus grup modifier |
| POST | `/admin/modifier-items` | Tambah item topping/varian tunggal |
| PUT | `/admin/modifier-items/{modifierItem}` | Edit item modifier |
| DELETE | `/admin/modifier-items/{modifierItem}` | Hapus item modifier |

### 🏬 Meja Restoran (Floor Plan)
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/tables` | List meja restoran |
| POST | `/admin/tables` | Tambah meja (Nomor, Kapasitas, Status) |
| PUT | `/admin/tables/{table}` | Edit meja |
| DELETE | `/admin/tables/{table}` | Hapus meja |

### 📉 Inventaris & Mutasi Stok
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/inventory/logs` | Log riwayat mutasi stok (`stock_mutations`) |
| GET | `/admin/inventory/low-stock` | Daftar produk dengan stok menipis (&le; 10 porsi) |
| POST | `/admin/inventory/adjust` | Penyesuaian stok manual (`Stock In`, `Stock Out`, `Stock Opname`) |

### ⚙️ Pengaturan Toko & Struk
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/settings` | Mengambil profil toko, teks struk, & pajak default |
| PUT | `/admin/settings` | Memperbarui profil toko, struk header/footer, & pajak |

### 🌾 Bahan Baku (Ingredients)
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/ingredients` | Daftar bahan baku (filter: `search`, `low_stock`) |
| POST | `/admin/ingredients` | Tambah bahan baku (nama, unit, stok, min alert, harga/unit) |
| GET | `/admin/ingredients/low-stock` | Bahan baku stok menipis (&le; min_stock_alert) |
| GET | `/admin/ingredients/{ingredient}` | Detail bahan baku beserta produk terkait |
| PUT | `/admin/ingredients/{ingredient}` | Edit bahan baku |
| GET | `/admin/ingredients/{ingredient}/mutations` | Riwayat mutasi stok per bahan |

### 📖 Resep Produk (Recipe/BOM)
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/products/{product}/recipe` | Lihat resep produk + estimasi biaya per porsi |
| POST | `/admin/products/{product}/recipe` | Set/update resep (bahan + jumlah + unit + conversion factor) |
| DELETE | `/admin/products/{product}/recipe/{ingredient}` | Hapus bahan dari resep |

### 🗑️ Waste & Spoilage Tracking
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/admin/waste` | Riwayat waste (filter: `ingredient_id`, `reason`, `start_date`, `end_date`) |
| POST | `/admin/waste` | Catat waste (bahan, jumlah, alasan, catatan) — stok otomatis dikurangi |
| GET | `/admin/waste/summary` | Ringkasan waste per periode (total, by reason, by ingredient) |

---

## Superadmin Only (`/api/superadmin/*`)

*Catatan: Endpoint di bawah HANYA untuk role `superadmin` (owner). Middleware: `EnsureAdmin` + `EnsureSuperAdmin`.*

### ⚖️ Rekonsiliasi Stok (Stock Opname)
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/superadmin/reconciliation/expected-stock` | Hitung stok seharusnya berdasarkan mutasi (filter: `ingredient_id`, `start_date`, `end_date`) |
| POST | `/superadmin/reconciliation` | Input stok fisik aktual + hitung selisih + auto-flag anomali > 5% |
| GET | `/superadmin/reconciliation/report` | Laporan rekonsiliasi semua bahan + daftar anomali |

### 🔍 Monitoring Owner
| Method | Path | Tujuan |
| --- | --- | --- |
| GET | `/superadmin/monitoring/all-mutations` | Semua aktivitas stok (redirect ke inventory/logs) |
| GET | `/superadmin/monitoring/anomalies` | Data anomali stok (redirect ke reconciliation/report) |
