<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    /**
     * Menampilkan daftar semua produk untuk Admin (termasuk yang nonaktif).
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'modifierGroups.items'])->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'message' => 'Daftar produk master',
            'data'    => $query->get()
        ]);
    }

    /**
     * Membuat produk baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'        => 'required|exists:categories,id',
            'name'               => 'required|string|max:150',
            'sku'                => 'nullable|string|unique:products,sku',
            'description'        => 'nullable|string',
            'price'              => 'required|numeric|min:0',
            'cost_price'         => 'nullable|numeric|min:0',
            'stock'              => 'nullable|integer|min:0',
            'track_stock'        => 'boolean',
            'is_active'          => 'boolean',
            'image'              => 'nullable|string',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id'
        ]);

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name'        => $validated['name'],
            'sku'         => $validated['sku'] ?? 'SKU-' . rand(1000, 9999),
            'description' => $validated['description'] ?? null,
            'price'       => $validated['price'],
            'cost_price'  => $validated['cost_price'] ?? 0,
            'stock'       => 0,
            'track_stock' => $validated['track_stock'] ?? false,
            'image'       => $validated['image'] ?? null,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        if (($validated['stock'] ?? 0) > 0) {
            app(InventoryService::class)->setInitialStock(
                product:         $product,
                initialQuantity: (int) $validated['stock'],
                userId:          $request->user()->id,
            );
        }

        if (! empty($validated['modifier_group_ids'])) {
            $product->modifierGroups()->sync($validated['modifier_group_ids']);
        }

        return response()->json([
            'message' => 'Produk master berhasil dibuat',
            'data'    => $product->load(['category', 'modifierGroups.items'])
        ], 201);
    }

    /**
     * Detail satu produk.
     */
    public function show(Product $product)
    {
        return response()->json([
            'data' => $product->load(['category', 'modifierGroups.items'])
        ]);
    }

    /**
     * Memperbarui produk master.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id'        => 'required|exists:categories,id',
            'name'               => 'required|string|max:150',
            'sku'                => ['nullable', 'string', Rule::unique('products')->ignore($product->id)],
            'description'        => 'nullable|string',
            'price'              => 'required|numeric|min:0',
            'cost_price'         => 'nullable|numeric|min:0',
            'stock'              => 'nullable|integer|min:0',
            'track_stock'        => 'boolean',
            'is_active'          => 'boolean',
            'image'              => 'nullable|string',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id'
        ]);

        $product->update([
            'category_id' => $validated['category_id'],
            'name'        => $validated['name'],
            'sku'         => $validated['sku'] ?? $product->sku,
            'description' => $validated['description'] ?? null,
            'price'       => $validated['price'],
            'cost_price'  => $validated['cost_price'] ?? 0,
            'track_stock' => $validated['track_stock'] ?? false,
            'image'       => array_key_exists('image', $validated) ? $validated['image'] : $product->image,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['stock'])) {
            app(InventoryService::class)->updateStock(
                product:     $product,
                newQuantity: (int) $validated['stock'],
                userId:      $request->user()->id,
            );
        }

        if (isset($validated['modifier_group_ids'])) {
            $product->modifierGroups()->sync($validated['modifier_group_ids']);
        }

        return response()->json([
            'message' => 'Produk berhasil diperbarui',
            'data'    => $product->load(['category', 'modifierGroups.items'])
        ]);
    }

    /**
     * Menghapus produk.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus'
        ]);
    }
}
