<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Hitung laba kotor (gross profit) dari HPP untuk periode tertentu.
     * Menggunakan direct SQL aggregation untuk memangkas ribuan model Eloquent dari RAM.
     */
    public function calculateProfitLoss(string $startDate, string $endDate): array
    {
        $aggregated = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'completed')
            ->whereDate('orders.created_at', '>=', $startDate)
            ->whereDate('orders.created_at', '<=', $endDate)
            ->selectRaw('
                COALESCE(SUM(order_items.subtotal), 0) as total_revenue,
                COALESCE(SUM(order_items.quantity * COALESCE(products.cost_price, 0)), 0) as total_cogs
            ')
            ->first();

        $totalRevenue = round((float) ($aggregated->total_revenue ?? 0), 2);
        $totalCogs    = round((float) ($aggregated->total_cogs ?? 0), 2);

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
            'total_discounts'       => round($totalDiscounts, 2),
            'cost_of_goods_sold'    => $totalCogs,
            'gross_profit'          => $grossProfit,
            'profit_margin_percent' => $profitMarginPct,
        ];
    }

    /**
     * Hitung ringkasan penjualan (KPI, breakdown metode bayar & tipe order).
     * Seluruh kalkulasi diselesaikan di level SQL dalam 1 kali query, hemat RAM & CPU.
     */
    public function calculateSalesSummary(
        string  $startDate,
        string  $endDate,
        ?int    $userId = null,
        ?string $paymentMethod = null,
    ): array {
        $baseQuery = Order::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        if ($userId) {
            $baseQuery->where('user_id', $userId);
        }

        if ($paymentMethod) {
            $baseQuery->where('payment_method', $paymentMethod);
        }

        $summary = $baseQuery->selectRaw("
            COUNT(id) as total_orders,
            COALESCE(SUM(subtotal), 0) as gross_sales,
            COALESCE(SUM(discount_amount), 0) as total_discount,
            COALESCE(SUM(tax_amount), 0) as total_tax,
            COALESCE(SUM(total_amount), 0) as net_sales,
            COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as pay_cash,
            COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0) as pay_qris,
            COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END), 0) as pay_card,
            COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END), 0) as pay_transfer,
            COALESCE(SUM(CASE WHEN order_type = 'dine_in' THEN 1 ELSE 0 END), 0) as type_dine_in,
            COALESCE(SUM(CASE WHEN order_type = 'takeaway' THEN 1 ELSE 0 END), 0) as type_takeaway,
            COALESCE(SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END), 0) as type_delivery
        ")->first();

        $totalOrders = (int) ($summary->total_orders ?? 0);
        $totalNet    = (float) ($summary->net_sales ?? 0);
        $avgOrderValue = $totalOrders > 0
            ? round($totalNet / $totalOrders, 2)
            : 0.0;

        return [
            'kpi' => [
                'gross_sales'         => round((float) ($summary->gross_sales ?? 0), 2),
                'total_discount'      => round((float) ($summary->total_discount ?? 0), 2),
                'total_tax'           => round((float) ($summary->total_tax ?? 0), 2),
                'net_sales'           => round($totalNet, 2),
                'total_orders'        => $totalOrders,
                'average_order_value' => $avgOrderValue,
            ],
            'by_payment_method' => [
                'cash'     => round((float) ($summary->pay_cash ?? 0), 2),
                'qris'     => round((float) ($summary->pay_qris ?? 0), 2),
                'card'     => round((float) ($summary->pay_card ?? 0), 2),
                'transfer' => round((float) ($summary->pay_transfer ?? 0), 2),
            ],
            'by_order_type' => [
                'dine_in'  => (int) ($summary->type_dine_in ?? 0),
                'takeaway' => (int) ($summary->type_takeaway ?? 0),
                'delivery' => (int) ($summary->type_delivery ?? 0),
            ],
        ];
    }
}
