<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMutation;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Menampilkan log riwayat mutasi stok.
     */
    public function logs(Request $request)
    {
        $query = StockMutation::with(['product:id,name,sku', 'user:id,name'])
            ->latest();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'message' => 'Riwayat mutasi stok inventaris',
            'data'    => $query->paginate($request->input('per_page', 20))
        ]);
    }

    /**
     * Menampilkan daftar produk dengan alert stok menipis (< 10).
     */
    public function lowStockAlert()
    {
        $lowStockProducts = Product::with('category:id,name')
            ->where('track_stock', true)
            ->where('stock', '<=', 10)
            ->orderBy('stock', 'asc')
            ->get();

        return response()->json([
            'message' => 'Produk stok menipis (Low Stock Warning)',
            'data'    => $lowStockProducts
        ]);
    }

    /**
     * Melakukan penyesuaian stok manual (Stock In, Stock Out, Stock Opname).
     */
    public function adjustStock(Request $request)
    {
        $validated = $request->validate([
            'product_id'     => 'required|exists:products,id',
            'type'           => 'required|in:in,out,opname',
            'quantity'       => 'required|integer',
            'reference_note' => 'nullable|string|max:255',
        ]);

        $mutation = app(InventoryService::class)->adjustStock(
            productId:     $validated['product_id'],
            type:          $validated['type'],
            quantity:      $validated['quantity'],
            userId:        $request->user()->id,
            referenceNote: $validated['reference_note'] ?? null,
        );

        return response()->json([
            'message' => 'Penyesuaian stok berhasil disimpan',
            'data'    => $mutation->load(['product:id,name,sku', 'user:id,name'])
        ], 201);
    }
}
