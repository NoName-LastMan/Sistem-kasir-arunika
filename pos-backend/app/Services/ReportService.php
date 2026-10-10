<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;

class ReportService
{
    /**
     * Hitung laba kotor (gross profit) dari HPP untuk periode tertentu.
     */
    public function calculateProfitLoss(string $startDate, string $endDate): array
    {
        $items = OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->with('product:id,name,price,cost_price')
            ->get();

        $totalRevenue = 0.0;
        $totalCogs    = 0.0;

        foreach ($items as $item) {
            $totalRevenue = round($totalRevenue + (float) $item->subtotal, 2);
            $costPrice    = (float) ($item->product->cost_price ?? 0);
            $totalCogs    = round($totalCogs + ($costPrice * $item->quantity), 2);
        }

        $totalDiscounts = (float) Order::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('discount_amount');

        $grossProfit     = round(($totalRevenue - $totalDiscounts) - $totalCogs, 2);
        $profitMarginPct = $totalRevenue > 0
            ? round(($grossProfit / $totalRevenue) * 100, 2)
            : 0.0;

        return [
            'total_revenue'         => $totalRevenue,
            'total_discounts'       => $totalDiscounts,
            'cost_of_goods_sold'    => $totalCogs,
            'gross_profit'          => $grossProfit,
            'profit_margin_percent' => $profitMarginPct,
        ];
    }

    /**
     * Hitung ringkasan penjualan (KPI, breakdown metode bayar & tipe order).
     */
    public function calculateSalesSummary(
        string  $startDate,
        string  $endDate,
        ?int    $userId = null,
        ?string $paymentMethod = null,
    ): array {
        $query = Order::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($paymentMethod) {
            $query->where('payment_method', $paymentMethod);
        }

        $orders = $query->get();

        $totalOrders = $orders->count();
        $totalNet    = (float) $orders->sum('total_amount');
        $avgOrderValue = $totalOrders > 0
            ? round($totalNet / $totalOrders, 2)
            : 0.0;

        return [
            'kpi' => [
                'gross_sales'         => round((float) $orders->sum('subtotal'), 2),
                'total_discount'      => round((float) $orders->sum('discount_amount'), 2),
                'total_tax'           => round((float) $orders->sum('tax_amount'), 2),
                'net_sales'           => round($totalNet, 2),
                'total_orders'        => $totalOrders,
                'average_order_value' => $avgOrderValue,
            ],
            'by_payment_method' => [
                'cash'     => round((float) $orders->where('payment_method', 'cash')->sum('total_amount'), 2),
                'qris'     => round((float) $orders->where('payment_method', 'qris')->sum('total_amount'), 2),
                'card'     => round((float) $orders->where('payment_method', 'card')->sum('total_amount'), 2),
                'transfer' => round((float) $orders->where('payment_method', 'transfer')->sum('total_amount'), 2),
            ],
            'by_order_type' => [
                'dine_in'  => $orders->where('order_type', 'dine_in')->count(),
                'takeaway' => $orders->where('order_type', 'takeaway')->count(),
                'delivery' => $orders->where('order_type', 'delivery')->count(),
            ],
        ];
    }
}
