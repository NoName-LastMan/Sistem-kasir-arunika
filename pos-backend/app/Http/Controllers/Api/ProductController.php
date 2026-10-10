<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // List produk untuk grid kasir (mendukung filter kategori & pencarian nama)
    public function index(Request $request)
    {
        $query = Product::with(['category', 'modifierGroups.items'])
            ->where('is_active', true);

        // Filter per kategori jika kasir klik tab kategori
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Pencarian realtime nama produk atau SKU
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->get();

        return response()->json([
            'data' => $products
        ]);
    }

    // Tambah produk baru beserta penentuan modifier yang aktif
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'      => 'required|exists:categories,id',
            'name'             => 'required|string|max:150',
            'sku'              => 'nullable|string|unique:products,sku',
            'description'      => 'nullable|string',
            'price'            => 'required|numeric|min:0',
            'cost_price'       => 'nullable|numeric|min:0',
            'stock'            => 'nullable|integer|min:0',
            'track_stock'      => 'boolean',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id'
        ]);

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name'        => $validated['name'],
            'sku'         => $validated['sku'] ?? null,
            'description' => $validated['description'] ?? null,
            'price'       => $validated['price'],
            'cost_price'  => $validated['cost_price'] ?? 0,
            'stock'       => $validated['stock'] ?? 0,
            'track_stock' => $validated['track_stock'] ?? false,
            'is_active'   => true,
        ]);

        // Hubungkan varian/topping jika dipilih
        if (!empty($validated['modifier_group_ids'])) {
            $product->modifierGroups()->sync($validated['modifier_group_ids']);
        }

        return response()->json([
            'message' => 'Produk berhasil dibuat',
            'data'    => $product->load(['category', 'modifierGroups.items'])
        ], 201);
    }

    // Detail single product
    public function show(Product $product)
    {
        return response()->json([
            'data' => $product->load(['category', 'modifierGroups.items'])
        ]);
    }

    // Cari produk langsung via Barcode / SKU untuk scanner
    public function byBarcode(string $barcode)
    {
        $product = Product::with(['category', 'modifierGroups.items'])
            ->where('is_active', true)
            ->where('sku', $barcode)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => "Produk dengan barcode/SKU '{$barcode}' tidak ditemukan"
            ], 404);
        }

        return response()->json([
            'message' => 'Produk ditemukan',
            'data'    => $product
        ]);
    }
}