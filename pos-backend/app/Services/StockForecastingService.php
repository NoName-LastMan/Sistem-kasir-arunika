<?php

namespace App\Services;

use App\Models\AiBriefingLog;
use App\Models\ForecastSnapshot;
use App\Models\Ingredient;
use App\Models\StockMutation;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StockForecastingService
{
    const HISTORICAL_DAYS = 28;
    const SAFETY_BUFFER = 1.15; // 15% minimum safety buffer

    /**
     * Ambil prediksi stok matang (Snapshot-first).
     * Jika snapshot hari ini belum ada, sistem secara otomatis menghitung dan menyimpannya.
     */
    public function getForecast(?int $ingredientId = null, bool $isExecutive = false): Collection
    {
        $today = Carbon::today()->toDateString();

        // 1. Coba baca dari Materialized Snapshot hari ini
        $query = ForecastSnapshot::with('ingredient')
            ->whereDate('forecast_date', $today);

        if ($ingredientId) {
            $query->where('ingredient_id', $ingredientId);
        }

        $snapshots = $query->get();

        // Jika belum ada snapshot hari ini, hasilkan secara otomatis (self-healing)
        if ($snapshots->isEmpty()) {
            $snapshots = $this->generateAndSaveDailySnapshot(Carbon::today());
            if ($ingredientId) {
                $snapshots = $snapshots->where('ingredient_id', $ingredientId)->values();
            }
        }

        // 2. Format output sesuai RBAC (Admin vs Owner/Executive)
        return $snapshots->map(function ($snap) use ($isExecutive) {
            $ingredient = $snap->ingredient ?? Ingredient::find($snap->ingredient_id);
            $name = $ingredient ? $ingredient->name : 'Bahan #' . $snap->ingredient_id;
            $unit = $ingredient ? ($ingredient->unit ?? $ingredient->base_unit ?? 'pcs') : 'pcs';

            $result = [
                'id'                         => $snap->id,
                'ingredient_id'              => $snap->ingredient_id,
                'name'                       => $name,
                'ingredient_name'            => $name,
                'unit'                       => $unit,
                'supplier_info'              => $ingredient ? $ingredient->supplier_info : null,
                'lead_time_days'             => (int) ($snap->lead_time_days ?? ($ingredient ? $ingredient->lead_time_days : 7)),
                'purchase_unit'              => $snap->purchase_unit ?? ($ingredient ? $ingredient->purchase_unit : null),
                'purchase_unit_ratio'        => (float) ($ingredient ? ($ingredient->purchase_unit_ratio ?? 1.0) : 1.0),
                'recommended_purchase_packs' => (float) ($snap->recommended_purchase_packs ?? 0),
                'model_used'                 => $snap->model_used,
                'current_stock'              => (float) $snap->current_stock,
                'daily_burn_rate'            => (float) $snap->predicted_daily_burn,
                'predicted_daily_burn'       => (float) $snap->predicted_daily_burn,
                'safety_stock_qty'           => (float) $snap->safety_stock_qty,
                'days_until_stockout'        => $snap->days_until_stockout !== null ? (float) $snap->days_until_stockout : null,
                'recommended_reorder_qty'    => (float) $snap->recommended_reorder_qty,
                'urgency'                    => $snap->urgency_status,
                'urgency_status'             => $snap->urgency_status,
                'forecast_date'              => $snap->forecast_date ? $snap->forecast_date->toDateString() : Carbon::today()->toDateString(),
            ];

            // Metrik Finansial & Evaluasi Akurasi (Khusus Superadmin/Owner)
            if ($isExecutive) {
                $result['unit_cost_rp']              = (float) $snap->unit_cost_rp;
                $result['cost_per_unit']             = (float) $snap->unit_cost_rp;
                $result['estimated_cost']            = (float) $snap->estimated_reorder_cost_rp;
                $result['estimated_reorder_cost_rp'] = (float) $snap->estimated_reorder_cost_rp;
                $result['actual_usage_yesterday']    = $snap->actual_usage_yesterday !== null ? (float) $snap->actual_usage_yesterday : null;
                $result['accuracy_percentage']       = $snap->accuracy_percentage !== null ? (float) $snap->accuracy_percentage : null;
            }

            return $result;
        });
    }

    /**
     * Hitung & simpan pre-computed snapshot harian untuk seluruh bahan baku.
     * Dapat dijalankan via Cron Job (01:00 WIB), event StockOpname, atau on-demand.
     */
    public function generateAndSaveDailySnapshot(?Carbon $targetDate = null): Collection
    {
        $targetDate = $targetDate ? $targetDate->copy()->startOfDay() : Carbon::today();
        $dateStr = $targetDate->toDateString();
        $startDate = $targetDate->copy()->subDays(self::HISTORICAL_DAYS)->startOfDay();

        $ingredients = Ingredient::orderBy('name')->get();

        // 1. Agregasi konsumsi historis 28 hari terakhir (FILTER: kecualikan waste/kerusakan agar tidak mendistorsi peramalan)
        $mutations = StockMutation::whereIn('type', [StockMutation::TYPE_SALES, 'out'])
            ->whereNotNull('ingredient_id')
            ->where(function ($query) {
                $query->whereNull('reference_type')
                      ->orWhere('reference_type', '!=', 'waste');
            })
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<', $targetDate->copy()->endOfDay())
            ->select([
                'ingredient_id',
                DB::raw('DATE(created_at) as mutation_date'),
                DB::raw('SUM(ABS(quantity)) as total_consumed'),
            ])
            ->groupBy('ingredient_id', DB::raw('DATE(created_at)'))
            ->get()
            ->groupBy('ingredient_id');

        // 2. Ambil snapshot kemarin untuk evaluasi akurasi (Self-Evaluating WAPE)
        $yesterday = $targetDate->copy()->subDay()->toDateString();
        $yesterdaySnapshots = ForecastSnapshot::whereDate('forecast_date', $yesterday)
            ->get()
            ->keyBy('ingredient_id');

        // 3. Ambil pemakaian aktual kemarin (juga kecualikan waste)
        $yesterdayUsage = StockMutation::whereIn('type', [StockMutation::TYPE_SALES, 'out'])
            ->whereNotNull('ingredient_id')
            ->where(function ($query) {
                $query->whereNull('reference_type')
                      ->orWhere('reference_type', '!=', 'waste');
            })
            ->whereDate('created_at', $yesterday)
            ->select([
                'ingredient_id',
                DB::raw('SUM(ABS(quantity)) as total_consumed'),
            ])
            ->groupBy('ingredient_id')
            ->get()
            ->pluck('total_consumed', 'ingredient_id');

        $createdSnapshots = collect();

        foreach ($ingredients as $ingredient) {
            $dailyLogs = $mutations->get($ingredient->id, collect());
            $metrics = $this->calculateMultiTierMetrics($ingredient, $dailyLogs, $targetDate);

            // Hitung evaluasi akurasi (100 - WAPE) jika ada prediksi kemarin
            $actualYesterday = isset($yesterdayUsage[$ingredient->id]) ? (float) $yesterdayUsage[$ingredient->id] : 0.0;
            $accuracy = null;
            if (isset($yesterdaySnapshots[$ingredient->id])) {
                $predictedYesterday = (float) $yesterdaySnapshots[$ingredient->id]->predicted_daily_burn;
                if ($actualYesterday > 0 || $predictedYesterday > 0) {
                    $wape = abs($actualYesterday - $predictedYesterday) / max($actualYesterday, 1.0);
                    $accuracy = round(max(0.0, min(100.0, (1.0 - $wape) * 100)), 1);
                } else {
                    $accuracy = 100.0; // Prediksi 0 dan aktual 0 -> 100% akurat
                }
            }

            $costPerUnit = (float) ($ingredient->cost_per_unit ?? 0);
            $estimatedCost = round($metrics['recommended_reorder_qty'] * $costPerUnit, 2);

            $leadTime = (int) ($ingredient->lead_time_days ?: 7);
            $purchaseUnit = $ingredient->purchase_unit;
            $purchaseRatio = (float) ($ingredient->purchase_unit_ratio ?: 1.0);
            $reorderQty = (float) $metrics['recommended_reorder_qty'];
            $purchasePacks = ($purchaseRatio > 1 && $reorderQty > 0)
                ? (float) ceil($reorderQty / $purchaseRatio)
                : $reorderQty;

            $snapshot = ForecastSnapshot::updateOrCreate(
                [
                    'forecast_date' => $dateStr,
                    'ingredient_id' => $ingredient->id,
                ],
                [
                    'model_used'                 => $metrics['model_used'],
                    'lead_time_days'             => $leadTime,
                    'current_stock'              => $metrics['current_stock'],
                    'predicted_daily_burn'       => $metrics['predicted_daily_burn'],
                    'safety_stock_qty'           => $metrics['safety_stock_qty'],
                    'days_until_stockout'        => $metrics['days_until_stockout'],
                    'recommended_reorder_qty'    => $reorderQty,
                    'purchase_unit'              => $purchaseUnit,
                    'recommended_purchase_packs' => $purchasePacks,
                    'urgency_status'             => $metrics['urgency'],
                    'unit_cost_rp'               => $costPerUnit,
                    'estimated_reorder_cost_rp'  => $estimatedCost,
                    'actual_usage_yesterday'     => $actualYesterday,
                    'accuracy_percentage'        => $accuracy,
                ]
            );

            $snapshot->setRelation('ingredient', $ingredient);
            $createdSnapshots->push($snapshot);
        }

        return $createdSnapshots;
    }

    /**
     * Hitung metrik dengan Multi-Tier Model Routing:
     * - Tier 1: Fast-Moving (AutoETS / LightGBM)
     * - Tier 2: Intermittent / Slow-Moving (Croston's Method)
     * - Tier 3: Cold-Start (<14 data points: WMA + Multiplier)
     */
    public function calculateMultiTierMetrics(Ingredient $ingredient, Collection $dailyLogs, Carbon $targetDate): array
    {
        $currentStock = (float) ($ingredient->current_stock ?? $ingredient->stock_quantity ?? 0);

        // Petakan konsumsi harian 28 hari terakhir
        $consumptionMap = [];
        for ($i = 0; $i < self::HISTORICAL_DAYS; $i++) {
            $date = $targetDate->copy()->subDays(self::HISTORICAL_DAYS - 1 - $i)->toDateString();
            $consumptionMap[$date] = 0.0;
        }

        foreach ($dailyLogs as $log) {
            if (isset($consumptionMap[$log->mutation_date])) {
                $consumptionMap[$log->mutation_date] = (float) $log->total_consumed;
            }
        }

        $series = array_values($consumptionMap);
        $nonZeroCount = count(array_filter($series, fn($v) => $v > 0));
        $nonZeroRatio = count($series) > 0 ? $nonZeroCount / count($series) : 0;
        $leadTime = max(1, (int) ($ingredient->lead_time_days ?: 7));

        // Cek Python FastAPI Microservice jika aktif
        $fastApiResult = $this->queryFastApiEngine($ingredient->id, $series, $leadTime);
        if ($fastApiResult) {
            $predictedBurn = (float) $fastApiResult['daily_burn_rate'];
            $safetyStock = (float) $fastApiResult['safety_stock_qty'];
            $modelUsed = $fastApiResult['model_used'];
        } else {
            // Routing Internal (Deterministik & Statistik)
            if ($nonZeroCount >= 14 && $nonZeroRatio >= 0.5) {
                // Tier 1: Fast-Moving (AutoETS / Holt-Winters Approximation)
                $modelUsed = 'AutoETS';
                $calc = $this->calculateAutoEts($series, $consumptionMap, $leadTime);
                $predictedBurn = $calc['burn_rate'];
                $safetyStock = $calc['safety_stock'];
            } elseif ($nonZeroCount > 0 && $nonZeroRatio < 0.5) {
                // Tier 2: Intermittent (Croston's Method)
                $modelUsed = 'Croston';
                $calc = $this->calculateCroston($series);
                $predictedBurn = $calc['burn_rate'];
                $safetyStock = $calc['safety_stock'];
            } else {
                // Tier 3: Cold-Start / New Item
                $modelUsed = 'WMA_Fallback';
                $calc = $this->calculateWmaFallback($series, $leadTime);
                $predictedBurn = $calc['burn_rate'];
                $safetyStock = $calc['safety_stock'];
            }
        }

        // Hitung Days to Stockout & Reorder Qty berdasarkan Lead Time bahan
        if ($predictedBurn > 0) {
            $daysUntilStockout = $currentStock > 0 ? round($currentStock / $predictedBurn, 1) : 0.0;
            $neededForHorizon = ($predictedBurn * $leadTime) + $safetyStock;
            $recommendedReorderQty = max(0, round($neededForHorizon - $currentStock, 2));
        } else {
            $daysUntilStockout = null;
            $recommendedReorderQty = 0.0;
        }

        // Tentukan Urgensi
        $urgency = 'SAFE';
        if ($currentStock <= 0 || ($daysUntilStockout !== null && $daysUntilStockout <= 1.5)) {
            $urgency = 'CRITICAL';
        } elseif ($daysUntilStockout !== null && $daysUntilStockout <= 3.0) {
            $urgency = 'WARNING';
        }

        return [
            'model_used'              => $modelUsed,
            'current_stock'           => $currentStock,
            'predicted_daily_burn'    => $predictedBurn,
            'safety_stock_qty'        => $safetyStock,
            'days_until_stockout'     => $daysUntilStockout,
            'recommended_reorder_qty' => $recommendedReorderQty,
            'urgency'                 => $urgency,
        ];
    }

    /**
     * Tier 1: AutoETS (Holt-Winters dengan Seasonality Weekend & P90 Prediction Interval).
     */
    private function calculateAutoEts(array $series, array $consumptionMap, int $leadTime = 7): array
    {
        $n = count($series);
        if ($n === 0) return ['burn_rate' => 0.0, 'safety_stock' => 0.0];

        // Exponential smoothing (alpha = 0.3)
        $level = $series[0];
        $alpha = 0.3;
        $residuals = [];

        for ($i = 1; $i < $n; $i++) {
            $residuals[] = abs($series[$i] - $level);
            $level = ($alpha * $series[$i]) + ((1 - $alpha) * $level);
        }

        // Weekend seasonality
        $weekend = [];
        $weekday = [];
        foreach ($consumptionMap as $d => $val) {
            $dow = Carbon::parse($d)->dayOfWeek;
            if (in_array($dow, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY])) {
                $weekend[] = $val;
            } else {
                $weekday[] = $val;
            }
        }

        $avgWeekend = count($weekend) > 0 ? array_sum($weekend) / count($weekend) : $level;
        $avgWeekday = count($weekday) > 0 ? array_sum($weekday) / count($weekday) : $level;
        $seasonalFactor = $avgWeekday > 0 ? min(1.8, max(0.8, $avgWeekend / $avgWeekday)) : 1.0;

        $burnRate = round($level * (($seasonalFactor + 1.0) / 2), 2);

        // P90 Prediction Interval untuk Safety Stock: Z = 1.645 * StdDev * sqrt(L)
        $stdDev = count($residuals) > 1 ? sqrt(array_sum(array_map(fn($r) => pow($r, 2), $residuals)) / count($residuals)) : ($burnRate * 0.15);
        $safetyStock = round(1.645 * $stdDev * sqrt($leadTime), 2);

        return ['burn_rate' => max(0.01, $burnRate), 'safety_stock' => $safetyStock];
    }

    /**
     * Tier 2: Croston's Method untuk Intermittent / Slow-Moving Demand.
     */
    private function calculateCroston(array $series): array
    {
        $alpha = 0.2;
        $z = null; // demand size
        $p = 1.0;  // inter-arrival interval
        $q = 1;    // periods since last non-zero demand

        foreach ($series as $yt) {
            if ($yt > 0) {
                if ($z === null) {
                    $z = $yt;
                    $p = 1.0;
                } else {
                    $z = ($alpha * $yt) + ((1 - $alpha) * $z);
                    $p = ($alpha * $q) + ((1 - $alpha) * $p);
                }
                $q = 1;
            } else {
                $q++;
            }
        }

        if ($z === null || $p <= 0) {
            return ['burn_rate' => 0.0, 'safety_stock' => 0.0];
        }

        $burnRate = round($z / $p, 2);
        // Safety stock Croston = 1.25x demand size
        $safetyStock = round($z * 1.25, 2);

        return ['burn_rate' => $burnRate, 'safety_stock' => $safetyStock];
    }

    /**
     * Tier 3: WMA Cold-Start Fallback.
     */
    private function calculateWmaFallback(array $series, int $leadTime = 7): array
    {
        $n = count($series);
        if ($n === 0) return ['burn_rate' => 0.0, 'safety_stock' => 0.0];

        $weightedSum = 0;
        $weightSum = 0;
        for ($i = 0; $i < $n; $i++) {
            $w = $i + 1;
            $weightedSum += $series[$i] * $w;
            $weightSum += $w;
        }

        $burnRate = $weightSum > 0 ? round($weightedSum / $weightSum, 2) : 0.0;
        $safetyStock = round($burnRate * $leadTime * 0.15, 2);

        return ['burn_rate' => $burnRate, 'safety_stock' => $safetyStock];
    }

    private function queryFastApiEngine(int $ingredientId, array $series, int $horizon = 7): ?array
    {
        $serviceUrl = config('services.forecasting.url', 'http://127.0.0.1:8001');

        try {
            $response = Http::timeout(1.5)->post("{$serviceUrl}/forecast", [
                'ingredient_id'      => $ingredientId,
                'time_series'        => $series,
                'prediction_horizon' => $horizon,
            ]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Throwable $e) {
            // Silently fallback to internal computation
        }

        return null;
    }

    /**
     * Sinkronisasi cepat current_stock & urgency pada snapshot hari ini saat terjadi mutasi stok bahan baku.
     * Tidak perlu komputasi ulang 28 hari dari awal; hanya update stok riil, sisa hari, dan status urgensi.
     */
    public function syncIngredientStockSnapshot(int $ingredientId, float $newStock): void
    {
        try {
            $today = Carbon::today()->toDateString();
            $snapshot = ForecastSnapshot::where('ingredient_id', $ingredientId)
                ->whereDate('forecast_date', $today)
                ->first();

            if ($snapshot) {
                $ingredient = Ingredient::find($ingredientId);
                $leadTime = max(1, (int) ($snapshot->lead_time_days ?? ($ingredient ? $ingredient->lead_time_days : 7)));
                $purchaseRatio = (float) ($ingredient ? ($ingredient->purchase_unit_ratio ?: 1.0) : 1.0);

                $burn = (float) $snapshot->predicted_daily_burn;
                $daysLeft = $burn > 0 ? ($newStock > 0 ? round($newStock / $burn, 1) : 0.0) : null;
                $neededForHorizon = ($burn * $leadTime) + (float) $snapshot->safety_stock_qty;
                $reorderQty = max(0, round($neededForHorizon - $newStock, 2));
                $purchasePacks = ($purchaseRatio > 1 && $reorderQty > 0)
                    ? (float) ceil($reorderQty / $purchaseRatio)
                    : $reorderQty;

                $urgency = 'SAFE';
                if ($newStock <= 0 || ($daysLeft !== null && $daysLeft <= 1.5)) {
                    $urgency = 'CRITICAL';
                } elseif ($daysLeft !== null && $daysLeft <= 3.0) {
                    $urgency = 'WARNING';
                }

                $estimatedCost = round($reorderQty * (float) $snapshot->unit_cost_rp, 2);

                $snapshot->update([
                    'current_stock'              => $newStock,
                    'days_until_stockout'        => $daysLeft,
                    'recommended_reorder_qty'    => $reorderQty,
                    'recommended_purchase_packs' => $purchasePacks,
                    'urgency_status'             => $urgency,
                    'estimated_reorder_cost_rp'  => $estimatedCost,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning("Gagal auto-sync snapshot stok bahan #{$ingredientId}: " . $e->getMessage());
        }
    }
}

