<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\HeldOrderController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ReportController;

// Admin Controllers
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminModifierController;
use App\Http\Controllers\Api\Admin\AdminTableController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\IngredientController;
use App\Http\Controllers\Api\Admin\RecipeController;
use App\Http\Controllers\Api\Admin\WasteController;
use App\Http\Controllers\Api\Admin\ReconciliationController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureSuperAdmin;

use Illuminate\Support\Facades\Route;

// System Health Check
Route::get('/health', function () {
    $dbStatus = false;
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = true;
    } catch (\Throwable $e) {
        // DB connection error
    }

    $forecastingUrl = config('services.forecasting.url', 'http://127.0.0.1:8001');
    $forecastingStatus = false;
    try {
        $res = \Illuminate\Support\Facades\Http::timeout(1.0)->get("{$forecastingUrl}/health");
        $forecastingStatus = $res->successful();
    } catch (\Throwable $e) {
        // Forecasting microservice offline
    }

    $isHealthy = $dbStatus;

    return response()->json([
        'status' => $isHealthy ? 'healthy' : 'unhealthy',
        'timestamp' => now()->toIso8601String(),
        'services' => [
            'database' => $dbStatus ? 'connected' : 'disconnected',
            'forecasting_engine' => $forecastingStatus ? 'connected' : 'offline',
        ],
        'environment' => config('app.env'),
    ], $isHealthy ? 200 : 503);
});

// Public routes untuk otentikasi staf & aplikasi tamu self-order (cafe-frontend)
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::get('/public/settings', [SettingController::class, 'showPublic']);
Route::get('/public/menu', [ProductController::class, 'publicMenu']);
Route::get('/public/tables/{code}', [AdminTableController::class, 'publicValidateTable']);
Route::post('/public/orders', [OrderController::class, 'publicCreateOrder'])->middleware('throttle:30,1');
Route::get('/public/orders/{id}/status', [OrderController::class, 'publicOrderStatus']);

// SSE real-time stream (otentikasi mandiri via query token atau bearer header untuk kompatibilitas browser EventSource)
Route::get('/orders/stream', [OrderController::class, 'stream']);

// Protected routes (Kasir, Koki, Admin, Owner)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profil
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Kategori
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Produk & Barcode & Upload Foto
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::post('/upload-image', [ProductController::class, 'uploadImage']);
    Route::get('/products/by-barcode/{code}', [ProductController::class, 'byBarcode']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    // Transaksi POS, Konfirmasi Kasir, Dapur & Riwayat Order
    Route::get('/orders/pending-count', [OrderController::class, 'pendingCount']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm']);
    Route::post('/orders/{order}/serve', [OrderController::class, 'serve']);
    Route::post('/orders/{order}/void', [OrderController::class, 'void']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Hold Order (Simpan Sementara Transaksi)
    Route::get('/orders/held', [HeldOrderController::class, 'index']);
    Route::post('/orders/hold', [HeldOrderController::class, 'store']);
    Route::delete('/orders/held/{heldOrder}', [HeldOrderController::class, 'destroy']);

    // Pengaturan Toko (read-only untuk kasir)
    Route::get('/settings/store', [SettingController::class, 'showPublic']);

    // Manajemen Shift Kasir
    Route::get('/shift/current', [ShiftController::class, 'currentShift']);
    Route::post('/shift/open', [ShiftController::class, 'openShift']);
    Route::post('/shift/close', [ShiftController::class, 'closeShift']);
    Route::get('/shift/{shift}/summary', [ShiftController::class, 'summary']);

    // Manajemen Meja Restoran (untuk kasir & admin)
    Route::get('/tables', [AdminTableController::class, 'index']);

    // Laporan Penjualan & Analytics
    Route::get('/reports/daily-revenue', [ReportController::class, 'dailyRevenue']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/sales-summary', [ReportController::class, 'salesSummary']);
    Route::get('/reports/cashier-sales', [ReportController::class, 'cashierSales']);
    Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);
    Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);
    Route::get('/reports/export-excel', [ReportController::class, 'exportExcel']);

    // ==========================================
    // KHUSUS ROUTE ADMIN EXECUTIVE SUITE
    // ==========================================
    Route::middleware(EnsureAdmin::class)->prefix('admin')->group(function () {
        // User & Staf Management
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{user}', [AdminUserController::class, 'update']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
        Route::post('/users/{user}/reset-password', [AdminUserController::class, 'resetPassword']);

        // Master Produk
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::get('/products/{product}', [AdminProductController::class, 'show']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

        // Master Kategori
        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Master Modifier & Varian
        Route::get('/modifier-groups', [AdminModifierController::class, 'indexGroup']);
        Route::post('/modifier-groups', [AdminModifierController::class, 'storeGroup']);
        Route::put('/modifier-groups/{modifierGroup}', [AdminModifierController::class, 'updateGroup']);
        Route::delete('/modifier-groups/{modifierGroup}', [AdminModifierController::class, 'destroyGroup']);
        Route::post('/modifier-items', [AdminModifierController::class, 'storeItem']);
        Route::put('/modifier-items/{modifierItem}', [AdminModifierController::class, 'updateItem']);
        Route::delete('/modifier-items/{modifierItem}', [AdminModifierController::class, 'destroyItem']);

        // Manajemen Meja Restoran
        Route::get('/tables', [AdminTableController::class, 'index']);
        Route::post('/tables', [AdminTableController::class, 'store']);
        Route::put('/tables/{table}', [AdminTableController::class, 'update']);
        Route::delete('/tables/{table}', [AdminTableController::class, 'destroy']);

        // Manajemen Inventaris & Mutasi Stok
        Route::get('/inventory/logs', [InventoryController::class, 'logs']);
        Route::get('/inventory/low-stock', [InventoryController::class, 'lowStockAlert']);
        Route::post('/inventory/adjust', [InventoryController::class, 'adjustStock']);

        // Bahan Baku (Ingredients)
        Route::get('/ingredients', [IngredientController::class, 'index']);
        Route::post('/ingredients', [IngredientController::class, 'store']);
        Route::get('/ingredients/low-stock', [IngredientController::class, 'lowStock']);
        Route::get('/ingredients/{ingredient}', [IngredientController::class, 'show']);
        Route::put('/ingredients/{ingredient}', [IngredientController::class, 'update']);
        Route::get('/ingredients/{ingredient}/mutations', [IngredientController::class, 'mutations']);

        // Resep Produk (Recipe/BOM)
        Route::get('/products/{product}/recipe', [RecipeController::class, 'index']);
        Route::post('/products/{product}/recipe', [RecipeController::class, 'store']);
        Route::delete('/products/{product}/recipe/{ingredient}', [RecipeController::class, 'destroy']);

        // Waste/Spoilage Tracking (admin bisa catat waste)
        Route::get('/waste', [WasteController::class, 'index']);
        Route::post('/waste', [WasteController::class, 'store']);
        Route::get('/waste/summary', [WasteController::class, 'summary']);

        // Prediksi Stok & Kebutuhan Bahan (Forecasting Staf)
        Route::get('/inventory/forecasting', [\App\Http\Controllers\Api\Admin\ForecastingController::class, 'index']);

        // Pengaturan Toko & Struk
        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);
    });

    // ==========================================
    // KHUSUS SUPERADMIN (OWNER) SAJA
    // ==========================================
    Route::middleware([EnsureAdmin::class, EnsureSuperAdmin::class])->prefix('superadmin')->group(function () {
        // Executive Forecasting & AI Financial Intelligence
        Route::get('/inventory/forecasting', [\App\Http\Controllers\Api\Admin\ForecastingController::class, 'executive']);
        Route::post('/inventory/test-morning-digest', [\App\Http\Controllers\Api\Admin\DigestController::class, 'sendTestDigest']);

        // Rekonsiliasi Stok (Stock Opname) - hanya owner
        Route::get('/reconciliation/expected-stock', [ReconciliationController::class, 'expectedStock']);
        Route::post('/reconciliation', [ReconciliationController::class, 'reconcile']);
        Route::get('/reconciliation/report', [ReconciliationController::class, 'report']);

        // Monitoring Owner - semua aktivitas stok
        Route::get('/monitoring/all-mutations', [InventoryController::class, 'logs']);
        Route::get('/monitoring/anomalies', [ReconciliationController::class, 'report']);
    });
});