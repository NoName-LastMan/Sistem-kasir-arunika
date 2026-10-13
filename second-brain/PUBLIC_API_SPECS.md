# Spesifikasi Endpoint Publik & Backend Handover
**Arunika Cafe Frontend (Customer App) ↔ pos-backend (Laravel 13)**

Dokumen ini mendokumentasikan rute publik baru yang perlu ditambahkan pada `pos-backend` agar website pelanggan (`cafe-frontend`, port 5174) dapat beralih dari mode mock ke API nyata.

---

## 1. Konfigurasi CORS (`config/cors.php`)
Pastikan origin `http://localhost:5174` (serta domain produksi frontend pelanggan) diizinkan:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => [
    'http://localhost:5173', // POS Frontend Kasir (Vue 3)
    'http://localhost:5174', // Cafe Frontend Pelanggan (React)
],
'allowed_headers' => ['*'],
```

---

## 2. Rute Publik Baru (`routes/api.php`)

Grup rute publik diletakkan di luar middleware `auth:sanctum`:

```php
use App\Http\Controllers\Api\Public\PublicSettingController;
use App\Http\Controllers\Api\Public\PublicMenuController;
use App\Http\Controllers\Api\Public\PublicTableController;
use App\Http\Controllers\Api\Public\PublicOrderController;

Route::prefix('public')->group(function () {
    // 1. Pengaturan Toko Publik (Nama, Alamat, Jam Buka, Pajak)
    Route::get('/settings', [PublicSettingController::class, 'show']);

    // 2. Katalog Menu & Ketersediaan Stok
    Route::get('/menu', [PublicMenuController::class, 'index']);

    // 3. Validasi Kode Meja QR
    Route::get('/tables/{code}', [PublicTableController::class, 'show']);

    // 4. Status Pesanan untuk Pelacakan Pelanggan
    Route::get('/orders/{id}/status', [PublicOrderController::class, 'status']);

    // 5. Kirim Pesanan Tamu (Dilindungi Rate Limiter)
    Route::middleware('throttle:guest-orders')->post('/orders', [PublicOrderController::class, 'store']);
});
```

---

## 3. Rekomendasi Rate Limiter & Keamanan (`app/Providers/AppServiceProvider.php`)

Untuk mencegah spamming order palsu atau *denial-of-service* dari tamu publik:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

RateLimiter::for('guest-orders', function (Request $request) {
    // Batasi maksimal 5 pesanan per menit per IP address
    return Limit::perMinute(5)->by($request->ip())->response(function () {
        return response()->json([
            'message' => 'Terlalu banyak permintaan pesanan. Mohon tunggu sejenak sebelum mencoba kembali.'
        ], 429);
    });
});
```

---

## 4. Validasi Request Pesanan Tamu (`POST /api/public/orders`)

```php
$request->validate([
    'table_code'     => 'nullable|string|max:20',
    'customer_name'  => 'required|string|min:2|max:60',
    'notes'          => 'nullable|string|max:255',
    'items'          => 'required|array|min:1',
    'items.*.product_id'   => 'required|integer|exists:products,id',
    'items.*.quantity'     => 'required|integer|min:1|max:50',
    'items.*.notes'        => 'nullable|string|max:150',
    'items.*.modifier_ids' => 'nullable|array',
    'items.*.modifier_ids.*' => 'integer|exists:modifier_items,id',
]);
```

### Aturan Bisnis Server-Side:
1. **Harga Mutlak Dihitung Server**: Frontend hanya mengirim `product_id`, `quantity`, dan `modifier_ids`. Subtotal, diskon, pajak, dan grand total dihitung murni melalui `OrderPricingService`.
2. **Ketersediaan Mengikuti Bahan Baku**: Sebelum order di-insert, periksa ketersediaan via `hasEnoughStock()` dan resep bahan baku `deductIngredientsForOrder()`. Jika ada bahan yang kurang, throw pesan ramah ("Maaf, [Nama Menu] baru saja habis.").
3. **Status Awal**: Diberi `status = 'pending'`, `payment_status = 'unpaid'`, `payment_method = 'pay_at_cashier'`. Pesanan ini akan langsung muncul di kasir POS untuk pembayaran dan di layar Kitchen Display (KDS).
