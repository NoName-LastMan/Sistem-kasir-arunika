<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\StockMutation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StockForecastingService
{
    const HISTORICAL_DAYS = 28;
    const SAFETY_BUFFER = 1.15; // 15% safety stock

    /**
     * Prediksi stok untuk satu atau seluruh bahan baku.
     *
     * @param int|null $ingredientId
     * @param bool $isExecutive True jika dipanggil oleh Superadmin/Owner (menyertakan nilai rupiah)
     * @return Collection
     */
    public function getForecast(?int $ingredientId = null, bool $isExecutive = false): Collection
    {
        $query = Ingredient::query();
        if ($ingredientId) {
            $query->where('id', $ingredientId);
        }

        $ingredients = $query->orderBy('name')->get();
        $startDate = Carbon::today()->subDays(self::HISTORICAL_DAYS)->startOfDay();

        // Agregasi konsumsi harian bahan baku dari mutasi bertipe 'sales' / 'out'
        $mutations = StockMutation::whereIn('type', [StockMutation::TYPE_SALES, 'out'])
            ->whereNotNull('ingredient_id')
            ->where('created_at', '>=', $startDate)
            ->when($ingredientId, fn($q) => $q->where('ingredient_id', $ingredientId))
            ->select([
                'ingredient_id',
                DB::raw('DATE(created_at) as mutation_date'),
                DB::raw('SUM(ABS(quantity)) as total_consumed'),
            ])
            ->groupBy('ingredient_id', DB::raw('DATE(created_at)'))
            ->get()
            ->groupBy('ingredient_id');

        return $ingredients->map(function ($ingredient) use ($mutations, $isExecutive) {
            $dailyLogs = $mutations->get($ingredient->id, collect());
            return $this->calculateMetrics($ingredient, $dailyLogs, $isExecutive);
        });
    }

    /**
     * Hitung metrik runtun waktu (WMA, Weekend Multiplier, Days Left, Reorder Qty).
     */
    private function calculateMetrics(Ingredient $ingredient, Collection $dailyLogs, bool $isExecutive): array
    {
        $currentStock = (float) ($ingredient->current_stock ?? $ingredient->stock_quantity ?? 0);
        $costPerUnit = (float) ($ingredient->cost_per_unit ?? 0);

        // Petakan konsumsi harian 28 hari terakhir
        $consumptionMap = [];
        for ($i = 0; $i < self::HISTORICAL_DAYS; $i++) {
            $date = Carbon::today()->subDays(self::HISTORICAL_DAYS - $i)->toDateString();
            $consumptionMap[$date] = 0.0;
        }

        foreach ($dailyLogs as $log) {
            if (isset($consumptionMap[$log->mutation_date])) {
                $consumptionMap[$log->mutation_date] = (float) $log->total_consumed;
            }
        }

        $values = array_values($consumptionMap);
        $totalDays = count($values);

        // 1. Weighted Moving Average (WMA)
        $weightedSum = 0;
        $weightSum = 0;
        for ($i = 0; $i < $totalDays; $i++) {
            $weight = $i + 1; // Hari lebih dekat mendapat bobot lebih tinggi
            $weightedSum += $values[$i] * $weight;
            $weightSum += $weight;
        }
        $dailyBurnRate = $weightSum > 0 ? round($weightedSum / $weightSum, 2) : 0.0;

        // 2. Weekend Multiplier (Jumat, Sabtu, Minggu vs Senin-Kamis)
        $weekendConsumption = [];
        $weekdayConsumption = [];
        foreach ($consumptionMap as $dateStr => $qty) {
            $dayOfWeek = Carbon::parse($dateStr)->dayOfWeek;
            if (in_array($dayOfWeek, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY])) {
                $weekendConsumption[] = $qty;
            } else {
                $weekdayConsumption[] = $qty;
            }
        }

        $avgWeekend = count($weekendConsumption) > 0 ? array_sum($weekendConsumption) / count($weekendConsumption) : 0;
        $avgWeekday = count($weekdayConsumption) > 0 ? array_sum($weekdayConsumption) / count($weekdayConsumption) : 0;
        $weekendMultiplier = $avgWeekday > 0 ? round($avgWeekend / $avgWeekday, 2) : 1.0;

        // 3. Days Until Stockout & Reorder Qty (Proyeksi 7 Hari ke Depan)
        if ($dailyBurnRate > 0) {
            $daysUntilStockout = $currentStock > 0 ? round($currentStock / $dailyBurnRate, 1) : 0.0;
            $neededFor7Days = ($dailyBurnRate * 7) * self::SAFETY_BUFFER;
            $recommendedReorderQty = max(0, round($neededFor7Days - $currentStock, 2));
        } else {
            $daysUntilStockout = null; // Tidak ada pemakaian / data belum cukup
            $recommendedReorderQty = 0.0;
        }

        // Tentukan Tingkat Urgensi
        $urgency = 'SAFE';
        if ($currentStock <= 0 || ($daysUntilStockout !== null && $daysUntilStockout <= 1.5)) {
            $urgency = 'CRITICAL';
        } elseif ($daysUntilStockout !== null && $daysUntilStockout <= 3.0) {
            $urgency = 'WARNING';
        }

        $result = [
            'ingredient_id'           => $ingredient->id,
            'name'                    => $ingredient->name,
            'ingredient_name'         => $ingredient->name,
            'unit'                    => $ingredient->unit,
            'current_stock'           => $currentStock,
            'min_stock_alert'         => (float) $ingredient->min_stock_alert,
            'daily_burn_rate'         => $dailyBurnRate,
            'weekend_multiplier'      => $weekendMultiplier,
            'days_until_stockout'     => $daysUntilStockout,
            'recommended_reorder_qty' => $recommendedReorderQty,
            'urgency'                 => $urgency,
        ];

        // Khusus Superadmin/Owner: sertakan metrik nilai finansial
        if ($isExecutive) {
            $estimatedCost = round($recommendedReorderQty * $costPerUnit, 2);
            $result['cost_per_unit']  = $costPerUnit;
            $result['estimated_cost'] = $estimatedCost;
        }

        return $result;
    }
}
