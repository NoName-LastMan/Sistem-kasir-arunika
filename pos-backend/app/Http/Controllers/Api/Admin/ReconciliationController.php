<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReconciliationService;
use Illuminate\Http\Request;

class ReconciliationController extends Controller
{
    public function __construct(
        private ReconciliationService $reconciliationService,
    ) {}

    public function expectedStock(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
        ]);

        $result = $this->reconciliationService->calculateExpectedStock(
            ingredientId: $request->ingredient_id,
            startDate:    $request->start_date,
            endDate:      $request->end_date,
        );

        return response()->json([
            'message' => 'Perhitungan stok seharusnya',
            'data'    => $result,
        ]);
    }

    public function reconcile(Request $request)
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'actual_stock'  => 'required|numeric|min:0',
            'notes'         => 'nullable|string|max:500',
        ]);

        $result = $this->reconciliationService->reconcile(
            ingredientId: $validated['ingredient_id'],
            actualStock:  (float) $validated['actual_stock'],
            userId:       $request->user()->id,
            notes:        $validated['notes'] ?? null,
        );

        $status = $result['is_anomaly'] ? 'ANOMALI TERDETEKSI' : 'Normal';

        return response()->json([
            'message' => "Rekonsiliasi selesai. Status: {$status}",
            'data'    => $result,
        ], 201);
    }

    public function report(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $report = $this->reconciliationService->getReconciliationReport(
            startDate: $request->start_date,
            endDate:   $request->end_date,
        );

        $anomalies = collect($report)->where('is_anomaly', true)->values();

        return response()->json([
            'message' => 'Laporan rekonsiliasi stok',
            'data'    => [
                'ingredients' => $report,
                'anomalies'   => $anomalies,
                'total_items' => count($report),
                'anomaly_count' => $anomalies->count(),
            ],
        ]);
    }
}
