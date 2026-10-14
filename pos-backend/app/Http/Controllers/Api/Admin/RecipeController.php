<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Product $product)
    {
        $recipe = $product->ingredients()
            ->select('ingredients.id', 'ingredients.name', 'ingredients.base_unit')
            ->withPivot(['quantity_needed', 'recipe_unit', 'conversion_factor'])
            ->get();

        $totalCost = 0;
        foreach ($recipe as $ingredient) {
            $qtyInBase = (float) $ingredient->pivot->quantity_needed * (float) $ingredient->pivot->conversion_factor;
            $totalCost += $qtyInBase * (float) $ingredient->cost_per_unit;
        }

        return response()->json([
            'message' => "Resep untuk produk: {$product->name}",
            'data'    => [
                'product_id'   => $product->id,
                'product_name' => $product->name,
                'ingredients'  => $recipe,
                'estimated_cost' => round($totalCost, 2),
            ],
        ]);
    }

    public function store(Request $request, Product $product)
    {
        // Support single ingredient addition
        if ($request->filled('ingredient_id')) {
            $ingredient = Ingredient::findOrFail($request->ingredient_id);
            $qty = $request->input('quantity_needed', $request->input('quantity', 1));
            $unit = $request->input('recipe_unit', $request->input('unit', $ingredient->base_unit));
            $factor = $request->input('conversion_factor', $request->input('unit_ratio', 1));

            $product->ingredients()->syncWithoutDetaching([
                $ingredient->id => [
                    'quantity_needed'   => $qty,
                    'recipe_unit'       => $unit,
                    'conversion_factor' => $factor,
                ]
            ]);
        } elseif ($request->has('ingredients')) {
            $validated = $request->validate([
                'ingredients'                      => 'required|array|min:1',
                'ingredients.*.ingredient_id'      => 'required|exists:ingredients,id',
                'ingredients.*.quantity_needed'    => 'required|numeric|min:0.001',
                'ingredients.*.recipe_unit'        => 'required|string|max:50',
                'ingredients.*.conversion_factor'  => 'required|numeric|min:0.000001',
            ]);

            $syncData = [];
            foreach ($validated['ingredients'] as $item) {
                $syncData[$item['ingredient_id']] = [
                    'quantity_needed'   => $item['quantity_needed'],
                    'recipe_unit'       => $item['recipe_unit'],
                    'conversion_factor' => $item['conversion_factor'],
                ];
            }

            $product->ingredients()->sync($syncData);
        }

        return response()->json([
            'message' => 'Resep berhasil diperbarui',
            'data'    => $product->ingredients()
                ->select('ingredients.id', 'ingredients.name', 'ingredients.base_unit')
                ->withPivot(['quantity_needed', 'recipe_unit', 'conversion_factor'])
                ->get(),
        ]);
    }

    public function destroy(Product $product, Ingredient $ingredient)
    {
        $product->ingredients()->detach($ingredient->id);

        return response()->json([
            'message' => "Bahan {$ingredient->name} dihapus dari resep {$product->name}",
        ]);
    }
}
