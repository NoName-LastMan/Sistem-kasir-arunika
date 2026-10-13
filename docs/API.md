# 📖 API Documentation Reference

Base URL: `http://localhost:8000/api` (atau disesuaikan dengan konfigurasi env backend Anda).

Semua endpoint kecuali `POST /login` dan `GET /settings/store` membutuhkan HTTP Header:
```http
Authorization: Bearer <your_sanctum_token>
Accept: application/json
```

---

## 🔐 1. Authentication

| Method | Endpoint | Role | Deskripsi | Request Body / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Login pengguna & pembuatan Bearer token Sanctum | `{"email": "...", "password": "..."}` |
| `GET` | `/me` | Authenticated | Ambil data profil & role user yang sedang aktif | - |
| `POST` | `/logout` | Authenticated | Hapus token session saat ini | - |

---

## 🛒 2. Operasional Kasir & Transaksi POS

Endpoint untuk kasir harian (`cashier`), staf dapur, maupun admin.

| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Kasir/Admin | Ambil daftar kategori produk aktif |
| `POST` | `/categories` | Kasir/Admin | Tambah kategori produk |
| `DELETE` | `/categories/{category}` | Kasir/Admin | Hapus kategori produk |
| `GET` | `/products` | Kasir/Admin | Daftar grid katalog produk aktif |
| `POST` | `/products` | Kasir/Admin | Tambah produk cepat dari kasir |
| `GET` | `/products/by-barcode/{code}` | Kasir/Admin | Lookup instan produk via kode barcode/SKU |
| `GET` | `/products/{product}` | Kasir/Admin | Detail spesifik produk |
| `GET` | `/orders` | Kasir/Admin | Riwayat pesanan (Query: `status`, `payment_method`, `date`, `user_id`, `shift_id`, `today_only`) |
| `POST` | `/orders` | Kasir/Admin | Simpan transaksi checkout lunas (hitung pajak, diskon %, nominal, modifier, auto-deduct bahan) |
| `POST` | `/orders/{order}/void` | Kasir/Admin | Pembatalan/Void transaksi hari ini & kembalikan stok fisik/bahan |
| `GET` | `/orders/{order}` | Kasir/Admin | Detail nota/order pesanan |
| `GET` | `/orders/held` | Kasir/Admin | Daftar order tertahan (*Hold Order*) |
| `POST` | `/orders/hold` | Kasir/Admin | Simpan sementara pesanan keranjang |
| `DELETE` | `/orders/held/{heldOrder}` | Kasir/Admin | Hapus transaksi hold |
| `GET` | `/settings/store` | Public/Kasir | Ambil profil toko, nama, alamat, no telp, pesan struk (read-only) |
| `GET` | `/tables` | Kasir/Admin | Daftar status meja (Dine-in floor plan) |

---

## ⏱️ 3. Manajemen Shift Kasir

| Method | Endpoint | Role | Deskripsi | Request Body / Query |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/shift/current` | Kasir/Admin | Status shift yang sedang berjalan untuk user saat ini | - |
| `POST` | `/shift/open` | Kasir/Admin | Buka shift kasir baru dengan modal kas awal | `{"starting_cash": 100000}` |
| `POST` | `/shift/close` | Kasir/Admin | Tutup shift kasir & input hitungan fisik kas | `{"actual_cash": 450000, "note": "..."}` |
| `GET` | `/shift/{shift}/summary` | Kasir/Admin | Ringkasan omzet, selisih kas, & transaksi per shift | - |

---

## 📊 4. Laporan Penjualan & Analytics

| Method | Endpoint | Role | Deskripsi | Query Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/reports/daily-revenue` | Kasir/Admin | Grafik pendapatan harian | `start_date`, `end_date` |
| `GET` | `/reports/top-products` | Kasir/Admin | 10 menu/produk terlaris | `start_date`, `end_date`, `limit` |
| `GET` | `/reports/sales-summary` | Kasir/Admin | KPI penjualan, total omzet, breakdown metode bayar | `start_date`, `end_date`, `user_id` |
| `GET` | `/reports/cashier-sales` | Kasir/Admin | Rekapitulasi omzet per kasir | `start_date`, `end_date` |
| `GET` | `/reports/profit-loss` | Kasir/Admin | Laba kotor (*Gross profit*) dihitung dari HPP/`cost_price` | `start_date`, `end_date` |
| `GET` | `/reports/export-csv` | Kasir/Admin | Download file CSV rekap transaksi | `start_date`, `end_date` |

---

## 👔 5. Admin Backoffice Suite (`/api/admin/*`)

*Membutuhkan token dengan role `admin` atau `superadmin`.*

### User & Staf Management
- `GET /api/admin/users` - Daftar staf & kasir (Filter: `role`, `search`)
- `POST /api/admin/users` - Tambah user/kasir baru
- `PUT /api/admin/users/{user}` - Update identitas, role, atau toggle status aktif
- `POST /api/admin/users/{user}/reset-password` - Reset password user
- `DELETE /api/admin/users/{user}` - Hapus staf

### Master Katalog & Produk
- `GET /api/admin/products` - Semua produk termasuk produk nonaktif
- `POST /api/admin/products` - Tambah master produk lengkap (SKU, harga jual, HPP, stok)
- `GET /api/admin/products/{product}` - Detail master produk
- `PUT /api/admin/products/{product}` - Edit produk
- `DELETE /api/admin/products/{product}` - Hapus produk
- `GET /api/admin/categories` - Master kategori
- `POST /api/admin/categories` - Tambah kategori
- `PUT /api/admin/categories/{category}` - Edit kategori
- `DELETE /api/admin/categories/{category}` - Hapus kategori

### Modifier & Varian (Topping, Ukuran, Level)
- `GET /api/admin/modifier-groups` - Daftar grup modifier
- `POST /api/admin/modifier-groups` - Tambah grup modifier (Mandatory, Min/Max)
- `PUT /api/admin/modifier-groups/{modifierGroup}` - Edit grup modifier
- `DELETE /api/admin/modifier-groups/{modifierGroup}` - Hapus grup modifier
- `POST /api/admin/modifier-items` - Tambah opsi varian / topping
- `PUT /api/admin/modifier-items/{modifierItem}` - Edit opsi varian
- `DELETE /api/admin/modifier-items/{modifierItem}` - Hapus opsi varian

### Meja Restoran (Floor Plan)
- `GET /api/admin/tables` - Daftar meja restoran
- `POST /api/admin/tables` - Tambah nomor meja, kapasitas & lokasi
- `PUT /api/admin/tables/{table}` - Update data meja
- `DELETE /api/admin/tables/{table}` - Hapus meja

### Inventaris & Mutasi Stok Produk Jadi
- `GET /api/admin/inventory/logs` - Kartu audit log mutasi stok produk
- `GET /api/admin/inventory/low-stock` - Alert produk dengan stok menipis (≤ 10)
- `POST /api/admin/inventory/adjust` - Penyesuaian stok manual (`in`, `out`, `opname`)

### Bahan Baku (Raw Ingredients)
- `GET /api/admin/ingredients` - Daftar stok bahan mentah (Filter: `search`, `low_stock`)
- `POST /api/admin/ingredients` - Tambah bahan baku (Nama, Satuan: `kg`/`gr`/`ml`/`pcs`, Min stok alert, Harga beli)
- `GET /api/admin/ingredients/low-stock` - Alert bahan baku di bawah batas aman
- `GET /api/admin/ingredients/{ingredient}` - Detail bahan & info pemakaian resep
- `PUT /api/admin/ingredients/{ingredient}` - Update data bahan baku
- `GET /api/admin/ingredients/{ingredient}/mutations` - Riwayat mutasi kartu stok bahan baku

### Resep Produk (Bill of Materials / BOM)
- `GET /api/admin/products/{product}/recipe` - Ambil daftar bahan baku & takaran per porsi menu
- `POST /api/admin/products/{product}/recipe` - Konfigurasi takaran bahan baku (dengan conversion factor)
- `DELETE /api/admin/products/{product}/recipe/{ingredient}` - Hapus bahan baku dari resep

### Waste & Spoilage Tracking (Pencatatan Bahan Terbuang/Rusak)
- `GET /api/admin/waste` - Riwayat log bahan yang terbuang/basi/rusak
- `POST /api/admin/waste` - Catat waste (otomatis memotong stok bahan baku dengan audit log)
- `GET /api/admin/waste/summary` - Rekapitulasi waste per alasan dan periode

### Pengaturan Profil Toko & Struk
- `GET /api/admin/settings` - Ambil konfigurasi toko, header/footer struk, pajak PPN default
- `PUT /api/admin/settings` - Perbarui informasi toko & format struk

---

## 👑 6. Superadmin / Owner Only (`/api/superadmin/*`)

*Hanya dapat diakses oleh akun dengan role `superadmin`.*

### Rekonsiliasi Stok (Stock Opname Otomatis & Deteksi Selisih)
- `GET /api/superadmin/reconciliation/expected-stock` - Menghitung ekspektasi stok sistem matematis berdasarkan mutasi masuk/keluar
- `POST /api/superadmin/reconciliation` - Input stok fisik riil, kalkulasi otomatis selisih & auto-flag anomali jika selisih > 5%
- `GET /api/superadmin/reconciliation/report` - Laporan berkala rekonsiliasi stok beserta daftar anomali

### Monitoring Owner Terpadu
- `GET /api/superadmin/monitoring/all-mutations` - Pantau seluruh kartu mutasi stok real-time (siapa yang mengubah, kapan, dan berapa jumlahnya)
- `GET /api/superadmin/monitoring/anomalies` - Pantau rekap selisih stok yang mencurigakan secara terpusat
