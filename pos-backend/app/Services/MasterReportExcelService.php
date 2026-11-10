<?php

namespace App\Services;

use App\Models\ForecastSnapshot;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use App\Services\Excel\XlsxSheet;
use App\Services\Excel\XlsxWorkbookWriter;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MasterReportExcelService
{
    /**
     * Hasilkan workbook Excel OOXML (.xlsx) resmi berisi 9 sheet laporan konsolidasi
     * lengkap dengan formula dinamis, format Rupiah/desimal akurat, filter otomatis,
     * freeze pane, warna status semantik, dan grafik native Excel untuk Owner.
     */
    public function generateMasterWorkbook(string $startDate, string $endDate): string
    {
        $setting = Setting::first();
        $storeName = trim((string) ($setting->store_name ?? '')) ?: 'Arunika Coffee and Space';
        $storeAddress = trim((string) ($setting->store_address ?? '')) ?: 'Sistem Kasir & Operasional F&B';
        $printedAt = now()->format('d M Y, H:i') . ' WIB';
        $periodText = Carbon::parse($startDate)->format('d M Y') . ' s/d ' . Carbon::parse($endDate)->format('d M Y');

        $reportService = app(ReportService::class);
        $summary = $reportService->calculateSalesSummary($startDate, $endDate);
        $profitLoss = $reportService->calculateProfitLoss($startDate, $endDate);

        // Ambil metrik pendukung lintas-modul sekali agar Sheet 1 dan sub-sheet konsisten
        $crossMetrics = $this->collectCrossModuleMetrics($startDate, $endDate);

        $writer = new XlsxWorkbookWriter(
            "Laporan Konsolidasi {$storeName} ({$startDate} sd {$endDate})",
            'Arunika POS Executive Suite'
        );

        // 1. Ringkasan Eksekutif (Executive Dashboard + Charts)
        $this->buildExecutiveSummarySheet($writer, $storeName, $storeAddress, $periodText, $printedAt, $summary, $profitLoss, $crossMetrics);

        // 2. Laba Rugi & HPP
        $this->buildProfitLossSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate, $profitLoss, $crossMetrics['wasteLoss']);

        // 3. Tren Omzet Harian
        $this->buildDailyRevenueSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        // 4. Menu Terlaris
        $this->buildTopProductsSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        // 5. Performa Kasir & Audit Shift
        $this->buildCashierPerformanceSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        // 6. Limbah Dapur
        $this->buildKitchenWasteSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        // 7. Audit Opname & Anomali
        $this->buildStockOpnameSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        // 8. Prediksi Stok & Belanja AI
        $this->buildForecastingSheet($writer, $storeName, $periodText, $printedAt);

        // 9. Rincian Transaksi & Audit Void
        $this->buildTransactionLedgerSheet($writer, $storeName, $periodText, $printedAt, $startDate, $endDate);

        return $writer->toBinary();
    }

    /**
     * Kumpulkan ringkasan lintas modul (pembayaran, kategori, waste, opname, forecast, void)
     * agar Dashboard Sheet 1 menyajikan gambaran operasional utuh.
     *
     * @return array<string, mixed>
     */
    private function collectCrossModuleMetrics(string $startDate, string $endDate): array
    {
        $completedOrders = Order::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        $pmCounts = (clone $completedOrders)
            ->selectRaw("COALESCE(payment_method, 'cash') as pm, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as amt")
            ->groupBy('pm')
            ->get()
            ->keyBy('pm');

        $otSummary = (clone $completedOrders)
            ->selectRaw("COALESCE(order_type, 'dine_in') as ot, COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as amt")
            ->groupBy('ot')
            ->get()
            ->keyBy('ot');

        $activeDays = (int) (clone $completedOrders)
            ->selectRaw('COUNT(DISTINCT DATE(created_at)) as d')
            ->value('d');

        $voidCount = (int) Order::where(function ($q) {
                $q->where('status', 'cancelled')->orWhereNotNull('voided_at');
            })
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->count();

        $voidValue = (float) Order::where(function ($q) {
                $q->where('status', 'cancelled')->orWhereNotNull('voided_at');
            })
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->sum('total_amount');

        $categoryBreakdown = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('orders.status', 'completed')
            ->whereDate('orders.created_at', '>=', $startDate)
            ->whereDate('orders.created_at', '<=', $endDate)
            ->selectRaw("
                COALESCE(categories.name, 'Lainnya') as category_name,
                COALESCE(SUM(order_items.quantity), 0) as qty,
                COALESCE(SUM(order_items.subtotal), 0) as revenue,
                COALESCE(SUM(order_items.quantity * COALESCE(products.cost_price, 0)), 0) as cogs
            ")
            ->groupBy(DB::raw("COALESCE(categories.name, 'Lainnya')"))
            ->orderByDesc('revenue')
            ->get();

        $wastes = WasteRecord::with('ingredient:id,cost_per_unit')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->get();
        $wasteLoss = (float) $wastes->sum(fn ($w) => (float) ($w->ingredient->cost_per_unit ?? 0) * (float) $w->quantity);
        $wasteCount = $wastes->count();

        $opnames = StockMutation::with('ingredient:id,cost_per_unit')
            ->where('type', 'opname')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->get();
        $anomalyCount = 0;
        $opnameNetVariance = 0.0;
        foreach ($opnames as $op) {
            $before = (float) $op->stock_before;
            $after = (float) $op->stock_after;
            $diff = $after - $before;
            $pct = $before > 0 ? (abs($diff) / $before) * 100 : ($diff != 0 ? 100.0 : 0.0);
            if ($pct > 5.0) {
                $anomalyCount++;
            }
            $opnameNetVariance += $diff * (float) ($op->ingredient->cost_per_unit ?? 0);
        }

        $latestForecasts = $this->getLatestForecastSnapshots();
        $criticalCount = $latestForecasts->where('urgency_status', 'CRITICAL')->count();
        $warningCount = $latestForecasts->where('urgency_status', 'WARNING')->count();
        $reorderBudget = (float) $latestForecasts->sum('estimated_reorder_cost_rp');

        return [
            'pmCounts'          => $pmCounts,
            'otSummary'         => $otSummary,
            'activeDays'        => $activeDays,
            'voidCount'         => $voidCount,
            'voidValue'         => round($voidValue, 2),
            'categoryBreakdown' => $categoryBreakdown,
            'wasteLoss'         => round($wasteLoss, 2),
            'wasteCount'        => $wasteCount,
            'opnameCount'       => $opnames->count(),
            'anomalyCount'      => $anomalyCount,
            'opnameNetVariance' => round($opnameNetVariance, 2),
            'criticalCount'     => $criticalCount,
            'warningCount'      => $warningCount,
            'reorderBudget'     => round($reorderBudget, 2),
        ];
    }

    /**
     * SHEET 1: RINGKASAN EKSEKUTIF (Dashboard KPI, Rekonsiliasi Laba, Kategori & Grafik)
     */
    private function buildExecutiveSummarySheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $storeAddress,
        string $periodText,
        string $printedAt,
        array $summary,
        array $profitLoss,
        array $metrics,
    ): void {
        $sheet = $writer->addSheet('Ringkasan Eksekutif', '1B4332', [
            1 => 15, 2 => 15, 3 => 15, 4 => 20, 5 => 14, 6 => 22,
            7 => 3,
            8 => 15, 9 => 15, 10 => 15, 11 => 15, 12 => 15,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — LAPORAN KONSOLIDASI EKSEKUTIF',
            "Dashboard Keuangan, Laba Kotor, Operasional Dapur & AI Forecasting | {$storeAddress}",
            "Periode Audit: {$periodText}   |   Hari Operasional Aktif: {$metrics['activeDays']} Hari   |   Dicetak: {$printedAt}",
            12
        );

        $kpi = $summary['kpi'] ?? [];
        $netSales = (float) ($kpi['net_sales'] ?? 0);
        $grossSales = (float) ($kpi['gross_sales'] ?? 0);
        $totalDiscount = (float) ($kpi['total_discount'] ?? 0);
        $totalTax = (float) ($kpi['total_tax'] ?? 0);
        $totalOrders = (int) ($kpi['total_orders'] ?? 0);
        $aov = (float) ($kpi['average_order_value'] ?? 0);
        $cogs = (float) ($profitLoss['cost_of_goods_sold'] ?? 0);
        $grossProfit = (float) ($profitLoss['gross_profit'] ?? 0);
        $marginRatio = ((float) ($profitLoss['profit_margin_percent'] ?? 0)) / 100;

        // Grid 8 Kartu KPI Eksekutif (4 kolom lebar x 2 baris kartu di A:L)
        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL OMZET BERSIH (GRAND TOTAL)', 'v' => $netSales, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY],
            ['label' => 'LABA KOTOR (GROSS PROFIT)', 'v' => $grossProfit, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY],
            ['label' => 'TOTAL MODAL BAHAN (HPP)', 'v' => $cogs, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY],
            ['label' => 'MARGIN LABA KOTOR', 'v' => $marginRatio, 's' => XlsxWorkbookWriter::STYLE_KPI_PERCENT],
        ]);
        $sheet->addSpacerRow(6);

        $wasteLoss = (float) $metrics['wasteLoss'];
        $criticalCount = (int) $metrics['criticalCount'];
        $warningCount = (int) $metrics['warningCount'];
        $estAfterWaste = $grossProfit - $wasteLoss;

        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL PESANAN SELESAI', 'v' => $totalOrders, 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER],
            ['label' => 'RATA-RATA PER NOTA (AOV)', 'v' => $aov, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY],
            [
                'label' => "LIMBAH DAPUR ({$metrics['wasteCount']} KEJADIAN)",
                'v' => $wasteLoss,
                's' => $wasteLoss > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_CURRENCY : XlsxWorkbookWriter::STYLE_KPI_CURRENCY,
                'isDanger' => $wasteLoss > 0,
            ],
            [
                'label' => 'PERINGATAN STOK AI SAAT INI',
                'v' => "{$criticalCount} Kritis  /  {$warningCount} Pantau",
                's' => $criticalCount > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER : XlsxWorkbookWriter::STYLE_KPI_TEXT,
            ],
        ]);
        $sheet->addSpacerRow(12);

        // SECTION 1 (Kiri A:F): Rekonsiliasi Akuntansi Pendapatan & Laba Kotor
        $rSec1 = $sheet->addRow([['v' => '1. REKONSILIASI PENDAPATAN, PAJAK & LABA KOTOR', 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $sheet->fillStyleRange($rSec1, 1, 6, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        $sheet->merge("A{$rSec1}:F{$rSec1}");

        $h1 = $sheet->addRow([
            ['v' => 'Komponen Keuangan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nominal (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Rasio (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Keterangan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 24);
        $sheet->merge("A{$h1}:C{$h1}");

        $netBeforeTax = $grossSales - $totalDiscount;
        $reconRows = [
            ['Penjualan Menu Kotor (Subtotal Item)', $grossSales, 1.0, 'Total harga menu sebelum diskon & pajak', XlsxWorkbookWriter::STYLE_BOLD_TEXT, XlsxWorkbookWriter::STYLE_CURRENCY],
            ['(-) Total Diskon & Promo', -$totalDiscount, $this->safeRatio($totalDiscount, $grossSales), 'Potongan promo yang diberikan kasir/sistem', XlsxWorkbookWriter::STYLE_TEXT, XlsxWorkbookWriter::STYLE_SIGNED_CURRENCY],
            ['(=) Penjualan Bersih Sebelum Pajak', $netBeforeTax, $this->safeRatio($netBeforeTax, $grossSales), 'Dasar perhitungan pendapatan operasional kafe', XlsxWorkbookWriter::STYLE_SUB_LABEL, XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['(+) Pajak Restoran Terkumpul (PB1/PPN)', $totalTax, $this->safeRatio($totalTax, $netBeforeTax), 'Kewajiban pajak titipan pelanggan', XlsxWorkbookWriter::STYLE_TEXT, XlsxWorkbookWriter::STYLE_CURRENCY],
            ['(=) Total Kas & Pembayaran Diterima (Grand Total)', $netSales, $this->safeRatio($netSales, $grossSales), 'Total uang masuk Tunai + QRIS + Kartu + Transfer', XlsxWorkbookWriter::STYLE_TOTAL_LABEL, XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['(-) Estimasi Harga Pokok Penjualan (HPP)', -$cogs, $this->safeRatio($cogs, $grossSales), 'Biaya pokok bahan baku dari seluruh porsi terjual', XlsxWorkbookWriter::STYLE_TEXT, XlsxWorkbookWriter::STYLE_SIGNED_CURRENCY],
            ['(=) Laba Kotor Operasional (Gross Profit)', $grossProfit, $marginRatio, 'Penjualan Bersih Sebelum Pajak dikurangi HPP', XlsxWorkbookWriter::STYLE_TOTAL_LABEL, XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY],
            ['(-) Kerugian Limbah Bahan Baku (Waste)', -$wasteLoss, $this->safeRatio($wasteLoss, max(1, $grossSales)), 'Bahan kadaluwarsa, rusak, atau salah olah dapur', XlsxWorkbookWriter::STYLE_TEXT, XlsxWorkbookWriter::STYLE_LOSS_CURRENCY],
            ['(=) Estimasi Laba Kontribusi Dapur', $estAfterWaste, $this->safeRatio($estAfterWaste, $grossSales), 'Sebelum biaya tetap (sewa, listrik, gaji staf)', XlsxWorkbookWriter::STYLE_TOTAL_LABEL, XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
        ];

        foreach ($reconRows as $i => [$label, $amt, $pct, $desc, $lblStyle, $amtStyle]) {
            $isAlt = $i % 2 === 1;
            $r = $sheet->addRow([
                ['v' => $label, 's' => XlsxWorkbookWriter::zebra($lblStyle, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra($lblStyle, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra($lblStyle, $isAlt)],
                ['v' => round($amt, 2), 's' => XlsxWorkbookWriter::zebra($amtStyle, $isAlt), 't' => 'n'],
                ['v' => round($pct, 4), 's' => $lblStyle === XlsxWorkbookWriter::STYLE_TOTAL_LABEL ? XlsxWorkbookWriter::STYLE_TOTAL_PERCENT : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt), 't' => 'n'],
                ['v' => $desc, 's' => $lblStyle === XlsxWorkbookWriter::STYLE_TOTAL_LABEL ? XlsxWorkbookWriter::STYLE_SUB_LABEL : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
            ], 21);
            $sheet->merge("A{$r}:C{$r}");
        }
        $sheet->addSpacerRow(10);

        // SECTION 2 (Kiri A:F): Realisasi Metode Pembayaran (Sumber Chart 1)
        $rSec2 = $sheet->addRow([['v' => '2. REALISASI METODE PEMBAYARAN', 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $sheet->fillStyleRange($rSec2, 1, 6, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        $sheet->merge("A{$rSec2}:F{$rSec2}");

        $h2 = $sheet->addRow([
            ['v' => 'Metode Pembayaran', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Jml Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Nominal (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Rata-rata / Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 24);
        $sheet->merge("A{$h2}:B{$h2}");

        $pmRowsConfig = [
            'cash'     => 'Tunai (Cash)',
            'qris'     => 'QRIS Digital',
            'card'     => 'Kartu Debit/Kredit (EDC)',
            'transfer' => 'Transfer Bank',
        ];
        $pmStartRow = $sheet->nextRow;
        $pmEndRow = $pmStartRow + count($pmRowsConfig) - 1;
        $pmTotalRow = $pmEndRow + 1;

        $pmGrandTotal = 0.0;
        $pmGrandCount = 0;
        foreach ($pmRowsConfig as $code => $label) {
            $pmGrandTotal += (float) ($metrics['pmCounts'][$code]->amt ?? 0);
            $pmGrandCount += (int) ($metrics['pmCounts'][$code]->cnt ?? 0);
        }

        $idx = 0;
        foreach ($pmRowsConfig as $code => $label) {
            $cnt = (int) ($metrics['pmCounts'][$code]->cnt ?? 0);
            $amt = (float) ($metrics['pmCounts'][$code]->amt ?? 0);
            $avgPm = $cnt > 0 ? $amt / $cnt : 0.0;
            $share = $pmGrandTotal > 0 ? $amt / $pmGrandTotal : 0.0;
            $isAlt = ($idx++ % 2) === 1;
            $curRow = $sheet->nextRow;

            $r = $sheet->addRow([
                ['v' => $label, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $cnt, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => round($amt, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(D{$curRow}/\$D\${$pmTotalRow},0)", 'v' => round($share, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['f' => "IFERROR(D{$curRow}/C{$curRow},0)", 'v' => round($avgPm, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
            ], 20);
            $sheet->merge("A{$r}:B{$r}");
        }

        $rPmTot = $sheet->addRow([
            ['v' => 'TOTAL PEMBAYARAN MASUK', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(C{$pmStartRow}:C{$pmEndRow})", 'v' => $pmGrandCount, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
            ['f' => "SUM(D{$pmStartRow}:D{$pmEndRow})", 'v' => round($pmGrandTotal, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => $pmGrandTotal > 0 ? 1.0 : 0.0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT, 't' => 'n'],
            ['f' => "IFERROR(D{$pmTotalRow}/C{$pmTotalRow},0)", 'v' => $pmGrandCount > 0 ? round($pmGrandTotal / $pmGrandCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
        ], 22);
        $sheet->merge("A{$rPmTot}:B{$rPmTot}");
        $sheet->addSpacerRow(10);

        // SECTION 3 (Kiri A:F): Distribusi Tipe Pesanan
        $rSec3 = $sheet->addRow([['v' => '3. DISTRIBUSI TIPE PESANAN', 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $sheet->fillStyleRange($rSec3, 1, 6, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        $sheet->merge("A{$rSec3}:F{$rSec3}");

        $h3 = $sheet->addRow([
            ['v' => 'Saluran Pemesanan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Jml Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Omzet (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Nota (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Rata-rata / Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 24);
        $sheet->merge("A{$h3}:B{$h3}");

        $otRowsConfig = [
            'dine_in'  => 'Makan di Tempat (Dine-In)',
            'takeaway' => 'Bungkus (Takeaway)',
            'delivery' => 'Pesan Antar (Delivery)',
        ];
        $otStartRow = $sheet->nextRow;
        $otEndRow = $otStartRow + count($otRowsConfig) - 1;
        $otTotalRow = $otEndRow + 1;
        $otGrandCount = 0;
        $otGrandAmt = 0.0;
        foreach ($otRowsConfig as $code => $label) {
            $otGrandCount += (int) ($metrics['otSummary'][$code]->cnt ?? 0);
            $otGrandAmt += (float) ($metrics['otSummary'][$code]->amt ?? 0);
        }

        $idx = 0;
        foreach ($otRowsConfig as $code => $label) {
            $cnt = (int) ($metrics['otSummary'][$code]->cnt ?? 0);
            $amt = (float) ($metrics['otSummary'][$code]->amt ?? 0);
            $share = $otGrandCount > 0 ? $cnt / $otGrandCount : 0.0;
            $avgOt = $cnt > 0 ? $amt / $cnt : 0.0;
            $isAlt = ($idx++ % 2) === 1;
            $curRow = $sheet->nextRow;

            $r = $sheet->addRow([
                ['v' => $label, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $cnt, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => round($amt, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(C{$curRow}/\$C\${$otTotalRow},0)", 'v' => round($share, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['f' => "IFERROR(D{$curRow}/C{$curRow},0)", 'v' => round($avgOt, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
            ], 20);
            $sheet->merge("A{$r}:B{$r}");
        }

        $rOtTot = $sheet->addRow([
            ['v' => 'TOTAL PESANAN SELESAI', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(C{$otStartRow}:C{$otEndRow})", 'v' => $otGrandCount, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
            ['f' => "SUM(D{$otStartRow}:D{$otEndRow})", 'v' => round($otGrandAmt, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => $otGrandCount > 0 ? 1.0 : 0.0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT, 't' => 'n'],
            ['f' => "IFERROR(D{$otTotalRow}/C{$otTotalRow},0)", 'v' => $otGrandCount > 0 ? round($otGrandAmt / $otGrandCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
        ], 22);
        $sheet->merge("A{$rOtTot}:B{$rOtTot}");
        $sheet->addSpacerRow(10);

        // SECTION 4 (Kiri A:F): Ringkasan Kinerja per Kategori Menu (Sumber Chart 2)
        $rSec4 = $sheet->addRow([['v' => '4. KINERJA PENJUALAN & MARGIN PER KATEGORI MENU', 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $sheet->fillStyleRange($rSec4, 1, 6, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        $sheet->merge("A{$rSec4}:F{$rSec4}");

        $sheet->addRow([
            ['v' => 'Kategori Menu', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Qty Terjual', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Omzet', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total HPP', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Margin (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Laba Kotor (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 24);

        $categories = $metrics['categoryBreakdown'];
        $catStartRow = $sheet->nextRow;
        if ($categories->isEmpty()) {
            $this->addEmptyStateNotice($sheet, 'Belum ada data penjualan kategori pada periode ini.', 6);
        } else {
            $sumQty = 0;
            $sumRev = 0.0;
            $sumCogs = 0.0;
            $sumGp = 0.0;
            foreach ($categories as $idx => $cat) {
                $qty = (int) $cat->qty;
                $rev = round((float) $cat->revenue, 2);
                $catCogs = round((float) $cat->cogs, 2);
                $gp = round($rev - $catCogs, 2);
                $margin = $rev > 0 ? $gp / $rev : 0.0;
                $isAlt = ($idx % 2) === 1;
                $curRow = $sheet->nextRow;

                $sumQty += $qty;
                $sumRev += $rev;
                $sumCogs += $catCogs;
                $sumGp += $gp;

                $sheet->addRow([
                    ['v' => $cat->category_name, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                    ['v' => $qty, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                    ['v' => $rev, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => $catCogs, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['f' => "IFERROR(F{$curRow}/C{$curRow},0)", 'v' => round($margin, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                    ['f' => "C{$curRow}-D{$curRow}", 'v' => $gp, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY, $isAlt)],
                ], 20);
            }
            $catEndRow = $sheet->nextRow - 1;
            $catTotRow = $sheet->nextRow;
            $sheet->addRow([
                ['v' => 'TOTAL SEMUA KATEGORI', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['f' => "SUM(B{$catStartRow}:B{$catEndRow})", 'v' => $sumQty, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
                ['f' => "SUM(C{$catStartRow}:C{$catEndRow})", 'v' => round($sumRev, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(D{$catStartRow}:D{$catEndRow})", 'v' => round($sumCogs, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "IFERROR(F{$catTotRow}/C{$catTotRow},0)", 'v' => $sumRev > 0 ? round($sumGp / $sumRev, 4) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT],
                ['f' => "SUM(F{$catStartRow}:F{$catEndRow})", 'v' => round($sumGp, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ], 22);
        }

        $sheet->addSpacerRow(10);

        // SECTION 5 (Kiri A:F): Indikator Risiko & Panduan 9 Tab
        $rSec5 = $sheet->addRow([['v' => '5. RINGKASAN KESEHATAN OPERASIONAL & RISIKO AUDIT', 's' => XlsxWorkbookWriter::STYLE_SECTION_HEADER]], 23);
        $sheet->fillStyleRange($rSec5, 1, 6, XlsxWorkbookWriter::STYLE_SECTION_HEADER);
        $sheet->merge("A{$rSec5}:F{$rSec5}");

        $riskItems = [
            [
                'Transaksi Dibatalkan (Void)',
                $metrics['voidCount'] . ' nota (' . 'Rp ' . number_format($metrics['voidValue'], 0, ',', '.') . ')',
                $metrics['voidCount'] > 0 ? ['v' => 'PERLU CEK', 's' => XlsxWorkbookWriter::STYLE_BADGE_WARNING] : ['v' => 'BERSIH', 's' => XlsxWorkbookWriter::STYLE_BADGE_SUCCESS],
                'Lihat Tab #5 (Performa Kasir) & #9 (Rincian Transaksi)',
            ],
            [
                'Anomali Stok Opname (>5%)',
                "{$metrics['anomalyCount']} temuan dari {$metrics['opnameCount']} audit",
                $metrics['anomalyCount'] > 0 ? ['v' => 'ANOMALI', 's' => XlsxWorkbookWriter::STYLE_BADGE_DANGER] : ['v' => 'TERKENDALI', 's' => XlsxWorkbookWriter::STYLE_BADGE_SUCCESS],
                'Selisih fisik vs sistem melebihi ambang batas 5% (Tab #7)',
            ],
            [
                'Anggaran Belanja AI (PO Saran)',
                'Rp ' . number_format($metrics['reorderBudget'], 0, ',', '.'),
                $metrics['criticalCount'] > 0 ? ['v' => "{$metrics['criticalCount']} KRITIS", 's' => XlsxWorkbookWriter::STYLE_BADGE_DANGER] : ['v' => 'STOK AMAN', 's' => XlsxWorkbookWriter::STYLE_BADGE_SUCCESS],
                'Estimasi biaya restok bahan berstatus Kritis/Pantau (Tab #8)',
            ],
        ];
        foreach ($riskItems as $idx => [$title, $valText, $badge, $note]) {
            $isAlt = $idx % 2 === 1;
            $r = $sheet->addRow([
                ['v' => $title, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $valText, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => '', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                $badge,
                ['v' => $note, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
            ], 21);
            $sheet->merge("A{$r}:B{$r}");
            $sheet->merge("C{$r}:D{$r}");
        }

        // Charts sebelah kanan (Cols H:L, mulai row 10 agar rapi sejajar di samping tabel!)
        if ($pmGrandTotal > 0) {
            $sheet->addChart([
                'type'            => 'doughnut',
                'title'           => 'Komposisi Pembayaran Pelanggan (Rp)',
                'anchorCol'       => 7, // Col H (0-based 7)
                'anchorRow'       => 10, // Row 11 (0-based 10)
                'widthPx'         => 520,
                'heightPx'        => 295,
                'legendPos'       => 'r',
                'categoriesRange' => $sheet->absRange(1, $pmStartRow, 1, $pmEndRow),
                'series'          => [[
                    'name'        => 'Total Nominal (Rp)',
                    'valuesRange' => $sheet->absRange(4, $pmStartRow, 4, $pmEndRow),
                ]],
            ]);
        }

        if ($categories->isNotEmpty()) {
            $catChartEndRow = min($sheet->nextRow, $catStartRow + $categories->count() - 1);
            $sheet->addChart([
                'type'            => 'col',
                'title'           => 'Omzet vs Laba Kotor per Kategori Menu',
                'anchorCol'       => 7,
                'anchorRow'       => 26,
                'widthPx'         => 520,
                'heightPx'        => 320,
                'yAxisCurrency'   => true,
                'legendPos'       => 'b',
                'categoriesRange' => $sheet->absRange(1, $catStartRow, 1, $catChartEndRow),
                'series'          => [
                    [
                        'name'        => 'Total Omzet',
                        'valuesRange' => $sheet->absRange(3, $catStartRow, 3, $catChartEndRow),
                        'color'       => '1B4332',
                    ],
                    [
                        'name'        => 'Laba Kotor',
                        'valuesRange' => $sheet->absRange(6, $catStartRow, 6, $catChartEndRow),
                        'color'       => '10B981',
                    ],
                ],
            ]);
        }
    }

    /**
     * SHEET 2: LABA RUGI & HPP PRODUK
     */
    private function buildProfitLossSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
        array $profitLoss,
        float $wasteLoss,
    ): void {
        $sheet = $writer->addSheet('Laba Rugi & HPP', '1D4ED8', [
            1 => 6, 2 => 17, 3 => 28, 4 => 12, 5 => 16, 6 => 16, 7 => 15,
            8 => 19, 9 => 18, 10 => 19, 11 => 12, 12 => 13, 13 => 20,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — ANALISIS LABA RUGI & HPP PRODUK',
            'Evaluasi Profitabilitas Menu, Harga Pokok Penjualan (HPP), Margin Kotor & Kontribusi Laba',
            "Periode: {$periodText}   |   Diurutkan dari Kontribusi Laba Tertinggi   |   Dicetak: {$printedAt}",
            13
        );

        $totalItemRevenue = (float) ($profitLoss['total_revenue'] ?? 0);
        $totalDiscounts = (float) ($profitLoss['total_discounts'] ?? 0);
        $totalCogs = (float) ($profitLoss['cost_of_goods_sold'] ?? 0);
        $grossProfitAfterDiscount = (float) ($profitLoss['gross_profit'] ?? 0);

        $this->addKpiGridRow($sheet, [
            ['label' => 'OMZET MENU (SEBELUM DISKON)', 'v' => $totalItemRevenue, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'TOTAL DISKON NOTA', 'v' => $totalDiscounts, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'TOTAL MODAL BAHAN (HPP)', 'v' => $totalCogs, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'LABA KOTOR BERSIH PERIODE', 'v' => $grossProfitAfterDiscount, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
        ]);
        $sheet->addSpacerRow(8);

        $items = OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->with(['product.category'])
            ->get()
            ->groupBy('product_id');

        // Hitung dan urutkan berdasarkan Laba Kotor tertinggi
        $rows = [];
        $sumQty = 0;
        $sumRev = 0.0;
        $sumCogs = 0.0;
        $sumGp = 0.0;

        foreach ($items as $group) {
            $first = $group->first();
            $product = $first->product;
            $qty = (int) $group->sum('quantity');
            $revenue = round((float) $group->sum('subtotal'), 2);
            $price = (float) ($product->price ?? 0);
            $cogsUnit = (float) ($product->cost_price ?? 0);
            $totalCogsRow = round($cogsUnit * $qty, 2);
            $gp = round($revenue - $totalCogsRow, 2);

            $rows[] = [
                'category'  => $product->category->name ?? 'Tanpa Kategori',
                'name'      => $product->name ?? ('Produk #' . $first->product_id),
                'qty'       => $qty,
                'price'     => $price,
                'effPrice'  => $qty > 0 ? round($revenue / $qty, 2) : 0.0,
                'cogsUnit'  => $cogsUnit,
                'revenue'   => $revenue,
                'totalCogs' => $totalCogsRow,
                'gp'        => $gp,
                'margin'    => $revenue > 0 ? $gp / $revenue : 0.0,
            ];

            $sumQty += $qty;
            $sumRev += $revenue;
            $sumCogs += $totalCogsRow;
            $sumGp += $gp;
        }

        usort($rows, fn ($a, $b) => $b['gp'] <=> $a['gp']);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Kategori', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nama Produk', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Qty Terjual', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Harga Katalog', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Harga Efektif', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'HPP / Unit', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Omzet Item', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total HPP', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Laba Kotor Item', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Margin (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Laba (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Status Margin', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);

        $sheet->setFreezePane($headerRow, 0);

        if ($rows === []) {
            $this->addEmptyStateNotice($sheet, 'Belum ada data penjualan produk selesai pada periode terpilih.', 13);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + count($rows) - 1;
        $totalRow = $endDataRow + 1;
        $sheet->setAutoFilter("A{$headerRow}:M{$endDataRow}");

        foreach ($rows as $idx => $item) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $shareProfit = $sumGp != 0.0 ? $item['gp'] / $sumGp : 0.0;

            if ($item['gp'] < 0) {
                $statusBadge = ['v' => 'RUGI', 's' => XlsxWorkbookWriter::STYLE_BADGE_DANGER];
            } elseif ($item['margin'] >= 0.55) {
                $statusBadge = ['v' => 'SANGAT SEHAT', 's' => XlsxWorkbookWriter::STYLE_BADGE_SUCCESS];
            } elseif ($item['margin'] >= 0.35) {
                $statusBadge = ['v' => 'SEHAT', 's' => XlsxWorkbookWriter::STYLE_BADGE_INFO];
            } else {
                $statusBadge = ['v' => 'MARGIN TIPIS', 's' => XlsxWorkbookWriter::STYLE_BADGE_WARNING];
            }

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $item['category'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $item['name'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $item['qty'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => $item['price'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(H{$rNum}/D{$rNum},0)", 'v' => $item['effPrice'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
                ['v' => $item['cogsUnit'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $item['revenue'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "D{$rNum}*G{$rNum}", 'v' => $item['totalCogs'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
                ['f' => "H{$rNum}-I{$rNum}", 'v' => $item['gp'], 's' => XlsxWorkbookWriter::zebra($item['gp'] >= 0 ? XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY : XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, $isAlt)],
                ['f' => "IFERROR(J{$rNum}/H{$rNum},0)", 'v' => round($item['margin'], 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['f' => "IFERROR(J{$rNum}/\$J\${$totalRow},0)", 'v' => round($shareProfit, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                $statusBadge,
            ], 21);
        }

        // Total Row Produk
        $overallMargin = $sumRev > 0 ? $sumGp / $sumRev : 0.0;
        $sheet->addRow([
            ['v' => 'TOTAL PRODUK (SEBELUM DISKON NOTA)', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(D{$startDataRow}:D{$endDataRow})", 'v' => $sumQty, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(H{$startDataRow}:H{$endDataRow})", 'v' => round($sumRev, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(I{$startDataRow}:I{$endDataRow})", 'v' => round($sumCogs, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(J{$startDataRow}:J{$endDataRow})", 'v' => round($sumGp, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "IFERROR(J{$totalRow}/H{$totalRow},0)", 'v' => round($overallMargin, 4), 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT],
            ['v' => 1.0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT, 't' => 'n'],
            ['v' => count($rows) . ' Menu', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 24);
        $sheet->merge("A{$totalRow}:C{$totalRow}");

        // Penyesuaian Diskon & Limbah ke Laba Kotor Riil
        $rDisc = $sheet->addRow([
            ['v' => '(-) Total Diskon & Promo Nota pada Periode', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => -$totalDiscounts, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY, 't' => 'n'],
            ['v' => 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY, 't' => 'n'],
            ['v' => -$totalDiscounts, 's' => XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, 't' => 'n'],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => 'Penyesuaian', 's' => XlsxWorkbookWriter::STYLE_BADGE_NEUTRAL],
        ], 21);
        $sheet->merge("A{$rDisc}:G{$rDisc}");

        $netRevAfterDisc = round($sumRev - $totalDiscounts, 2);
        $realGp = round($sumGp - $totalDiscounts, 2);
        $realMargin = $sumRev > 0 ? $realGp / $sumRev : 0.0;
        $rNetGpRow = $sheet->nextRow;
        $rNetGp = $sheet->addRow([
            ['v' => 'LABA KOTOR RIIL PERIODE (SETELAH DISKON NOTA)', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "H{$totalRow}+H{$rDisc}", 'v' => $netRevAfterDisc, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "I{$totalRow}", 'v' => round($sumCogs, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "J{$totalRow}+J{$rDisc}", 'v' => $realGp, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "IFERROR(J{$rNetGpRow}/H{$totalRow},0)", 'v' => round($realMargin, 4), 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => $wasteLoss > 0 ? 'Waste: -Rp ' . number_format($wasteLoss, 0, ',', '.') : 'Tanpa Waste', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 24);
        $sheet->merge("A{$rNetGp}:G{$rNetGp}");

        // Grafik Top 10 Laba Kotor vs Total HPP di bawah tabel
        $chartLimit = min(10, count($rows));
        if ($chartLimit > 0) {
            $chartEndRow = $startDataRow + $chartLimit - 1;
            $sheet->addSpacerRow(10);
            $sheet->addChart([
                'type'            => 'bar',
                'title'           => "Top {$chartLimit} Produk Penyumbang Laba Kotor Tertinggi vs HPP",
                'anchorCol'       => 1,
                'anchorRow'       => $sheet->nextRow,
                'widthPx'         => 880,
                'heightPx'        => 360,
                'yAxisCurrency'   => true,
                'legendPos'       => 'b',
                'categoriesRange' => $sheet->absRange(3, $startDataRow, 3, $chartEndRow),
                'series'          => [
                    [
                        'name'        => 'Laba Kotor (Rp)',
                        'valuesRange' => $sheet->absRange(10, $startDataRow, 10, $chartEndRow),
                        'color'       => '059669',
                    ],
                    [
                        'name'        => 'Total HPP (Rp)',
                        'valuesRange' => $sheet->absRange(9, $startDataRow, 9, $chartEndRow),
                        'color'       => 'F59E0B',
                    ],
                ],
            ]);
        }
    }

    /**
     * SHEET 3: TREN OMZET HARIAN (Urut Kronologis + Breakdown Tunai vs Non-Tunai + Grafik)
     */
    private function buildDailyRevenueSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Tren Omzet Harian', 'D97706', [
            1 => 14, 2 => 13, 3 => 11, 4 => 18, 5 => 15, 6 => 15,
            7 => 18, 8 => 19, 9 => 20, 10 => 17, 11 => 16,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — TREN PENDAPATAN & OMZET HARIAN',
            'Arus Kas Harian, Pecahan Tunai vs Non-Tunai, Rata-rata Nota (AOV) & Pertumbuhan Harian',
            "Periode: {$periodText}   |   Urutan Kronologis (Untuk Analisis Grafik Tren)   |   Dicetak: {$printedAt}",
            11
        );

        $rows = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('COALESCE(SUM(subtotal), 0) as total_subtotal'),
                DB::raw('COALESCE(SUM(discount_amount), 0) as total_discount'),
                DB::raw('COALESCE(SUM(tax_amount), 0) as total_tax'),
                DB::raw("COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_revenue"),
                DB::raw("COALESCE(SUM(CASE WHEN payment_method != 'cash' OR payment_method IS NULL THEN total_amount ELSE 0 END), 0) as non_cash_revenue"),
                DB::raw('COALESCE(SUM(total_amount), 0) as net_revenue')
            )
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        $daysCount = $rows->count();
        $totOrders = (int) $rows->sum('total_orders');
        $totNet = (float) $rows->sum('net_revenue');
        $avgDaily = $daysCount > 0 ? $totNet / $daysCount : 0.0;
        $peakDaily = $daysCount > 0 ? (float) $rows->max('net_revenue') : 0.0;

        $this->addKpiGridRow($sheet, [
            ['label' => 'HARI OPERASIONAL', 'v' => $daysCount, 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 2],
            ['label' => 'TOTAL OMZET BERSIH', 'v' => round($totNet, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'RATA-RATA OMZET / HARI', 'v' => round($avgDaily, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'OMZET TERTINGGI (PEAK DAY)', 'v' => round($peakDaily, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'Tanggal', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Hari', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Jml Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Penjualan Kotor', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Diskon', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Pajak (PB1)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Tunai (Cash)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Non-Tunai (QRIS/EDC/TF)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Omzet Bersih', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Rata-rata Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Pertumbuhan H-1', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($rows->isEmpty()) {
            $this->addEmptyStateNotice($sheet, 'Belum ada transaksi harian selesai pada rentang tanggal ini.', 11);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + $daysCount - 1;
        $sheet->setAutoFilter("A{$headerRow}:K{$endDataRow}");

        $prevNet = null;
        foreach ($rows as $idx => $r) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $orders = (int) $r->total_orders;
            $net = round((float) $r->net_revenue, 2);
            $aovDay = $orders > 0 ? round($net / $orders, 2) : 0.0;
            $dayName = $this->indonesianDayName($r->date);

            if ($prevNet !== null && $prevNet > 0) {
                $growth = ($net - $prevNet) / $prevNet;
                $growthCell = [
                    'f' => "IFERROR((I{$rNum}-I" . ($rNum - 1) . ')/I' . ($rNum - 1) . ',0)',
                    'v' => round($growth, 4),
                    's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt),
                ];
            } else {
                $growthCell = ['v' => '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)];
            }
            $prevNet = $net;

            $sheet->addRow([
                ['v' => $r->date, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $dayName, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $orders, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => round((float) $r->total_subtotal, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => round((float) $r->total_discount, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => round((float) $r->total_tax, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => round((float) $r->cash_revenue, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => round((float) $r->non_cash_revenue, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $net, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(I{$rNum}/C{$rNum},0)", 'v' => $aovDay, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
                $growthCell,
            ], 20);
        }

        // Total Row + Rata-rata Harian + Puncak Harian
        $totRow = $sheet->nextRow;
        $sheet->addRow([
            ['v' => 'TOTAL KESELURUHAN', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => "{$daysCount} Hari", 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
            ['f' => "SUM(C{$startDataRow}:C{$endDataRow})", 'v' => $totOrders, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
            ['f' => "SUM(D{$startDataRow}:D{$endDataRow})", 'v' => round((float) $rows->sum('total_subtotal'), 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(E{$startDataRow}:E{$endDataRow})", 'v' => round((float) $rows->sum('total_discount'), 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(F{$startDataRow}:F{$endDataRow})", 'v' => round((float) $rows->sum('total_tax'), 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(G{$startDataRow}:G{$endDataRow})", 'v' => round((float) $rows->sum('cash_revenue'), 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(H{$startDataRow}:H{$endDataRow})", 'v' => round((float) $rows->sum('non_cash_revenue'), 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "SUM(I{$startDataRow}:I{$endDataRow})", 'v' => round($totNet, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['f' => "IFERROR(I{$totRow}/C{$totRow},0)", 'v' => $totOrders > 0 ? round($totNet / $totOrders, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
        ], 23);

        $sheet->addRow([
            ['v' => 'RATA-RATA PER HARI', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
            ['f' => "AVERAGE(C{$startDataRow}:C{$endDataRow})", 'v' => $daysCount > 0 ? round($totOrders / $daysCount, 1) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_INTEGER],
            ['f' => "AVERAGE(D{$startDataRow}:D{$endDataRow})", 'v' => $daysCount > 0 ? round((float) $rows->sum('total_subtotal') / $daysCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(E{$startDataRow}:E{$endDataRow})", 'v' => $daysCount > 0 ? round((float) $rows->sum('total_discount') / $daysCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(F{$startDataRow}:F{$endDataRow})", 'v' => $daysCount > 0 ? round((float) $rows->sum('total_tax') / $daysCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(G{$startDataRow}:G{$endDataRow})", 'v' => $daysCount > 0 ? round((float) $rows->sum('cash_revenue') / $daysCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(H{$startDataRow}:H{$endDataRow})", 'v' => $daysCount > 0 ? round((float) $rows->sum('non_cash_revenue') / $daysCount, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(I{$startDataRow}:I{$endDataRow})", 'v' => round($avgDaily, 2), 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['f' => "AVERAGE(J{$startDataRow}:J{$endDataRow})", 'v' => round((float) $rows->avg(fn ($x) => $x->total_orders > 0 ? $x->net_revenue / $x->total_orders : 0), 2), 's' => XlsxWorkbookWriter::STYLE_SUB_CURRENCY],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_SUB_LABEL],
        ], 20);

        $sheet->addSpacerRow(10);
        $sheet->addChart([
            'type'            => 'line',
            'title'           => 'Grafik Tren Omzet Bersih Harian (Rp)',
            'anchorCol'       => 0,
            'anchorRow'       => $sheet->nextRow,
            'widthPx'         => 920,
            'heightPx'        => 320,
            'yAxisCurrency'   => true,
            'legendPos'       => 'b',
            'categoriesRange' => $sheet->absRange(1, $startDataRow, 1, $endDataRow),
            'series'          => [
                [
                    'name'        => 'Omzet Bersih Harian',
                    'valuesRange' => $sheet->absRange(9, $startDataRow, 9, $endDataRow),
                    'color'       => '1B4332',
                ],
                [
                    'name'        => 'Non-Tunai (QRIS/EDC/TF)',
                    'valuesRange' => $sheet->absRange(8, $startDataRow, 8, $endDataRow),
                    'color'       => '0284C7',
                ],
            ],
        ]);
    }

    /**
     * SHEET 4: PERINGKAT MENU TERLARIS (Pareto ABC + Grafik Horizontal Bar Top 10)
     */
    private function buildTopProductsSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Menu Terlaris', '7C3AED', [
            1 => 8, 2 => 28, 3 => 18, 4 => 14, 5 => 13, 6 => 17, 7 => 20, 8 => 14, 9 => 16, 10 => 22,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — PERINGKAT MENU TERLARIS & ANALISIS PARETO (ABC)',
            'Identifikasi Menu Andalan (Kelas A = 70% Omzet Pertama), Volume Porsi & Kontribusi Revenue',
            "Periode: {$periodText}   |   Maksimal Top 50 Produk Terlaris   |   Dicetak: {$printedAt}",
            10
        );

        $items = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->with(['product.category'])
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->orderByDesc('total_revenue')
            ->take(50)
            ->get();

        $sumQty = (int) $items->sum('total_sold');
        $sumRev = (float) $items->sum('total_revenue');

        // Hitung ranking Pareto berdasarkan kontribusi omzet terurut sementara
        $revSorted = $items->sortByDesc('total_revenue')->values();
        $paretoClassByProductId = [];
        $cumRevForAbc = 0.0;
        $classACount = 0;
        foreach ($revSorted as $revItem) {
            $cumRevForAbc += (float) $revItem->total_revenue;
            $cumPctAbc = $sumRev > 0 ? $cumRevForAbc / $sumRev : 1.0;
            if ($cumPctAbc <= 0.70) {
                $classACount++;
                $paretoClassByProductId[$revItem->product_id] = ['KELAS A (Menu Inti)', XlsxWorkbookWriter::STYLE_BADGE_SUCCESS];
            } elseif ($cumPctAbc <= 0.90) {
                $paretoClassByProductId[$revItem->product_id] = ['KELAS B (Menengah)', XlsxWorkbookWriter::STYLE_BADGE_INFO];
            } else {
                $paretoClassByProductId[$revItem->product_id] = ['KELAS C (Pelengkap)', XlsxWorkbookWriter::STYLE_BADGE_NEUTRAL];
            }
        }

        $topName = $items->first()?->product?->name ?? '-';
        $this->addKpiGridRow($sheet, [
            ['label' => 'MENU JUARA (#1 TERLARIS)', 'v' => $topName, 's' => XlsxWorkbookWriter::STYLE_KPI_TEXT, 'cols' => 3],
            ['label' => 'TOTAL PORSI TERJUAL', 'v' => $sumQty, 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 2],
            ['label' => 'TOTAL OMZET TOP MENU', 'v' => round($sumRev, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'MENU INTI PARETO (KELAS A)', 'v' => "{$classACount} dari " . $items->count() . ' Menu', 's' => XlsxWorkbookWriter::STYLE_KPI_TEXT, 'cols' => 2],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'Rank', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nama Produk', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Kategori', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Qty Terjual', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Qty (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Harga Katalog', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Omzet (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Omzet (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Kumulatif Omzet', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Klasifikasi Pareto (ABC)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($items->isEmpty()) {
            $this->addEmptyStateNotice($sheet, 'Belum ada data produk terjual pada periode ini.', 10);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + $items->count() - 1;
        $totalRow = $endDataRow + 1;
        $sheet->setAutoFilter("A{$headerRow}:J{$endDataRow}");

        $runningRev = 0.0;
        foreach ($items as $idx => $item) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $product = $item->product;
            $qty = (int) $item->total_sold;
            $rev = round((float) $item->total_revenue, 2);
            $runningRev += $rev;

            $qtyShare = $sumQty > 0 ? $qty / $sumQty : 0.0;
            $revShare = $sumRev > 0 ? $rev / $sumRev : 0.0;
            $cumPct = $sumRev > 0 ? $runningRev / $sumRev : 0.0;
            [$abcLabel, $abcStyle] = $paretoClassByProductId[$item->product_id] ?? ['KELAS C (Pelengkap)', XlsxWorkbookWriter::STYLE_BADGE_NEUTRAL];

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $product->name ?? ('Produk #' . $item->product_id), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $product->category->name ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $qty, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(D{$rNum}/\$D\${$totalRow},0)", 'v' => round($qtyShare, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['v' => (float) ($product->price ?? 0), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $rev, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "IFERROR(G{$rNum}/\$G\${$totalRow},0)", 'v' => round($revShare, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['f' => "SUM(\$H\${$startDataRow}:H{$rNum})", 'v' => round($cumPct, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['v' => $abcLabel, 's' => $abcStyle],
            ], 21);
        }

        $rTot = $sheet->addRow([
            ['v' => 'TOTAL KESELURUHAN', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(D{$startDataRow}:D{$endDataRow})", 'v' => $sumQty, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
            ['v' => 1.0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT, 't' => 'n'],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(G{$startDataRow}:G{$endDataRow})", 'v' => round($sumRev, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => 1.0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT, 't' => 'n'],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => $items->count() . ' Produk', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 23);
        $sheet->merge("A{$rTot}:C{$rTot}");

        $chartCount = min(10, $items->count());
        if ($chartCount > 0) {
            $chartEnd = $startDataRow + $chartCount - 1;
            $sheet->addSpacerRow(10);
            $sheet->addChart([
                'type'            => 'bar',
                'title'           => "Top {$chartCount} Menu Terlaris Berdasarkan Omzet (Rp)",
                'anchorCol'       => 0,
                'anchorRow'       => $sheet->nextRow,
                'widthPx'         => 860,
                'heightPx'        => 340,
                'yAxisCurrency'   => true,
                'legendPos'       => 'b',
                'categoriesRange' => $sheet->absRange(2, $startDataRow, 2, $chartEnd),
                'series'          => [[
                    'name'        => 'Total Omzet (Rp)',
                    'valuesRange' => $sheet->absRange(7, $startDataRow, 7, $chartEnd),
                    'color'       => '7C3AED',
                ]],
            ]);
        }
    }

    /**
     * SHEET 5: PERFORMA & AKUNTABILITAS KASIR + AUDIT SHIFT
     */
    private function buildCashierPerformanceSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Performa Kasir', '4338CA', [
            1 => 6, 2 => 22, 3 => 24, 4 => 13, 5 => 12, 6 => 14,
            7 => 17, 8 => 19, 9 => 19, 10 => 20, 11 => 15, 12 => 17, 13 => 19,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — PERFORMA & AKUNTABILITAS KASIR / STAF',
            'Rekapitulasi Omzet per Staf, Pemantauan Nota Void, Diskon & Selisih Laci Kas Shift',
            "Periode: {$periodText}   |   Selisih Kas Shift Negatif (-) Menandakan Kekurangan Kas Fisik   |   Dicetak: {$printedAt}",
            13
        );

        // Agregasi SQL tunggal untuk semua order selesai & void per user (bebas N+1)
        $orderAgg = Order::selectRaw("
                user_id,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = 'cancelled' OR voided_at IS NOT NULL THEN 1 ELSE 0 END) as void_count,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN discount_amount ELSE 0 END), 0) as total_discount,
                COALESCE(SUM(CASE WHEN status = 'completed' AND payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_rev,
                COALESCE(SUM(CASE WHEN status = 'completed' AND (payment_method != 'cash' OR payment_method IS NULL) THEN total_amount ELSE 0 END), 0) as non_cash_rev
            ")
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $shiftDiffAgg = Shift::selectRaw('user_id, COUNT(*) as total_shifts, COALESCE(SUM(COALESCE(cash_difference, 0)), 0) as total_diff')
            ->where('status', 'closed')
            ->whereDate('opened_at', '>=', $startDate)
            ->whereDate('opened_at', '<=', $endDate)
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        $users = User::select('id', 'name', 'email', 'role')->get()
            ->filter(function ($u) use ($orderAgg) {
                $agg = $orderAgg->get($u->id);
                $hasActivity = $agg && ((int) $agg->completed_count > 0 || (int) $agg->void_count > 0);
                return $hasActivity || in_array($u->role, ['cashier', 'admin', 'superadmin'], true);
            })
            ->sortByDesc(fn ($u) => (float) ($orderAgg->get($u->id)->cash_rev ?? 0) + (float) ($orderAgg->get($u->id)->non_cash_rev ?? 0))
            ->values();

        $totalStaffRevenue = (float) $users->sum(fn ($u) => (float) ($orderAgg->get($u->id)->cash_rev ?? 0) + (float) ($orderAgg->get($u->id)->non_cash_rev ?? 0));
        $totalVoidStaff = (int) $users->sum(fn ($u) => (int) ($orderAgg->get($u->id)->void_count ?? 0));
        $totalShiftVarianceAll = (float) $users->sum(fn ($u) => (float) ($shiftDiffAgg->get($u->id)->total_diff ?? 0));

        $this->addKpiGridRow($sheet, [
            ['label' => 'STAF TERPANTAU', 'v' => $users->count() . ' Akun', 's' => XlsxWorkbookWriter::STYLE_KPI_TEXT, 'cols' => 3],
            ['label' => 'TOTAL OMZET KASIR', 'v' => round($totalStaffRevenue, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
            ['label' => 'TOTAL NOTA VOID / BATAL', 'v' => $totalVoidStaff, 's' => $totalVoidStaff > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_NUMBER : XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'AKUMULASI SELISIH SHIFT', 'v' => round($totalShiftVarianceAll, 2), 's' => $totalShiftVarianceAll < 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_CURRENCY : XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nama Staf', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Email Akun', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Peran', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nota Selesai', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nota Void/Batal', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Diskon', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Omzet Tunai', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Omzet Non-Tunai', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Omzet', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Non-Tunai', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Rata-rata Nota', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Akum. Selisih Shift', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + max(0, $users->count() - 1);
        if ($users->isNotEmpty()) {
            $sheet->setAutoFilter("A{$headerRow}:M{$endDataRow}");
        }

        $sumCompleted = 0;
        $sumVoid = 0;
        $sumDisc = 0.0;
        $sumCash = 0.0;
        $sumNonCash = 0.0;
        $sumShiftDiff = 0.0;

        foreach ($users as $idx => $user) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $agg = $orderAgg->get($user->id);
            $sAgg = $shiftDiffAgg->get($user->id);

            $completed = (int) ($agg->completed_count ?? 0);
            $voids = (int) ($agg->void_count ?? 0);
            $disc = round((float) ($agg->total_discount ?? 0), 2);
            $cash = round((float) ($agg->cash_rev ?? 0), 2);
            $nonCash = round((float) ($agg->non_cash_rev ?? 0), 2);
            $total = round($cash + $nonCash, 2);
            $nonCashPct = $total > 0 ? $nonCash / $total : 0.0;
            $aovUser = $completed > 0 ? $total / $completed : 0.0;
            $shiftDiff = round((float) ($sAgg->total_diff ?? 0), 2);

            $sumCompleted += $completed;
            $sumVoid += $voids;
            $sumDisc += $disc;
            $sumCash += $cash;
            $sumNonCash += $nonCash;
            $sumShiftDiff += $shiftDiff;

            $diffStyle = $shiftDiff < -1.0
                ? XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, $isAlt)
                : ($shiftDiff > 1.0 ? XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_SIGNED_CURRENCY, $isAlt) : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt));

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $user->name, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $user->email, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => strtoupper($user->role), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $completed, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => $voids, 's' => $voids > 0 ? XlsxWorkbookWriter::STYLE_BADGE_WARNING : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => $disc, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $cash, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $nonCash, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "H{$rNum}+I{$rNum}", 'v' => $total, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY, $isAlt)],
                ['f' => "IFERROR(I{$rNum}/J{$rNum},0)", 'v' => round($nonCashPct, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['f' => "IFERROR(J{$rNum}/E{$rNum},0)", 'v' => round($aovUser, 2), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt)],
                ['v' => $shiftDiff, 's' => $diffStyle, 't' => 'n'],
            ], 21);
        }

        if ($users->isNotEmpty()) {
            $totRow = $sheet->nextRow;
            $grandTotal = round($sumCash + $sumNonCash, 2);
            $rTot = $sheet->addRow([
                ['v' => 'TOTAL KESELURUHAN', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['f' => "SUM(E{$startDataRow}:E{$endDataRow})", 'v' => $sumCompleted, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
                ['f' => "SUM(F{$startDataRow}:F{$endDataRow})", 'v' => $sumVoid, 's' => XlsxWorkbookWriter::STYLE_TOTAL_INTEGER],
                ['f' => "SUM(G{$startDataRow}:G{$endDataRow})", 'v' => round($sumDisc, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(H{$startDataRow}:H{$endDataRow})", 'v' => round($sumCash, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(I{$startDataRow}:I{$endDataRow})", 'v' => round($sumNonCash, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(J{$startDataRow}:J{$endDataRow})", 'v' => $grandTotal, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "IFERROR(I{$totRow}/J{$totRow},0)", 'v' => $grandTotal > 0 ? round($sumNonCash / $grandTotal, 4) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_PERCENT],
                ['f' => "IFERROR(J{$totRow}/E{$totRow},0)", 'v' => $sumCompleted > 0 ? round($grandTotal / $sumCompleted, 2) : 0, 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(M{$startDataRow}:M{$endDataRow})", 'v' => round($sumShiftDiff, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_SIGNED_CURRENCY],
            ], 23);
            $sheet->merge("A{$rTot}:D{$rTot}");
        }

        // Tabel 2: Riwayat Audit Shift Kasir Terakhir pada Periode
        $shifts = Shift::with('user:id,name')
            ->whereDate('opened_at', '>=', $startDate)
            ->whereDate('opened_at', '<=', $endDate)
            ->latest('opened_at')
            ->take(30)
            ->get();

        if ($shifts->isNotEmpty()) {
            $sheet->addSpacerRow(12);
            $sheet->addSectionTitle('RIWAYAT AUDIT SHIFT & TUTUP KASIR (MAKS. 30 SHIFT TERBARU)', 10);
            $sheet->addRow([
                ['v' => 'ID Shift', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Kasir Bertugas', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Waktu Buka', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Waktu Tutup', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Modal Awal Kas', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Kas Ekspektasi', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Kas Aktual Fisik', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Selisih (+/-)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Status Shift', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Catatan Shift', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ], 26);

            foreach ($shifts as $sIdx => $sh) {
                $isAlt = $sIdx % 2 === 1;
                $diff = (float) ($sh->cash_difference ?? 0);
                $badge = $sh->status === 'open'
                    ? ['v' => 'SEDANG BUKA', 's' => XlsxWorkbookWriter::STYLE_BADGE_INFO]
                    : (abs($diff) > 1000
                        ? ['v' => 'SELISIH KAS', 's' => XlsxWorkbookWriter::STYLE_BADGE_DANGER]
                        : ['v' => 'COCOK', 's' => XlsxWorkbookWriter::STYLE_BADGE_SUCCESS]);

                $sheet->addRow([
                    ['v' => '#' . $sh->id, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $sh->user->name ?? 'Kasir', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                    ['v' => $sh->opened_at?->format('Y-m-d H:i') ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $sh->closed_at?->format('Y-m-d H:i') ?? 'Aktif', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => (float) ($sh->starting_cash ?? 0), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => (float) ($sh->expected_cash ?? 0), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => (float) ($sh->actual_cash ?? 0), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => $diff, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_SIGNED_CURRENCY, $isAlt), 't' => 'n'],
                    $badge,
                    ['v' => $sh->notes ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ], 20);
            }
        }

        if ($users->isNotEmpty() && ($sumCash + $sumNonCash) > 0) {
            $sheet->addSpacerRow(10);
            $sheet->addChart([
                'type'            => 'col',
                'title'           => 'Perbandingan Omzet Tunai vs Non-Tunai per Staf',
                'anchorCol'       => 0,
                'anchorRow'       => $sheet->nextRow,
                'widthPx'         => 840,
                'heightPx'        => 320,
                'yAxisCurrency'   => true,
                'legendPos'       => 'b',
                'categoriesRange' => $sheet->absRange(2, $startDataRow, 2, $endDataRow),
                'series'          => [
                    [
                        'name'        => 'Tunai (Cash)',
                        'valuesRange' => $sheet->absRange(8, $startDataRow, 8, $endDataRow),
                        'color'       => 'D97706',
                    ],
                    [
                        'name'        => 'Non-Tunai (QRIS/EDC/TF)',
                        'valuesRange' => $sheet->absRange(9, $startDataRow, 9, $endDataRow),
                        'color'       => '4338CA',
                    ],
                ],
            ]);
        }
    }

    /**
     * SHEET 6: LIMBAH DAPUR & KERUSAKAN BAHAN (Format Desimal Akurat + Rekap per Alasan)
     */
    private function buildKitchenWasteSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Limbah Dapur', 'E11D48', [
            1 => 6, 2 => 18, 3 => 24, 4 => 14, 5 => 10, 6 => 16, 7 => 20, 8 => 20, 9 => 38, 10 => 20,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — AUDIT LIMBAH DAPUR & BAHAN RUSAK (WASTE LOSS)',
            'Pelacakan Penyebab Bahan Terbuang (Kadaluwarsa, Rusak, Spoilage, Salah Olah) & Nilai Kerugian',
            "Periode: {$periodText}   |   Kuantitas Tercatat Akurat hingga 2 Desimal   |   Dicetak: {$printedAt}",
            10
        );

        $wastes = WasteRecord::with(['ingredient', 'user'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $totalLoss = 0.0;
        $byReason = [];
        $byIngredient = [];
        foreach ($wastes as $w) {
            $cost = (float) ($w->ingredient->cost_per_unit ?? 0);
            $loss = round($cost * (float) $w->quantity, 2);
            $totalLoss += $loss;
            $reason = $w->reason ?: 'other';
            $byReason[$reason] = [
                'count' => ($byReason[$reason]['count'] ?? 0) + 1,
                'loss'  => ($byReason[$reason]['loss'] ?? 0.0) + $loss,
            ];

            $ingName = $w->ingredient->name ?? ('Bahan #' . $w->ingredient_id);
            $byIngredient[$ingName] = ($byIngredient[$ingName] ?? 0) + $loss;
        }
        arsort($byIngredient);
        $topIngName = array_key_first($byIngredient) ?? '-';

        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL KEJADIAN LIMBAH', 'v' => $wastes->count(), 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 2],
            ['label' => 'TOTAL ESTIMASI KERUGIAN', 'v' => round($totalLoss, 2), 's' => $totalLoss > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_CURRENCY : XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'BAHAN KERUGIAN TERBESAR', 'v' => $topIngName, 's' => XlsxWorkbookWriter::STYLE_KPI_TEXT, 'cols' => 3],
            ['label' => 'RATA-RATA KERUGIAN / KEJADIAN', 'v' => $wastes->isNotEmpty() ? round($totalLoss / $wastes->count(), 2) : 0, 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 2],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Tanggal & Jam', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Bahan Baku', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Qty Terbuang', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Satuan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Biaya / Unit', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Estimasi Kerugian', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Kategori Alasan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Catatan Kejadian', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Pencatat', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($wastes->isEmpty()) {
            $this->addEmptyStateNotice($sheet, 'Sangat baik! Tidak ada catatan limbah atau bahan rusak pada periode ini.', 10);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + $wastes->count() - 1;
        $sheet->setAutoFilter("A{$headerRow}:J{$endDataRow}");

        foreach ($wastes as $idx => $w) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $qty = (float) $w->quantity;
            $cost = (float) ($w->ingredient->cost_per_unit ?? 0);
            $loss = round($cost * $qty, 2);
            [$reasonText, $reasonStyle] = $this->wasteReasonBadge($w->reason);

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $w->created_at->format('Y-m-d H:i'), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $w->ingredient->name ?? ('Bahan #' . $w->ingredient_id), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $qty, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => $w->ingredient->unit ?? 'unit', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $cost, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "D{$rNum}*F{$rNum}", 'v' => $loss, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, $isAlt)],
                ['v' => $reasonText, 's' => $reasonStyle],
                ['v' => $w->notes ?: '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $w->user->name ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
            ], 24);
        }

        $rTot = $sheet->addRow([
            ['v' => 'TOTAL KERUGIAN LIMBAH DAPUR', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(G{$startDataRow}:G{$endDataRow})", 'v' => round($totalLoss, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => $wastes->count() . ' Kejadian', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 23);
        $sheet->merge("A{$rTot}:F{$rTot}");

        // Ringkasan per Alasan
        $sheet->addSpacerRow(12);
        $sheet->addSectionTitle('RINGKASAN KERUGIAN BERDASARKAN ALASAN LIMBAH', 5);
        $sheet->addRow([
            ['v' => 'Kategori Alasan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Jumlah Kejadian', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Kerugian (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Porsi Kerugian (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Tindakan Disarankan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 24);

        $reasonTips = [
            'expired'       => 'Terapkan prinsip FIFO/FEFO & kurangi volume order sekali beli',
            'damaged'       => 'Periksa SOP penyimpanan gudang & standar penerimaan supplier',
            'spoilage'      => 'Periksa suhu chiller/freezer harian dan kalibrasi FIFO',
            'cooking_error' => 'Latih ulang SOP resep dapur & kalibrasi porsi barista/koki',
            'other'         => 'Review catatan detail dan tetapkan kategori evaluasi',
        ];
        foreach ($byReason as $reasonCode => $info) {
            [$label] = $this->wasteReasonBadge($reasonCode);
            $pct = $totalLoss > 0 ? $info['loss'] / $totalLoss : 0.0;
            $sheet->addRow([
                ['v' => $label, 's' => XlsxWorkbookWriter::STYLE_BOLD_TEXT],
                ['v' => $info['count'], 's' => XlsxWorkbookWriter::STYLE_INTEGER, 't' => 'n'],
                ['v' => round($info['loss'], 2), 's' => XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, 't' => 'n'],
                ['v' => round($pct, 4), 's' => XlsxWorkbookWriter::STYLE_PERCENT, 't' => 'n'],
                ['v' => $reasonTips[$reasonCode] ?? '-', 's' => XlsxWorkbookWriter::STYLE_TEXT],
            ], 22);
        }
    }

    /**
     * SHEET 7: AUDIT STOK OPNAME & ANOMALI (>5%)
     */
    private function buildStockOpnameSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Audit Opname & Anomali', 'EA580C', [
            1 => 6, 2 => 18, 3 => 24, 4 => 14, 5 => 14, 6 => 14,
            7 => 12, 8 => 10, 9 => 16, 10 => 19, 11 => 18, 12 => 34, 13 => 19,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — REKONSILIASI STOK OPNAME & DETEKSI ANOMALI',
            'Perbandingan Stok Sistem vs Hitungan Fisik Gudang — Deviasi >5% Ditandai Indikasi Anomali',
            "Periode: {$periodText}   |   Selisih Ditampilkan dengan Tanda (+/-) Desimal Presisi   |   Dicetak: {$printedAt}",
            13
        );

        $opnames = StockMutation::where('type', 'opname')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->with(['ingredient', 'user'])
            ->latest()
            ->get();

        $cntCocok = 0;
        $cntWajar = 0;
        $cntAnomali = 0;
        $sumVarianceRp = 0.0;
        $prepared = [];

        foreach ($opnames as $op) {
            $before = (float) $op->stock_before;
            $after = (float) $op->stock_after;
            $diff = round($after - $before, 3);
            $cost = (float) ($op->ingredient->cost_per_unit ?? 0);
            $lossValue = round($diff * $cost, 2);
            $sumVarianceRp += $lossValue;

            $absPct = $before > 0 ? (abs($diff) / $before) : ($diff != 0 ? 1.0 : 0.0);
            if ($absPct > 0.05) {
                $cntAnomali++;
                $badge = ['ANOMALI (>5%)', XlsxWorkbookWriter::STYLE_BADGE_DANGER];
            } elseif (abs($diff) > 0.0001) {
                $cntWajar++;
                $badge = ['SELISIH WAJAR', XlsxWorkbookWriter::STYLE_BADGE_WARNING];
            } else {
                $cntCocok++;
                $badge = ['COCOK', XlsxWorkbookWriter::STYLE_BADGE_SUCCESS];
            }

            $prepared[] = compact('op', 'before', 'after', 'diff', 'cost', 'lossValue', 'absPct', 'badge');
        }

        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL SESI OPNAME', 'v' => $opnames->count(), 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'STATUS COCOK / WAJAR', 'v' => $cntCocok + $cntWajar, 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'INDIKASI ANOMALI (>5%)', 'v' => $cntAnomali, 's' => $cntAnomali > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_NUMBER : XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'DAMPAK SELISIH BERSIH (RP)', 'v' => round($sumVarianceRp, 2), 's' => $sumVarianceRp < 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_CURRENCY : XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Tanggal & Jam', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Bahan Baku', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Stok Sistem', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Hitungan Fisik', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Selisih (+/-)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Deviasi (%)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Satuan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Harga / Unit', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Nilai Selisih (Rp)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Status Audit', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Catatan Pemeriksa', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Auditor', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($prepared === []) {
            $this->addEmptyStateNotice($sheet, 'Belum ada riwayat pemeriksaan stok opname pada periode ini.', 13);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + count($prepared) - 1;
        $sheet->setAutoFilter("A{$headerRow}:M{$endDataRow}");

        foreach ($prepared as $idx => $row) {
            $isAlt = $idx % 2 === 1;
            $rNum = $sheet->nextRow;
            $op = $row['op'];
            [$badgeText, $badgeStyle] = $row['badge'];
            $valStyle = $row['lossValue'] < 0
                ? XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, $isAlt)
                : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_SIGNED_CURRENCY, $isAlt);

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $op->created_at->format('Y-m-d H:i'), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $op->ingredient->name ?? ('Bahan #' . $op->ingredient_id), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $row['before'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => $row['after'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['f' => "E{$rNum}-D{$rNum}", 'v' => $row['diff'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_SIGNED_DECIMAL, $isAlt)],
                ['f' => "IF(D{$rNum}>0,ABS(F{$rNum})/D{$rNum},IF(F{$rNum}=0,0,1))", 'v' => round($row['absPct'], 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt)],
                ['v' => $op->ingredient->unit ?? 'unit', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => $row['cost'], 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['f' => "F{$rNum}*I{$rNum}", 'v' => $row['lossValue'], 's' => $valStyle],
                ['v' => $badgeText, 's' => $badgeStyle],
                ['v' => $op->reference_note ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ['v' => $op->user->name ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
            ], 22);
        }

        $rTot = $sheet->addRow([
            ['v' => 'TOTAL DAMPAK NILAI SELISIH OPNAME', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(J{$startDataRow}:J{$endDataRow})", 'v' => round($sumVarianceRp, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_SIGNED_CURRENCY],
            ['v' => "{$cntAnomali} Anomali", 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => $opnames->count() . ' Sesi', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 23);
        $sheet->merge("A{$rTot}:I{$rTot}");
    }

    /**
     * SHEET 8: PREDIKSI STOK AI & REKOMENDASI BELANJA (PO)
     */
    private function buildForecastingSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
    ): void {
        $sheet = $writer->addSheet('Prediksi Stok & Belanja', '0D9488', [
            1 => 6, 2 => 24, 3 => 22, 4 => 14, 5 => 10, 6 => 15, 7 => 16,
            8 => 13, 9 => 14, 10 => 15, 11 => 18, 12 => 16, 13 => 20, 14 => 18, 15 => 12,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — PREDIKSI KEBUTUHAN STOK & REKOMENDASI BELANJA AI',
            'Model Multi-Tier Time Series (AutoETS, Croston, WMA) dengan Safety Stock P90 & Lead Time Supplier',
            "Status Snapshot Terbaru   |   Diurutkan Prioritas: KRITIS -> PERINGATAN -> AMAN   |   Dicetak: {$printedAt}",
            15
        );

        $snapshots = $this->getLatestForecastSnapshots();
        $criticalCount = $snapshots->where('urgency_status', 'CRITICAL')->count();
        $warningCount = $snapshots->where('urgency_status', 'WARNING')->count();
        $safeCount = $snapshots->count() - $criticalCount - $warningCount;
        $totalBudget = (float) $snapshots->sum('estimated_reorder_cost_rp');

        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL BAHAN DIPANTAU AI', 'v' => $snapshots->count(), 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'KRITIS (BELI SEGERA)', 'v' => $criticalCount, 's' => $criticalCount > 0 ? XlsxWorkbookWriter::STYLE_KPI_DANGER_NUMBER : XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 4],
            ['label' => 'PERINGATAN / AMAN', 'v' => "{$warningCount} Pantau  /  {$safeCount} Aman", 's' => XlsxWorkbookWriter::STYLE_KPI_TEXT, 'cols' => 4],
            ['label' => 'ESTIMASI ANGGARAN BELANJA (PO)', 'v' => round($totalBudget, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Bahan Baku', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Status Urgensi', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Stok Saat Ini', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Satuan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Burn Rate / Hari', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Estimasi Habis', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Lead Time (Hr)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Safety Stock', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Saran Beli (Unit)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Saran Kemasan Beli', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Harga / Unit', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Estimasi Biaya PO', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Model AI Terpakai', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Akurasi', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($snapshots->isEmpty()) {
            $this->addEmptyStateNotice($sheet, 'Belum ada hasil snapshot prediksi AI. Jalankan sinkronisasi AI Forecasting dari modul Prediksi Stok.', 15);
            return;
        }

        $startDataRow = $sheet->nextRow;
        $endDataRow = $startDataRow + $snapshots->count() - 1;
        $sheet->setAutoFilter("A{$headerRow}:O{$endDataRow}");

        foreach ($snapshots->values() as $idx => $snap) {
            $isAlt = $idx % 2 === 1;
            $ingredient = $snap->ingredient;
            $unit = $ingredient->unit ?? 'unit';
            $cost = round((float) $snap->estimated_reorder_cost_rp, 2);

            $urgencyBadge = match ($snap->urgency_status) {
                'CRITICAL' => ['KRITIS - BELI SEGERA', XlsxWorkbookWriter::STYLE_BADGE_DANGER],
                'WARNING'  => ['PERINGATAN - PANTAU', XlsxWorkbookWriter::STYLE_BADGE_WARNING],
                default    => ['AMAN', XlsxWorkbookWriter::STYLE_BADGE_SUCCESS],
            };

            $daysVal = $snap->days_until_stockout;
            $daysDisplay = $daysVal !== null
                ? number_format((float) $daysVal, 1, ',', '.') . ' hari'
                : 'Stabil (>90 hr)';

            $purchasePackText = $snap->recommended_reorder_qty > 0
                ? ($snap->purchase_unit
                    ? number_format((float) $snap->recommended_purchase_packs, 0, ',', '.') . ' ' . $snap->purchase_unit
                    : number_format((float) $snap->recommended_reorder_qty, 2, ',', '.') . ' ' . $unit)
                : 'Belum perlu PO';

            $accCell = $snap->accuracy_percentage !== null
                ? ['v' => round(((float) $snap->accuracy_percentage) / 100, 4), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PERCENT, $isAlt), 't' => 'n']
                : ['v' => '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)];

            $sheet->addRow([
                ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                ['v' => $ingredient->name ?? ('Bahan #' . $snap->ingredient_id), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                ['v' => $urgencyBadge[0], 's' => $urgencyBadge[1]],
                ['v' => (float) $snap->current_stock, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => $unit, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => (float) $snap->predicted_daily_burn, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => $daysDisplay, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => (int) ($snap->lead_time_days ?? 0), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_INTEGER, $isAlt), 't' => 'n'],
                ['v' => (float) $snap->safety_stock_qty, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => (float) $snap->recommended_reorder_qty, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_DECIMAL, $isAlt), 't' => 'n'],
                ['v' => $purchasePackText, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                ['v' => (float) $snap->unit_cost_rp, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => $cost, 's' => $cost > 0 ? XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt) : XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                ['v' => (string) $snap->model_used, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                $accCell,
            ], 21);

            // Pastikan kolom Biaya PO memakai format Currency meski nilai > 0
            if ($cost > 0) {
                $sheet->rows[$sheet->nextRow - 1][13]['s'] = XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt);
            }
        }

        $rTot = $sheet->addRow([
            ['v' => 'TOTAL ESTIMASI ANGGARAN BELANJA (PURCHASE ORDER)', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['f' => "SUM(M{$startDataRow}:M{$endDataRow})", 'v' => round($totalBudget, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
            ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ['v' => $snapshots->count() . ' Bahan', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
        ], 23);
        $sheet->merge("A{$rTot}:L{$rTot}");
    }

    /**
     * SHEET 9: BUKU BESAR RINCIAN TRANSAKSI & AUDIT VOID
     */
    private function buildTransactionLedgerSheet(
        XlsxWorkbookWriter $writer,
        string $storeName,
        string $periodText,
        string $printedAt,
        string $startDate,
        string $endDate,
    ): void {
        $sheet = $writer->addSheet('Rincian Transaksi', '334155', [
            1 => 6, 2 => 20, 3 => 18, 4 => 18, 5 => 16, 6 => 13, 7 => 11,
            8 => 40, 9 => 15, 10 => 17, 11 => 15, 12 => 15, 13 => 19, 14 => 22,
        ]);

        $sheet->addBannerHeader(
            strtoupper($storeName) . ' — BUKU BESAR & RINCIAN TRANSAKSI KASIR',
            'Daftar Lengkap Seluruh Nota Penjualan Selesai, Rincian Item Menu, Metode Pembayaran & Lampiran Audit Void',
            "Periode: {$periodText}   |   Filter Auto-Filter Tersedia di Baris Header   |   Dicetak: {$printedAt}",
            14
        );

        $orders = Order::with(['user:id,name', 'table:id,table_number', 'items.product:id,name'])
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $voidOrders = Order::with(['user:id,name', 'voidedBy:id,name'])
            ->where(function ($q) {
                $q->where('status', 'cancelled')->orWhereNotNull('voided_at');
            })
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $sumSub = (float) $orders->sum('subtotal');
        $sumDisc = (float) $orders->sum('discount_amount');
        $sumTax = (float) $orders->sum('tax_amount');
        $sumTot = (float) $orders->sum('total_amount');

        $this->addKpiGridRow($sheet, [
            ['label' => 'TOTAL NOTA SELESAI', 'v' => $orders->count(), 's' => XlsxWorkbookWriter::STYLE_KPI_NUMBER, 'cols' => 3],
            ['label' => 'TOTAL SUBTOTAL MENU', 'v' => round($sumSub, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
            ['label' => 'TOTAL PAJAK & DISKON BERSIH', 'v' => round($sumTax - $sumDisc, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 3],
            ['label' => 'GRAND TOTAL PENERIMAAN', 'v' => round($sumTot, 2), 's' => XlsxWorkbookWriter::STYLE_KPI_CURRENCY, 'cols' => 4],
        ]);
        $sheet->addSpacerRow(8);

        $headerRow = $sheet->addRow([
            ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'No. Invoice', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Waktu Transaksi', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Kasir', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Pelanggan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Tipe Order', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Meja', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Ringkasan Item Menu', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Metode Bayar', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Subtotal', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Diskon', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Pajak', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Total Akhir', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ['v' => 'Catatan', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
        ], 28);
        $sheet->setFreezePane($headerRow, 0);

        if ($orders->isNotEmpty()) {
            $startDataRow = $sheet->nextRow;
            $endDataRow = $startDataRow + $orders->count() - 1;
            $sheet->setAutoFilter("A{$headerRow}:N{$endDataRow}");

            foreach ($orders as $idx => $o) {
                $isAlt = $idx % 2 === 1;
                $itemsText = $o->items
                    ->map(fn ($it) => $it->quantity . 'x ' . ($it->product->name ?? 'Menu'))
                    ->implode(', ');
                if ($itemsText === '') {
                    $itemsText = '-';
                }

                $sheet->addRow([
                    ['v' => $idx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                    ['v' => $o->invoice_number, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                    ['v' => $o->created_at->format('Y-m-d H:i:s'), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $o->user->name ?? 'Kasir / Portal', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                    ['v' => $o->customer_name ?: 'Tamu Umum', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                    ['v' => $this->orderTypeLabel($o->order_type), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $o->table ? "Meja {$o->table->table_number}" : '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $itemsText, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                    ['v' => $this->paymentMethodLabel($o->payment_method), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => (float) $o->subtotal, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => (float) $o->discount_amount, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => (float) $o->tax_amount, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => (float) $o->total_amount, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_PROFIT_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => $o->notes ?: '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ], mb_strlen($itemsText) > 55 ? 30 : 21);
            }

            $rTot = $sheet->addRow([
                ['v' => 'TOTAL TRANSAKSI SELESAI', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
                ['v' => $orders->count() . ' Nota', 's' => XlsxWorkbookWriter::STYLE_TOTAL_CENTER],
                ['f' => "SUM(J{$startDataRow}:J{$endDataRow})", 'v' => round($sumSub, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(K{$startDataRow}:K{$endDataRow})", 'v' => round($sumDisc, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(L{$startDataRow}:L{$endDataRow})", 'v' => round($sumTax, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['f' => "SUM(M{$startDataRow}:M{$endDataRow})", 'v' => round($sumTot, 2), 's' => XlsxWorkbookWriter::STYLE_TOTAL_CURRENCY],
                ['v' => '', 's' => XlsxWorkbookWriter::STYLE_TOTAL_LABEL],
            ], 24);
            $sheet->merge("A{$rTot}:H{$rTot}");
        } else {
            $this->addEmptyStateNotice($sheet, 'Belum ada transaksi selesai pada rentang tanggal yang dipilih.', 14);
        }

        // Lampiran Audit Transaksi Void / Dibatalkan
        if ($voidOrders->isNotEmpty()) {
            $sheet->addSpacerRow(12);
            $sheet->addSectionTitle('LAMPIRAN AUDIT: TRANSAKSI DIBATALKAN / VOID PADA PERIODE', 8);
            $sheet->addRow([
                ['v' => 'No', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'No. Invoice', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Waktu Dibuat', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Waktu Void', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Kasir', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Divoid Oleh', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Nilai Nota (Dibatalkan)', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
                ['v' => 'Alasan Pembatalan / Void', 's' => XlsxWorkbookWriter::STYLE_TABLE_HEADER],
            ], 26);

            foreach ($voidOrders as $vIdx => $vo) {
                $isAlt = $vIdx % 2 === 1;
                $sheet->addRow([
                    ['v' => $vIdx + 1, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt), 't' => 'n'],
                    ['v' => $vo->invoice_number, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_BOLD_TEXT, $isAlt)],
                    ['v' => $vo->created_at->format('Y-m-d H:i'), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $vo->voided_at ? $vo->voided_at->format('Y-m-d H:i') : '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT_CENTER, $isAlt)],
                    ['v' => $vo->user->name ?? 'Tamu/Portal', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                    ['v' => $vo->voidedBy->name ?? '-', 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                    ['v' => (float) $vo->total_amount, 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_LOSS_CURRENCY, $isAlt), 't' => 'n'],
                    ['v' => $vo->void_reason ?: ($vo->notes ?: '-'), 's' => XlsxWorkbookWriter::zebra(XlsxWorkbookWriter::STYLE_TEXT, $isAlt)],
                ], 22);
            }
        }
    }

    /**
     * Ambil snapshot prediksi stok terbaru per bahan baku, terurut berdasarkan prioritas urgensi:
     * CRITICAL (1) -> WARNING (2) -> LOW (3) -> SAFE (4).
     */
    private function getLatestForecastSnapshots(): Collection
    {
        return ForecastSnapshot::with('ingredient')
            ->latest('forecast_date')
            ->get()
            ->unique('ingredient_id')
            ->sortBy(function ($snap) {
                $priority = match ($snap->urgency_status) {
                    'CRITICAL' => 1,
                    'WARNING'  => 2,
                    'LOW'      => 3,
                    default    => 4,
                };
                return sprintf('%d_%012.2f', $priority, $snap->days_until_stockout ?? 999999);
            })
            ->values();
    }

    /**
     * Gambar baris grid kartu KPI horizontal (Label atas + Nilai besar di bawah).
     *
     * @param array<int, array{label: string, v: mixed, s: int, cols?: int, isDanger?: bool}> $cards
     */
    private function addKpiGridRow(XlsxSheet $sheet, array $cards, int $defaultColsPerCard = 3): void
    {
        $labelRowIdx = $sheet->nextRow;
        $sheet->addRow([], 17);
        $valueRowIdx = $sheet->nextRow;
        $sheet->addRow([], 25);

        $colCursor = 1;
        foreach ($cards as $card) {
            $span = (int) ($card['cols'] ?? $defaultColsPerCard);
            $startCol = $colCursor;
            $endCol = $colCursor + $span - 1;
            $c1 = XlsxSheet::colLetter($startCol);
            $c2 = XlsxSheet::colLetter($endCol);

            $sheet->rows[$labelRowIdx][$startCol] = ['v' => $card['label'], 's' => XlsxWorkbookWriter::STYLE_KPI_LABEL, 't' => 's'];
            $sheet->fillStyleRange($labelRowIdx, $startCol + 1, $endCol, XlsxWorkbookWriter::STYLE_KPI_LABEL);
            if ($span > 1) {
                $sheet->merge("{$c1}{$labelRowIdx}:{$c2}{$labelRowIdx}");
            }

            $valCell = [
                'v' => $card['v'],
                's' => $card['s'],
            ];
            if (is_int($card['v']) || is_float($card['v'])) {
                $valCell['t'] = 'n';
            }
            $sheet->rows[$valueRowIdx][$startCol] = $valCell;
            $sheet->fillStyleRange($valueRowIdx, $startCol + 1, $endCol, $card['s']);
            if ($span > 1) {
                $sheet->merge("{$c1}{$valueRowIdx}:{$c2}{$valueRowIdx}");
            }

            $colCursor += $span;
        }
    }

    private function addEmptyStateNotice(XlsxSheet $sheet, string $message, int $spanCols): void
    {
        $lastCol = XlsxSheet::colLetter(max(1, $spanCols));
        $r = $sheet->addRow([['v' => $message, 's' => XlsxWorkbookWriter::STYLE_NOTE_BOX]], 28);
        $sheet->fillStyleRange($r, 1, $spanCols, XlsxWorkbookWriter::STYLE_NOTE_BOX);
        if ($spanCols > 1) {
            $sheet->merge("A{$r}:{$lastCol}{$r}");
        }
    }

    private function indonesianDayName(string $date): string
    {
        return match (Carbon::parse($date)->dayOfWeek) {
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            default => '-',
        };
    }

    private function orderTypeLabel(?string $type): string
    {
        return match ($type) {
            'dine_in'  => 'Dine-In',
            'takeaway' => 'Takeaway',
            'delivery' => 'Delivery',
            default    => strtoupper((string) ($type ?: '-')),
        };
    }

    private function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
            'cash'     => 'Tunai (Cash)',
            'qris'     => 'QRIS',
            'card'     => 'Kartu (EDC)',
            'transfer' => 'Transfer Bank',
            default    => strtoupper((string) ($method ?: 'CASH')),
        };
    }

    /**
     * @return array{0: string, 1: int}
     */
    private function wasteReasonBadge(?string $reason): array
    {
        return match ($reason) {
            'expired'       => ['Kadaluwarsa', XlsxWorkbookWriter::STYLE_BADGE_DANGER],
            'damaged'       => ['Rusak / Pecah', XlsxWorkbookWriter::STYLE_BADGE_WARNING],
            'spoilage'      => ['Basi / Spoilage', XlsxWorkbookWriter::STYLE_BADGE_DANGER],
            'cooking_error' => ['Salah Olah Masak', XlsxWorkbookWriter::STYLE_BADGE_WARNING],
            default         => ['Lainnya', XlsxWorkbookWriter::STYLE_BADGE_NEUTRAL],
        };
    }

    private function safeRatio(float $numerator, float $denominator): float
    {
        return $denominator > 0.0 ? $numerator / $denominator : 0.0;
    }
}
