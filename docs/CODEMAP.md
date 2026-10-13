# 🧭 Codemap & Panduan Pengembangan

Dokumen ini memetakan struktur file kode sumber pada ekosistem POS dan menjadi panduan cepat bagi pengembang (*quick developer roadmap*).

---

## 1. Peta Direktori Utama

```
POS/
├── pos-backend/          # REST API Backend (Laravel 12 / PHP 8.3+)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/        # Controller operasional kasir & publik
│   │   │   │   └── Admin/              # Controller backoffice admin & owner
│   │   │   └── Middleware/             # EnsureAdmin.php, EnsureSuperAdmin.php
│   │   ├── Models/                     # Eloquent Models (Order, Product, Ingredient, dll.)
│   │   └── Services/                   # Service Layer (Inventory, Pricing, Report, Reconciliation)
│   ├── routes/
│   │   └── api.php                     # Route definitions dengan proteksi Sanctum & Role
│   └── tests/                          # Feature & Unit Testing PHPUnit
│
├── cafe-frontend/        # Client Pemesanan & POS Kafe Aktif (React 18 + Zustand + Vite)
│   ├── src/
│   └── vite.config.js
│
├── pos-frontend/         # [Dalam Rencana / Target Migrasi Penuh ke React]
│   └── (Seluruh komponen Vue 3 sebelumnya telah dibersihkan)
│
└── docs/                 # Dokumentasi Resmi Proyek
    ├── API.md            # Kamus lengkap endpoint API & aturan request
    ├── DOMAIN.md         # Model entitas, rumus keuangan, dan arsitektur service
    └── CODEMAP.md        # File ini
```

---

## 2. Titik Masuk Perubahan Berdasarkan Fitur (*Feature-to-File Index*)

Jika Anda ingin memodifikasi atau mengembangkan modul di sisi React frontend dan Laravel backend:

| Kebutuhan Fitur | File Backend | Target Modul Frontend (React) |
| :--- | :--- | :--- |
| **Kalkulasi Checkout & Diskon** | [OrderPricingService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/OrderPricingService.php)<br>[OrderController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/OrderController.php) | Halaman POS Cashier (`pages/POS.jsx`) & Store Transaksi Cart |
| **Bahan Baku & Resep (BOM)** | [InventoryService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/InventoryService.php)<br>[RecipeController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/RecipeController.php) | Admin Backoffice (`pages/admin/RecipeManagement.jsx`) |
| **Pencatatan Waste / Basi** | [InventoryService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/InventoryService.php)<br>[WasteController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/WasteController.php) | Admin Backoffice (`pages/admin/WasteManagement.jsx`) |
| **Stock Opname & Anomali Selisih**| [ReconciliationService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/ReconciliationService.php)<br>[ReconciliationController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/ReconciliationController.php) | Owner Suite (`pages/admin/Reconciliation.jsx`, `OwnerMonitoring.jsx`) |
| **Shift Kasir & Tutup Buku** | [ShiftController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/ShiftController.php) | Komponen Modal Shift (`components/ShiftModal.jsx`) |
| **Laporan & Ekspor Laba-Rugi** | [ReportService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/ReportService.php)<br>[ReportController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/ReportController.php) | Admin Backoffice (`pages/admin/AdminReports.jsx`) |
| **Tampilan Cetak Struk** | [SettingController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/SettingController.php) | Komponen Receipt Preview (`components/ReceiptModal.jsx`) |
| **Kitchen Display (KDS)** | [OrderController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/OrderController.php) | Layar Dapur KDS (`pages/KitchenDisplay.jsx`) |
