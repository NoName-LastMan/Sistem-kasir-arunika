<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeldOrder;
use Illuminate\Http\Request;

class HeldOrderController extends Controller
{
    /**
     * Menampilkan daftar order tertahan milik user atau toko.
     */
    public function index(Request $request)
    {
        $heldOrders = HeldOrder::with(['user:id,name', 'table:id,number'])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Daftar transaksi tertahan (held orders)',
            'data'    => $heldOrders
        ]);
    }

    /**
     * Menyimpan transaksi aktif ke antrean tertahan.
     */
    public function store(Request $request)
    {
        $cartData = $request->input('cart_data') ?? $request->input('items', []);

        $subtotal = $request->input('subtotal');
        if ($subtotal === null) {
            $subtotal = 0;
            foreach ($cartData as $item) {
                $qty = (int) ($item['quantity'] ?? 1);
                $price = (float) ($item['price'] ?? $item['product']['price'] ?? 0);
                $subtotal += $qty * $price;
            }
        }

        $request->merge([
            'order_type' => $request->input('order_type') ?: 'dine_in',
            'cart_data'  => $cartData,
            'subtotal'   => $subtotal,
        ]);

        $validated = $request->validate([
            'customer_name'  => 'nullable|string|max:100',
            'reference_note' => 'nullable|string|max:255',
            'table_id'       => 'nullable|exists:tables,id',
            'order_type'     => 'required|in:dine_in,takeaway,delivery',
            'subtotal'       => 'required|numeric|min:0',
            'cart_data'      => 'required|array|min:1',
        ]);

        $heldOrder = HeldOrder::create([
            'user_id'        => $request->user()->id,
            'customer_name'  => $validated['customer_name'] ?? null,
            'reference_note' => $validated['reference_note'] ?? null,
            'table_id'       => $validated['table_id'] ?? null,
            'order_type'     => $validated['order_type'],
            'subtotal'       => $validated['subtotal'],
            'cart_data'      => $validated['cart_data'],
        ]);

        return response()->json([
            'message' => 'Transaksi berhasil disimpan sementara.',
            'data'    => $heldOrder->load(['user:id,name', 'table:id,number'])
        ], 201);
    }

    /**
     * Menghapus transaksi tertahan (setelah di-resume ke keranjang atau dibatalkan).
     */
    public function destroy(HeldOrder $heldOrder)
    {
        $heldOrder->delete();

        return response()->json([
            'message' => 'Transaksi tertahan berhasil dihapus.'
        ]);
    }
}
