# Rencana & Spesifikasi Admin Panel POS (Executive Suite)

Dokumen ini berisi cetak biru (blueprint) dan spesifikasi teknis untuk membangun **Admin Panel & Master Data Management System** yang elegan, terpisah dari antarmuka kasir, dan menampung seluruh menu krusial di sisi kiri.

---

## 1. Konsep Layout & Tampilan Elegan

Antarmuka Admin dirancang menggunakan tema **Dark Slate Executive (Slate-900 / Zinc-900)** di sidebar kiri dan **Clean Workspace** di area konten kanan.

### Struktur Navigasi Sidebar Kiri (Pemisahan Menu Krusial)

```text
┌────────────────────────────────────────────────────────┐
│ 🛡️ WARMINDO POS ADMIN SUITE                           │
├────────────────────────────────────────────────────────┤
│ 📊 UTAMA                                               │
│    • Dasbor Executive & Analytics                      │
│                                                        │
│ 📦 MANAJEMEN KATALOG & MENU                            │
│    • Produk & Harga (SKU, HPP/Cost, Gambar, Stok)      │
│    • Kategori Menu                                     │
│    • Modifier, Topping & Level Varian                  │
│                                                        │
│ 👥 MANAJEMEN USER & HAK AKSES                          │
│    • Kelola Staf & Kasir (Role, Akses, Reset Password) │
│    • Riwayat Aktivitas & Shift Kasir                   │
│                                                        │
│ 🏬 RESTORAN & INVENTARIS                               │
│    • Kelola Meja & Floor Plan                          │
│    • Penyesuaian Stok (Stock In / Out / Opname)        │
│    • Alert Stok Menipis                                │
│                                                        │
│ ⚙️ PENGATURAN TOKO & SISTEM                            │
│    • Pengaturan Toko & Struk (Header/Footer/Pajak)     │
│    • Log Audit & Keamanan                              │
└────────────────────────────────────────────────────────┘
```

---

## 2. Rencana Modul & Fitur Krusial Admin

### A. Manajemen User & Staf (Role-Based Access Control)
- **Role yang Didukung**: `admin`, `cashier`, `kitchen`.
- **Fitur Utama**:
  - Tabel staf dengan filter status (`aktif` / `nonaktif`) dan role.
  - Form Tambah & Edit User (Nama, Email, Password, Role, Status Aktif).
  - Reset Password instan oleh Admin.
  - Pembatasan Keamanan: Kasir tidak bisa mengakses halaman Admin; Admin memiliki akses penuh.

### B. Manajemen Produk & Modifier Lengkap
- **Fitur Utama**:
  - Master Produk: Edit Nama, SKU/Barcode, Kategori, Harga Jual, Harga Modal (HPP / `cost_price`), Jumlah Stok, Fitur Tracking Stok, Gambar/Foto Produk, dan Status Aktif.
  - Generator Barcode Otomatis.
  - Kelola Modifier Group (Nama Group, Status Wajib, Min & Max Pilihan).
  - Kelola Modifier Item (Nama Topping/Varian & Tambahan Harga).
  - Hubungkan Produk ↔ Modifier Group secara visual.

### C. Manajemen Meja & Restoran
- **Fitur Utama**:
  - Daftar Meja: Nomor Meja, Kapasitas Tempat Duduk, Area/Lantai, Status (`available`, `occupied`, `reserved`).
  - Cetak QR Code Meja untuk pemesanan digital.

### D. Kontrol Stok & Inventaris (Stock Adjustment)
- **Fitur Utama**:
  - Form Penyesuaian Stok Manual (*Stock In* / Restock, *Stock Out* / Rusak / Expired, *Stock Opname*).
  - Catatan Alasan Mutasi Stok.
  - Log Riwayat Mutasi Stok dengan timestamp & user pencatat.
  - Dashboard Notifikasi Stok Menipis (*Low Stock Warning*).

### E. Pengaturan Toko & Struk (Store Settings)
- **Fitur Utama**:
  - Profil Toko: Nama Toko/Resto, Alamat Lengkap, Nomor Telepon, Email.
  - Konfigurasi Struk Thermal: Teks Header Struk, Teks Footer / Pesan Terima Kasih, Logo Toko.
  - Keuangan Default: Persentase Pajak Default (cth: 10%), Service Charge %, Format Prefix Invoice (cth: `INV-`).

---

## 3. Rencana Arsitektur Backend (Laravel 13)

### Middleware Pembatasan Akses Admin
Membuat middleware `EnsureUserIsAdmin` atau merestriksi via `role:admin`:
```php
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Users
    Route::apiResource('users', AdminUserController::class);
    Route::post('users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);

    // Master Product & Modifier CRUD
    Route::apiResource('products', AdminProductController::class);
    Route::apiResource('categories', AdminCategoryController::class);
    Route::apiResource('modifier-groups', AdminModifierGroupController::class);
    Route::apiResource('modifier-items', AdminModifierItemController::class);

    // Tables
    Route::apiResource('tables', AdminTableController::class);

    // Stock Adjustments
    Route::post('inventory/adjust', [InventoryController::class, 'adjustStock']);
    Route::get('inventory/logs', [InventoryController::class, 'stockLogs']);

    // Store Settings
    Route::get('settings', [SettingController::class, 'show']);
    Route::put('settings', [SettingController::class, 'update']);
});
```

---

## 4. Rencana Arsitektur Frontend (Vue 3)

### Struktur Komponen & Layout Admin
- **Layout**: `src/layouts/AdminLayout.vue` (Sidebar Kiri Gelap Slate-900, Top Header dengan profil admin & quick actions, Main Workspace Container).
- **Views**:
  - `src/views/admin/AdminDashboard.vue`: Overview Executive, Grafik Omzet, Top Staf.
  - `src/views/admin/UserManagement.vue`: Kelola staf & kasir.
  - `src/views/admin/ProductManagement.vue`: Master produk, HPP, stok, barcode.
  - `src/views/admin/CategoryManagement.vue`: Master kategori.
  - `src/views/admin/ModifierManagement.vue`: Master varian & topping.
  - `src/views/admin/TableManagement.vue`: Kelola meja restoran.
  - `src/views/admin/InventoryManagement.vue`: Mutasi stok & opname.
  - `src/views/admin/StoreSettings.vue`: Pengaturan toko, struk, dan pajak.
