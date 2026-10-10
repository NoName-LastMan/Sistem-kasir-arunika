<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Order;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    /**
     * Membuka shift baru untuk kasir yang sedang login.
     */
    public function openShift(Request $request)
    {
        $request->validate([
            'starting_cash' => 'required|numeric|min:0',
        ]);

        $activeShift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if ($activeShift) {
            return response()->json([
                'message' => 'Anda masih memiliki shift aktif yang belum ditutup.',
                'data'    => $this->formatShiftData($activeShift)
            ], 400);
        }

        $shift = Shift::create([
            'user_id'       => $request->user()->id,
            'opened_at'     => now(),
            'starting_cash' => $request->starting_cash,
            'status'        => 'open',
        ]);

        return response()->json([
            'message' => 'Shift berhasil dibuka.',
            'data'    => $this->formatShiftData($shift)
        ], 201);
    }

    /**
     * Mendapatkan status shift aktif kasir beserta metrik real-time.
     */
    public function currentShift(Request $request)
    {
        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'Tidak ada shift aktif untuk kasir ini.',
                'data'    => null
            ]);
        }

        return response()->json([
            'message' => 'Status shift aktif',
            'data'    => $this->formatShiftData($shift)
        ]);
    }

    /**
     * Menutup shift aktif kasir dan melakukan rekonsiliasi kas.
     */
    public function closeShift(Request $request)
    {
        $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'notes'       => 'nullable|string',
        ]);

        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'Tidak ada shift aktif untuk ditutup.',
            ], 404);
        }

        $summary = $this->calculateShiftMetrics($shift);

        $expectedCash   = round((float) $shift->starting_cash + (float) $summary['cash_sales'], 2);
        $actualCash     = round((float) $request->actual_cash, 2);
        $cashDifference = round($actualCash - $expectedCash, 2);

        $shift->update([
            'closed_at'       => now(),
            'expected_cash'   => $expectedCash,
            'actual_cash'     => $actualCash,
            'cash_difference' => $cashDifference,
            'notes'           => $request->notes,
            'status'          => 'closed',
        ]);

        return response()->json([
            'message' => 'Shift berhasil ditutup dan direkonsiliasi.',
            'data'    => array_merge($this->formatShiftData($shift), [
                'reconciliation' => [
                    'starting_cash'   => round((float) $shift->starting_cash, 2),
                    'cash_sales'      => round((float) $summary['cash_sales'], 2),
                    'expected_cash'   => $expectedCash,
                    'actual_cash'     => $actualCash,
                    'cash_difference' => $cashDifference,
                    'status_diff'     => $cashDifference == 0 ? 'balanced' : ($cashDifference > 0 ? 'over' : 'short')
                ]
            ])
        ]);
    }

    /**
     * Detail dan rekapan ringkasan shift tertentu.
     */
    public function summary(Shift $shift)
    {
        return response()->json([
            'message' => 'Rekapitulasi shift',
            'data'    => $this->formatShiftData($shift)
        ]);
    }

    /**
     * Helper untuk menghitung metrik penjualan dalam shift.
     */
    private function calculateShiftMetrics(Shift $shift)
    {
        $ordersQuery = Order::where(function ($q) use ($shift) {
            if ($shift->id) {
                $q->where('shift_id', $shift->id)
                  ->orWhere(function ($sub) use ($shift) {
                      $sub->where('user_id', $shift->user_id)
                          ->where('created_at', '>=', $shift->opened_at)
                          ->when($shift->closed_at, fn($c) => $c->where('created_at', '<=', $shift->closed_at));
                  });
            }
        })->where('status', 'completed');

        $orders = (clone $ordersQuery)->get();

        $cashSales     = round((float) (clone $ordersQuery)->where('payment_method', 'cash')->sum('total_amount'), 2);
        $qrisSales     = round((float) (clone $ordersQuery)->where('payment_method', 'qris')->sum('total_amount'), 2);
        $cardSales     = round((float) (clone $ordersQuery)->where('payment_method', 'card')->sum('total_amount'), 2);
        $transferSales = round((float) (clone $ordersQuery)->where('payment_method', 'transfer')->sum('total_amount'), 2);

        $totalRevenue  = round((float) $orders->sum('total_amount'), 2);
        $totalDiscount = round((float) $orders->sum('discount_amount'), 2);
        $totalTax      = round((float) $orders->sum('tax_amount'), 2);
        $totalOrders   = $orders->count();

        return [
            'total_orders'   => $totalOrders,
            'total_revenue'  => $totalRevenue,
            'total_discount' => $totalDiscount,
            'total_tax'      => $totalTax,
            'cash_sales'     => $cashSales,
            'qris_sales'     => $qrisSales,
            'card_sales'     => $cardSales,
            'transfer_sales' => $transferSales,
        ];
    }

    /**
     * Format data shift dengan metrik lengkap.
     */
    private function formatShiftData(Shift $shift)
    {
        $shift->load('user:id,name,email');
        $metrics = $this->calculateShiftMetrics($shift);
        $expectedCash = round((float) $shift->starting_cash + (float) $metrics['cash_sales'], 2);

        return array_merge($shift->toArray(), [
            'metrics'       => $metrics,
            'expected_cash' => $shift->status === 'closed' ? round((float) $shift->expected_cash, 2) : $expectedCash,
        ]);
    }
}
