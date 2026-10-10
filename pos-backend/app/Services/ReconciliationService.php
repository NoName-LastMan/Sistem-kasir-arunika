<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\StockMutation;
use Illuminate\Support\Facades\DB;

class ReconciliationService
{
    /**
     * Hitung stok seharusnya berdasarkan mutasi stok.
     */
    public function calculateExpectedStock(int $ingredientId, ?string $startDate = null, ?string $endDate = null): array
    {
        $ingredient = Ingredient::findOrFail($ingredientId);

        $query = StockMutation::where('ingredient_id', $ingredientId);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $mutations = $query->get();

        $totalIn = (float) $mutations->where('quantity', '>', 0)->sum('quantity');
        $totalOut = abs((float) $mutations->where('quantity', '<', 0)->sum('quantity'));

        // Get initial stock (stock at startDate)
        $initialStock = (float) $ingredient->stock_quantity;
        if ($startDate) {
            $firstMutation = StockMutation::where('ingredient_id', $ingredientId)
                ->whereDate('created_at', '>=', $startDate)
                ->orderBy('created_at', 'asc')
                ->first();

            if ($firstMutation) {
                $initialStock = (float) $firstMutation->stock_before;
            }
        }

        $expectedStock = round($initialStock + $totalIn - $totalOut, 3);

        return [
            'ingredient_id' => $ingredientId,
            'ingredient_name' => $ingredient->name,
            'base_unit' => $ingredient->base_unit,
            'initial_stock' => $initialStock,
            'total_in' => $totalIn,
            'total_out' => $totalOut,
            'expected_stock' => $expectedStock,
            'current_system_stock' => (float) $ingredient->stock_quantity,
        ];
    }

    /**
     * Lakukan rekonsiliasi stok (stock opname).
     */
    public function reconcile(
        int    $ingredientId,
        float  $actualStock,
        ?int   $userId,
        ?string $notes = null,
    ): array {
        return DB::transaction(function () use ($ingredientId, $actualStock, $userId, $notes) {
            $ingredient = Ingredient::findOrFail($ingredientId);
            $expectedStock = (float) $ingredient->stock_quantity;
            $discrepancy = round($actualStock - $expectedStock, 3);
            $discrepancyPercent = $expectedStock > 0
                ? round(abs($discrepancy) / $expectedStock * 100, 2)
                : 0;

            $stockBefore = (float) $ingredient->stock_quantity;
            $ingredient->update(['stock_quantity' => $actualStock]);

            $mutation = StockMutation::create([
                'ingredient_id'  => $ingredientId,
                'user_id'        => $userId,
                'type'           => 'opname',
                'quantity'       => $discrepancy,
                'stock_before'   => $stockBefore,
                'stock_after'    => $actualStock,
                'reference_type' => 'opname',
                'reference_note' => $notes ?? 'Stock opname',
            ]);

            $isAnomaly = $discrepancyPercent > 5;

            return [
                'ingredient_id' => $ingredientId,
                'ingredient_name' => $ingredient->name,
                'base_unit' => $ingredient->base_unit,
                'expected_stock' => $expectedStock,
                'actual_stock' => $actualStock,
                'discrepancy' => $discrepancy,
                'discrepancy_percent' => $discrepancyPercent,
                'is_anomaly' => $isAnomaly,
                'mutation' => $mutation,
                'user_id' => $userId,
                'timestamp' => now()->toISOString(),
            ];
        });
    }

    /**
     * Ambil laporan rekonsiliasi untuk semua bahan baku.
     */
    public function getReconciliationReport(?string $startDate = null, ?string $endDate = null): array
    {
        $ingredients = Ingredient::where('track_stock', true)->get();
        $report = [];

        foreach ($ingredients as $ingredient) {
            $expected = $this->calculateExpectedStock($ingredient->id, $startDate, $endDate);
            $discrepancy = round((float) $ingredient->stock_quantity - $expected['expected_stock'], 3);
            $discrepancyPercent = $expected['expected_stock'] > 0
                ? round(abs($discrepancy) / $expected['expected_stock'] * 100, 2)
                : 0;

            $report[] = [
                'ingredient_id' => $ingredient->id,
                'ingredient_name' => $ingredient->name,
                'base_unit' => $ingredient->base_unit,
                'system_stock' => (float) $ingredient->stock_quantity,
                'expected_stock' => $expected['expected_stock'],
                'discrepancy' => $discrepancy,
                'discrepancy_percent' => $discrepancyPercent,
                'is_anomaly' => $discrepancyPercent > 5,
            ];
        }

        return $report;
    }
}
