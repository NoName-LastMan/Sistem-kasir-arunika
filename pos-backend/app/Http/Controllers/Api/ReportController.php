<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Laporan Omzet Harian (Default 30 hari atau custom date range).
     */
    public function dailyRevenue(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $revenue = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('SUM(discount_amount) as total_discount'),
                DB::raw('SUM(tax_amount) as total_tax'),
                DB::raw('COUNT(id) as total_orders')
            )
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'message' => 'Laporan omzet harian',
            'data'    => $revenue
        ]);
    }

    /**
     * Laporan Produk Terlaris (Top Selling Products).
     */
    public function topProducts(Request $request)
    {
        $limit = (int)$request->input('limit', 10);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(subtotal) as total_sales_amount'))
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed');
                if ($startDate) $q->whereDate('created_at', '>=', $startDate);
                if ($endDate) $q->whereDate('created_at', '<=', $endDate);
            })
            ->with(['product' => function ($q) {
                $q->select('id', 'name', 'category_id', 'price', 'cost_price')->with('category:id,name');
            }])
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->take($limit);

        return response()->json([
            'message' => "Laporan {$limit} produk terlaris",
            'data'    => $query->get()
        ]);
    }

    /**
     * Ringkasan Penjualan Komprehensif (KPIs, Payment Methods, Order Types).
     */
    public function salesSummary(Request $request)
    {
        $startDate = $request->input('start_date', now()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $result = app(ReportService::class)->calculateSalesSummary(
            startDate:     $startDate,
            endDate:       $endDate,
            userId:        $request->filled('user_id') ? (int) $request->user_id : null,
            paymentMethod: $request->filled('payment_method') ? $request->payment_method : null,
        );

        return response()->json([
            'message' => 'Ringkasan laporan penjualan',
            'data'    => array_merge([
                'period' => [
                    'start_date' => $startDate,
                    'end_date'   => $endDate,
                ],
            ], $result),
        ]);
    }

    /**
     * Laporan Laba Rugi Kotor (Gross Profit & Margin dari HPP / Cost Price).
     */
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $result = app(ReportService::class)->calculateProfitLoss($startDate, $endDate);

        return response()->json([
            'message' => 'Laporan Laba Kotor & Analisis Margin',
            'data'    => array_merge([
                'period' => [
                    'start_date' => $startDate,
                    'end_date'   => $endDate,
                ],
            ], $result),
        ]);
    }

    /**
     * Laporan Penjualan Per Kasir (Owner Tracking).
     */
    public function cashierSales(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $cashiers = \App\Models\User::select('id', 'name', 'email', 'role')
            ->withCount(['orders' => function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            }])
            ->withSum(['orders' => function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            }], 'total_amount')
            ->get()
            ->map(function ($user) use ($startDate, $endDate) {
                $cashAmount = (float) Order::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->where('payment_method', 'cash')
                    ->whereDate('created_at', '>=', $startDate)
                    ->whereDate('created_at', '<=', $endDate)
                    ->sum('total_amount');

                $nonCashAmount = (float) Order::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->where('payment_method', '!=', 'cash')
                    ->whereDate('created_at', '>=', $startDate)
                    ->whereDate('created_at', '<=', $endDate)
                    ->sum('total_amount');

                return [
                    'id'              => $user->id,
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'role'            => $user->role,
                    'total_orders'    => $user->orders_count ?? 0,
                    'total_revenue'   => (float) ($user->orders_sum_total_amount ?? 0),
                    'cash_revenue'    => $cashAmount,
                    'non_cash_revenue'=> $nonCashAmount,
                ];
            });

        return response()->json([
            'message' => 'Laporan performa per kasir',
            'data'    => $cashiers
        ]);
    }

    /**
     * Ekspor Laporan Transaksi ke Format CSV.
     */
    public function exportCsv(Request $request)
    {
        $startDate = $request->input('start_date', now()->subDays(7)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $orders = Order::with(['user:id,name', 'table:id,table_number'])
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $filename = "laporan_penjualan_{$startDate}_sampai_{$endDate}.csv";

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['No. Invoice', 'Tanggal & Waktu', 'Kasir', 'Tipe Pesanan', 'Meja', 'Metode Pembayaran', 'Subtotal', 'Diskon', 'Pajak', 'Total Akhir']);

            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->invoice_number,
                    $order->created_at->format('Y-m-d H:i:s'),
                    $order->user->name ?? 'Kasir',
                    $order->order_type,
                    $order->table ? "Meja {$order->table->table_number}" : '-',
                    strtoupper($order->payment_method),
                    $order->subtotal,
                    $order->discount_amount,
                    $order->tax_amount,
                    $order->total_amount,
                ]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    /**
     * Ekspor Seluruh 9 Laporan Konsolidasi Menjadi 1 File Excel Multi-Sheet untuk Owner.
     */
    public function exportExcel(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $xmlContent = app(\App\Services\MasterReportExcelService::class)->generateMasterWorkbook($startDate, $endDate);
        $filename = "Master_Laporan_Konsolidasi_Arunika_{$startDate}_sd_{$endDate}.xls";

        return response($xmlContent, 200, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'max-age=0, no-cache, must-revalidate, proxy-revalidate',
            'Pragma'              => 'public',
        ]);
    }
}
