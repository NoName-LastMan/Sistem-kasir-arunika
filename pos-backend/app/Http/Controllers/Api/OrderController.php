<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shift;
use App\Services\InventoryService;
use App\Services\OrderPricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Menampilkan daftar transaksi/order terakhir.
     */
    public function index(Request $request)
    {
        $query = Order::with(['user:id,name', 'table:id,table_number', 'items.product:id,name', 'items.modifiers.modifierItem:id,name,price'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->shift_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->boolean('today_only')) {
            $query->whereDate('created_at', now()->toDateString());
        }

        $orders = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'message' => 'Daftar riwayat transaksi',
            'data'    => $orders
        ]);
    }

    /**
     * Detail satu order.
     */
    public function show(Order $order)
    {
        return response()->json([
            'data' => $order->load([
                'user:id,name',
                'table:id,table_number',
                'items.product:id,name,sku',
                'items.modifiers.modifierItem:id,name,price',
                'voidedBy:id,name',
            ])
        ]);
    }

    /**
     * Membuat order baru (POS Checkout).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_type'             => 'required|in:dine_in,takeaway,delivery',
            'table_id'               => 'nullable|exists:tables,id',
            'payment_method'         => 'required|in:cash,qris,transfer,card',
            'cash_tendered'          => 'nullable|numeric|min:0',
            'discount_type'          => 'nullable|in:fixed,percentage,none',
            'discount_value'         => 'nullable|numeric|min:0',
            'tax_rate'               => 'nullable|numeric|min:0',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.notes'          => 'nullable|string',
            'items.*.modifiers'      => 'nullable|array',
            'items.*.modifiers.*.id' => 'exists:modifier_items,id'
        ]);

        return DB::transaction(function () use ($validated, $request) {

            $pricingService = app(OrderPricingService::class);

            $pricing = $pricingService->calculateOrderPricing(
                items:         $validated['items'],
                discountType:  $validated['discount_type'] ?? null,
                discountValue: isset($validated['discount_value']) ? (float) $validated['discount_value'] : null,
                taxRate:       isset($validated['tax_rate']) ? (float) $validated['tax_rate'] : 10.0,
                cashTendered:  isset($validated['cash_tendered']) ? (float) $validated['cash_tendered'] : null,
                paymentMethod: $validated['payment_method'],
            );

            $activeShift = Shift::where('user_id', $request->user()->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $order = Order::create([
                'invoice_number'  => 'INV-' . strtoupper(Str::random(8)),
                'user_id'         => $request->user()->id,
                'shift_id'        => $activeShift?->id,
                'table_id'        => $validated['table_id'] ?? null,
                'order_type'      => $validated['order_type'],
                'subtotal'        => $pricing['subtotal'],
                'discount_amount' => $pricing['discount_amount'],
                'tax_amount'      => $pricing['tax_amount'],
                'service_charge'  => 0,
                'total_amount'    => $pricing['total_amount'],
                'payment_method'  => $validated['payment_method'],
                'cash_tendered'   => $validated['payment_method'] === 'cash'
                                    ? ($validated['cash_tendered'] ?? null) : null,
                'change_due'      => $pricing['change_due'],
                'payment_status'  => 'paid',
                'status'          => 'completed',
            ]);

            $inventoryService = app(InventoryService::class);

            foreach ($pricing['line_items'] as $line) {
                $orderItem = $order->items()->create([
                    'product_id' => $line['product_id'],
                    'quantity'   => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal'   => $line['subtotal'],
                    'notes'      => $line['notes'],
                ]);

                if (! empty($line['modifiers'])) {
                    $orderItem->modifiers()->createMany($line['modifiers']);
                }

                $inventoryService->deductForOrder(
                    product:  $line['product_model'],
                    quantity: $line['quantity'],
                    orderId:  $order->id,
                    userId:   $request->user()->id,
                );
            }

            $inventoryService->deductIngredientsForOrder(
                order:  $order,
                userId: $request->user()->id,
            );

            return response()->json([
                'message' => 'Transaksi berhasil diproses',
                'data'    => $order->load(['user:id,name', 'table:id,number', 'items.product', 'items.modifiers.modifierItem'])
            ], 201);
        });
    }

    /**
     * Void/Cancel order yang sudah selesai.
     */
    public function void(Request $request, Order $order)
    {
        $validated = $request->validate([
            'void_reason' => 'required|string|min:3|max:500',
        ]);

        if ($order->status !== 'completed') {
            return response()->json([
                'message' => 'Hanya order dengan status completed yang dapat di-void.'
            ], 422);
        }

        if ($order->created_at->toDateString() !== now()->toDateString()) {
            return response()->json([
                'message' => 'Order sudah melewati batas waktu void (hanya hari ini).'
            ], 422);
        }

        $user = $request->user();

        if ($order->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk void order ini.'
            ], 403);
        }

        return DB::transaction(function () use ($order, $validated, $user) {
            $order->update([
                'status'         => 'cancelled',
                'payment_status' => 'refunded',
                'void_reason'    => $validated['void_reason'],
                'voided_at'      => now(),
                'voided_by'      => $user->id,
            ]);

            app(InventoryService::class)->restoreForVoid($order, $user->id);

            return response()->json([
                'message' => 'Order berhasil di-void dan stok dikembalikan.',
                'data'    => $order->load([
                    'user:id,name',
                    'items.product:id,name,stock,track_stock',
                    'voidedBy:id,name',
                ])
            ]);
        });
    }

    /**
     * Kasir mengonfirmasi pesanan tamu pending, terima pembayaran, & teruskan ke dapur.
     */
    public function confirm(Request $request, Order $order)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer,card',
            'cash_tendered'  => 'nullable|numeric|min:0',
        ]);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Pesanan ini sudah dikonfirmasi atau dibatalkan sebelumnya.'
            ], 422);
        }

        return DB::transaction(function () use ($order, $validated, $request) {
            $activeShift = Shift::where('user_id', $request->user()->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $cashTendered = $validated['payment_method'] === 'cash' 
                ? (float) ($validated['cash_tendered'] ?? $order->total_amount) 
                : null;
            $changeDue = $cashTendered ? max(0, $cashTendered - (float) $order->total_amount) : 0;

            $order->update([
                'user_id'        => $request->user()->id,
                'shift_id'       => $activeShift?->id,
                'payment_method' => $validated['payment_method'],
                'cash_tendered'  => $cashTendered,
                'change_due'     => $changeDue,
                'payment_status' => 'paid',
                'status'         => 'processing', // Resmi masuk ke antrean KDS Dapur!
            ]);

            // Potong stok produk jadi & bahan baku mentah (BOM)
            $inventoryService = app(InventoryService::class);
            foreach ($order->items()->with('product')->get() as $item) {
                if ($item->product) {
                    $inventoryService->deductForOrder(
                        product:  $item->product,
                        quantity: $item->quantity,
                        orderId:  $order->id,
                        userId:   $request->user()->id,
                    );
                }
            }

            $inventoryService->deductIngredientsForOrder(
                order:  $order,
                userId: $request->user()->id,
            );

            return response()->json([
                'message' => 'Pesanan berhasil dikonfirmasi dan diteruskan ke dapur',
                'data'    => $order->load(['user:id,name', 'table:id,table_number', 'items.product', 'items.modifiers.modifierItem'])
            ]);
        });
    }

    /**
     * Dapur menandai pesanan selesai dimasak (siap saji).
     */
    public function serve(Order $order)
    {
        $order->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Pesanan selesai dimasak dan siap disajikan',
            'data'    => $order->load(['table', 'items.product'])
        ]);
    }

    /**
     * Guest/Pelanggan membuat pesanan mandiri (tanpa login via cafe-frontend).
     */
    public function publicCreateOrder(Request $request)
    {
        $validated = $request->validate([
            'table_code'             => 'nullable|string',
            'table_id'               => 'nullable|exists:tables,id',
            'customer_name'          => 'nullable|string|max:100',
            'notes'                  => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.notes'          => 'nullable|string',
            'items.*.modifier_ids'   => 'nullable|array',
            'items.*.modifiers'      => 'nullable|array',
        ]);

        $tableId = $validated['table_id'] ?? null;
        if (! $tableId && ! empty($validated['table_code'])) {
            $table = \App\Models\Table::where('table_number', $validated['table_code'])->first();
            $tableId = $table?->id;
        }

        $formattedItems = [];
        foreach ($validated['items'] as $item) {
            $modifiers = [];
            if (! empty($item['modifiers'])) {
                $modifiers = $item['modifiers'];
            } elseif (! empty($item['modifier_ids'])) {
                foreach ($item['modifier_ids'] as $mId) {
                    $modifiers[] = ['id' => $mId];
                }
            }
            $formattedItems[] = [
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'notes'      => $item['notes'] ?? null,
                'modifiers'  => $modifiers,
            ];
        }

        $pricingService = app(OrderPricingService::class);
        $pricing = $pricingService->calculateOrderPricing(
            items:         $formattedItems,
            paymentMethod: 'cash'
        );

        $defaultUser = \App\Models\User::where('role', 'cashier')->first() ?? \App\Models\User::first();

        return DB::transaction(function () use ($validated, $tableId, $pricing, $defaultUser) {
            $order = Order::create([
                'invoice_number'  => 'INV-' . strtoupper(Str::random(8)),
                'user_id'         => $defaultUser->id,
                'shift_id'        => null,
                'table_id'        => $tableId,
                'order_type'      => $tableId ? 'dine_in' : 'takeaway',
                'subtotal'        => $pricing['subtotal'],
                'discount_amount' => 0,
                'tax_amount'      => $pricing['tax_amount'],
                'service_charge'  => 0,
                'total_amount'    => $pricing['total_amount'],
                'payment_method'  => null,
                'cash_tendered'   => null,
                'change_due'      => null,
                'payment_status'  => 'unpaid',
                'status'          => 'pending', // Menunggu konfirmasi kasir
            ]);

            foreach ($pricing['line_items'] as $line) {
                $orderItem = $order->items()->create([
                    'product_id' => $line['product_id'],
                    'quantity'   => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal'   => $line['subtotal'],
                    'notes'      => $line['notes'] ?? null,
                ]);

                if (! empty($line['modifiers'])) {
                    $orderItem->modifiers()->createMany($line['modifiers']);
                }
            }

            return response()->json([
                'message' => 'Pesanan berhasil dibuat, silakan konfirmasi pembayaran ke kasir.',
                'data'    => $order->load(['table', 'items.product', 'items.modifiers.modifierItem'])
            ], 201);
        });
    }

    /**
     * Pelacakan status pesanan publik untuk tamu.
     */
    public function publicOrderStatus($id)
    {
        $order = Order::with(['table', 'items.product', 'items.modifiers.modifierItem'])
            ->where('id', $id)
            ->orWhere('invoice_number', $id)
            ->firstOrFail();

        return response()->json([
            'data' => $order
        ]);
    }
}
