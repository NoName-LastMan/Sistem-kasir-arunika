<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AiInsightService;
use App\Services\StockForecastingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForecastingController extends Controller
{
    public function __construct(
        protected StockForecastingService $forecastingService,
        protected AiInsightService $aiService
    ) {}

    /**
     * Endpoint untuk Admin/Staf: Hanya data kuantitas fisik dan instruksi operasional.
     */
    public function index(Request $request): JsonResponse
    {
        $ingredientId = $request->query('ingredient_id') ? (int) $request->query('ingredient_id') : null;
        $forceRefresh = $request->boolean('refresh');

        if ($forceRefresh) {
            $this->forecastingService->generateAndSaveDailySnapshot(Carbon::today());
        }

        $forecasts = $this->forecastingService->getForecast($ingredientId, false);
        $insight = $this->aiService->generateInsights($forecasts->toArray(), false, $forceRefresh);

        return response()->json([
            'status'  => 'success',
            'insight' => $insight,
            'summary' => [
                'total_items'    => $forecasts->count(),
                'critical_items' => $forecasts->where('urgency', 'CRITICAL')->count(),
                'warning_items'  => $forecasts->where('urgency', 'WARNING')->count(),
                'safe_items'     => $forecasts->where('urgency', 'SAFE')->count(),
            ],
            'data'    => $forecasts,
        ]);
    }

    /**
     * Endpoint khusus Superadmin/Owner: Nilai Rupiah belanja, estimasi dana, dan analisis eksekutif.
     */
    public function executive(Request $request): JsonResponse
    {
        $ingredientId = $request->query('ingredient_id') ? (int) $request->query('ingredient_id') : null;
        $forceRefresh = $request->boolean('refresh');

        if ($forceRefresh) {
            $this->forecastingService->generateAndSaveDailySnapshot(Carbon::today());
        }

        $forecasts = $this->forecastingService->getForecast($ingredientId, true);

        $totalEstimatedCost = $forecasts->sum('estimated_cost');
        $criticalCost = $forecasts->where('urgency', 'CRITICAL')->sum('estimated_cost');
        $avgAccuracy = $forecasts->whereNotNull('accuracy_percentage')->avg('accuracy_percentage');

        $insight = $this->aiService->generateInsights($forecasts->toArray(), true, $forceRefresh);

        return response()->json([
            'status'               => 'success',
            'insight'              => $insight,
            'financial_summary'    => [
                'total_reorder_budget'    => $totalEstimatedCost,
                'critical_reorder_budget' => $criticalCost,
                'critical_count'          => $forecasts->where('urgency', 'CRITICAL')->count(),
                'warning_count'           => $forecasts->where('urgency', 'WARNING')->count(),
                'average_accuracy'        => $avgAccuracy !== null ? round($avgAccuracy, 1) : null,
            ],
            'data'                 => $forecasts,
        ]);
    }
}
