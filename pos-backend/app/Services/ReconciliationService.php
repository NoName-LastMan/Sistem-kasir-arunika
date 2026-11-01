<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\StockMutation;
use Illuminate\Support\Facades\DB;

class ReconciliationService
{
    /**
     * Hitung stok seharusnya berdasarkan mutasi stok.
     * Menggunakan query agregasi SQL langsung untuk efisiensi CPU & memori.
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

        $totals = (clone $query)->selectRaw("
            COALESCE(SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END), 0) as total_in,
            COALESCE(SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END), 0) as total_out
        ")->first();

        $totalIn = (float) ($totals->total_in ?? 0);
        $totalOut = (float) ($totals->total_out ?? 0);

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
     * Menggunakan batch query agregasi untuk memangkas ratusan query N+1 menjadi hanya 2 query.
     */
    public function getReconciliationReport(?string $startDate = null, ?string $endDate = null): array
    {
        $ingredients = Ingredient::where('track_stock', true)->orderBy('name')->get();
        if ($ingredients->isEmpty()) {
            return [];
        }

        $ingredientIds = $ingredients->pluck('id')->all();

        // 1. Agregasi mutasi (in & out) untuk seluruh bahan sekaligus dalam 1 query SQL
        $mutationQuery = StockMutation::whereIn('ingredient_id', $ingredientIds);
        if ($startDate) {
            $mutationQuery->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $mutationQuery->whereDate('created_at', '<=', $endDate);
        }

        $totalsMap = $mutationQuery->selectRaw("
            ingredient_id,
            COALESCE(SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END), 0) as total_in,
            COALESCE(SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END), 0) as total_out
        ")->groupBy('ingredient_id')->get()->keyBy('ingredient_id');

        // 2. Ambil stok awal periode jika startDate dispesifikasikan (hanya 1 query batch)
        $firstMutationMap = [];
        if ($startDate) {
            $firstMuts = StockMutation::whereIn('ingredient_id', $ingredientIds)
                ->whereDate('created_at', '>=', $startDate)
                ->orderBy('created_at', 'asc')
                ->get()
                ->groupBy('ingredient_id');

            foreach ($firstMuts as $ingId => $muts) {
                $firstMutationMap[$ingId] = (float) $muts->first()->stock_before;
            }
        }

        $report = [];
        foreach ($ingredients as $ingredient) {
            $tot = $totalsMap->get($ingredient->id);
            $totalIn = (float) ($tot?->total_in ?? 0);
            $totalOut = (float) ($tot?->total_out ?? 0);

            $initialStock = isset($firstMutationMap[$ingredient->id])
                ? $firstMutationMap[$ingredient->id]
                : (float) $ingredient->stock_quantity;

            $expectedStock = round($initialStock + $totalIn - $totalOut, 3);
            $currentStock  = (float) $ingredient->stock_quantity;
            $discrepancy   = round($currentStock - $expectedStock, 3);
            $discrepancyPercent = $expectedStock > 0
                ? round(abs($discrepancy) / $expectedStock * 100, 2)
                : 0;

            $report[] = [
                'ingredient_id'       => $ingredient->id,
                'ingredient_name'     => $ingredient->name,
                'base_unit'           => $ingredient->base_unit,
                'system_stock'        => $currentStock,
                'expected_stock'      => $expectedStock,
                'discrepancy'         => $discrepancy,
                'discrepancy_percent' => $discrepancyPercent,
                'is_anomaly'          => $discrepancyPercent > 5,
            ];
        }

        return $report;
    }
}
