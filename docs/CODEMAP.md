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
├── pos-frontend/         # Client Operasional POS, KDS & Backoffice ERP (React 18 + Zustand + Vite)
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/pos/   # PaymentModal, ReceiptModal, HeldOrdersModal, TablePickerModal
│   │   ├── components/shifts/# ShiftModal
│   │   ├── pages/pos/        # POSPage.jsx
│   │   ├── pages/orders/     # OrdersPage.jsx
│   │   ├── pages/kitchen/    # KitchenDisplayPage.jsx
│   │   ├── pages/admin/      # ProductsPage, IngredientsPage, RecipeManagementPage, WasteManagementPage, ReportsPage, etc.
│   │   └── pages/superadmin/ # ReconciliationPage, AuditLogPage
│   └── vite.config.js
│
└── docs/                 # Dokumentasi Resmi Proyek
    ├── API.md            # Kamus lengkap endpoint API & aturan request
    ├── DOMAIN.md         # Model entitas, rumus keuangan, dan arsitektur service
    └── CODEMAP.md        # File ini
```

---

## 2. Titik Masuk Perubahan Berdasarkan Fitur (*Feature-to-File Index*)

Jika Anda ingin memodifikasi atau mengembangkan modul di sisi React frontend dan Laravel backend:

| Kebutuhan Fitur | File Backend | Modul Frontend Aktif (`pos-frontend`) |
| :--- | :--- | :--- |
| **Kalkulasi Checkout & Diskon** | [OrderPricingService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/OrderPricingService.php)<br>[OrderController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/OrderController.php) | [`pages/pos/POSPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/pos/POSPage.jsx) & [`stores/posStore.js`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/stores/posStore.js) |
| **Bahan Baku & Resep (BOM)** | [InventoryService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/InventoryService.php)<br>[RecipeController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/RecipeController.php) | [`pages/admin/RecipeManagementPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/admin/RecipeManagementPage.jsx) |
| **Pencatatan Waste / Basi** | [InventoryService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/InventoryService.php)<br>[WasteController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/WasteController.php) | [`pages/admin/WasteManagementPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/admin/WasteManagementPage.jsx) |
| **Stock Opname & Anomali Selisih**| [ReconciliationService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/ReconciliationService.php)<br>[ReconciliationController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/ReconciliationController.php) | [`pages/superadmin/ReconciliationPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/superadmin/ReconciliationPage.jsx) & [`AuditLogPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/superadmin/AuditLogPage.jsx) |
| **Shift Kasir & Tutup Buku** | [ShiftController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/ShiftController.php) | [`components/shifts/ShiftModal.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/components/shifts/ShiftModal.jsx) & [`stores/shiftStore.js`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/stores/shiftStore.js) |
| **Laporan & Ekspor Laba-Rugi** | [ReportService.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Services/ReportService.php)<br>[ReportController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/ReportController.php) | [`pages/admin/ReportsPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/admin/ReportsPage.jsx) |
| **Tampilan Cetak Struk** | [SettingController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/Admin/SettingController.php) | [`components/pos/ReceiptModal.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/components/pos/ReceiptModal.jsx) |
| **Kitchen Display (KDS)** | [OrderController.php](file:///c:/Users/lenov/Documents/POS/pos-backend/app/Http/Controllers/Api/OrderController.php) | [`pages/kitchen/KitchenDisplayPage.jsx`](file:///c:/Users/lenov/Documents/POS/pos-frontend/src/pages/kitchen/KitchenDisplayPage.jsx) |
