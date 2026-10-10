<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\StockMutation;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    public function index(Request $request)
    {
        $query = Ingredient::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock_quantity', '<=', 'min_stock_alert')
                ->where('track_stock', true);
        }

        return response()->json([
            'message' => 'Daftar bahan baku',
            'data'    => $query->orderBy('name')->paginate($request->input('per_page', 20)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'base_unit'       => 'required|string|max:50',
            'stock_quantity'  => 'nullable|numeric|min:0',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'cost_per_unit'   => 'nullable|numeric|min:0',
            'supplier_info'   => 'nullable|string',
            'track_stock'     => 'nullable|boolean',
        ]);

        $ingredient = Ingredient::create($validated);

        return response()->json([
            'message' => 'Bahan baku berhasil ditambahkan',
            'data'    => $ingredient,
        ], 201);
    }

    public function show(Ingredient $ingredient)
    {
        return response()->json([
            'data' => $ingredient->load('products'),
        ]);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'base_unit'       => 'sometimes|string|max:50',
            'min_stock_alert' => 'nullable|numeric|min:0',
            'cost_per_unit'   => 'nullable|numeric|min:0',
            'supplier_info'   => 'nullable|string',
            'track_stock'     => 'nullable|boolean',
        ]);

        $ingredient->update($validated);

        return response()->json([
            'message' => 'Bahan baku berhasil diperbarui',
            'data'    => $ingredient,
        ]);
    }

    public function mutations(Request $request, Ingredient $ingredient)
    {
        $query = StockMutation::where('ingredient_id', $ingredient->id)
            ->with('user:id,name')
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'message' => "Riwayat mutasi bahan: {$ingredient->name}",
            'data'    => $query->paginate($request->input('per_page', 20)),
        ]);
    }

    public function lowStock()
    {
        $ingredients = Ingredient::where('track_stock', true)
            ->whereColumn('stock_quantity', '<=', 'min_stock_alert')
            ->orderBy('stock_quantity', 'asc')
            ->get();

        return response()->json([
            'message' => 'Bahan baku stok menipis',
            'data'    => $ingredients,
        ]);
    }
}
