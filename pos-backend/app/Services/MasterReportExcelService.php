<?php

namespace App\Services;

use App\Models\ForecastSnapshot;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MasterReportExcelService
{
    /**
     * Hasilkan XML Spreadsheet 2003 (.xls) yang berisi seluruh 9 sheet laporan konsolidasi untuk Owner.
     */
    public function generateMasterWorkbook(string $startDate, string $endDate): string
    {
        $reportService = app(ReportService::class);
        $summary = $reportService->calculateSalesSummary($startDate, $endDate);
        $profitLoss = $reportService->calculateProfitLoss($startDate, $endDate);

        $xml = [];
        $xml[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml[] = '<?mso-application progid="Excel.Sheet"?>';
        $xml[] = '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
        $xml[] = ' xmlns:o="urn:schemas-microsoft-com:office:office"';
        $xml[] = ' xmlns:x="urn:schemas-microsoft-com:office:excel"';
        $xml[] = ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"';
        $xml[] = ' xmlns:html="http://www.w3.org/TR/REC-html40">';

        $xml[] = $this->buildStyles();

        // Sheet 1: Ringkasan Eksekutif & Finansial
        $xml[] = $this->buildExecutiveSummarySheet($summary, $profitLoss, $startDate, $endDate);

        // Sheet 2: Laba Rugi & HPP Produk
        $xml[] = $this->buildProfitLossSheet($startDate, $endDate);

        // Sheet 3: Tren Omzet Harian
        $xml[] = $this->buildDailyRevenueSheet($startDate, $endDate);

        // Sheet 4: Produk Terlaris
        $xml[] = $this->buildTopProductsSheet($startDate, $endDate);

        // Sheet 5: Performa Kasir
        $xml[] = $this->buildCashierPerformanceSheet($startDate, $endDate);

        // Sheet 6: Limbah Dapur & Kerusakan Bahan
        $xml[] = $this->buildKitchenWasteSheet($startDate, $endDate);

        // Sheet 7: Audit Opname & Anomali
        $xml[] = $this->buildStockOpnameSheet($startDate, $endDate);

        // Sheet 8: Prediksi Stok & Rekomendasi Belanja AI
        $xml[] = $this->buildForecastingSheet();

        // Sheet 9: Rincian Transaksi Penjualan
        $xml[] = $this->buildTransactionLedgerSheet($startDate, $endDate);

        $xml[] = '</Workbook>';

        return implode("\n", $xml);
    }

    private function buildStyles(): string
    {
        return <<<XML
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="DocTitle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="DocSubtitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp&quot;\ #,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrency">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp&quot;\ #,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabel">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
  </Style>
 </Styles>
XML;
    }

    private function buildExecutiveSummarySheet(array $summary, array $profitLoss, string $startDate, string $endDate): string
    {
        $kpi = $summary['kpi'] ?? [];
        $pm = $summary['by_payment_method'] ?? [];
        $ot = $summary['by_order_type'] ?? [];

        $s = [];
        $s[] = ' <Worksheet ss:Name="Ringkasan Eksekutif">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="250"/>';
        $s[] = '   <Column ss:Width="180"/>';
        $s[] = '   <Column ss:Width="100"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">LAPORAN KONSOLIDASI EKSEKUTIF — ARUNIKA POS</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode Audit: ' . $startDate . ' s/d ' . $endDate . ' | Dicetak: ' . now()->format('Y-m-d H:i:s') . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        // Indikator Utama (KPI)
        $s[] = '   <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">1. INDIKATOR UTAMA FINANSIAL &amp; PENJUALAN</Data></Cell><Cell ss:StyleID="SectionHeader"/></Row>';
        $s[] = $this->metricRow('Total Penjualan Kotor (Gross Sales)', (float) ($kpi['gross_sales'] ?? 0), 'currency');
        $s[] = $this->metricRow('Total Diskon Promosi', (float) ($kpi['total_discount'] ?? 0), 'currency');
        $s[] = $this->metricRow('Total Pajak Terkumpul (PB1/PPN)', (float) ($kpi['total_tax'] ?? 0), 'currency');
        $s[] = $this->metricRow('Total Penjualan Bersih (Net Revenue)', (float) ($kpi['net_sales'] ?? 0), 'currency');
        $s[] = $this->metricRow('Estimasi HPP (Harga Pokok Penjualan)', (float) ($profitLoss['cost_of_goods_sold'] ?? 0), 'currency');
        $s[] = $this->metricRow('Laba Kotor Operasional (Gross Profit)', (float) ($profitLoss['gross_profit'] ?? 0), 'currency');
        $s[] = $this->metricRow('Margin Laba Kotor (Gross Profit Margin)', (float) ($profitLoss['profit_margin_percent'] ?? 0), 'percent');
        $s[] = $this->metricRow('Total Pesanan Selesai (Completed Orders)', (float) ($kpi['total_orders'] ?? 0), 'number');
        $s[] = $this->metricRow('Rata-rata Nilai Transaksi (AOV)', (float) ($kpi['average_order_value'] ?? 0), 'currency');
        $s[] = '   <Row/>';

        // Breakdown Metode Pembayaran
        $s[] = '   <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">2. REALISASI METODE PEMBAYARAN</Data></Cell><Cell ss:StyleID="SectionHeader"/></Row>';
        $s[] = $this->metricRow('Tunai (Cash)', (float) ($pm['cash'] ?? 0), 'currency');
        $s[] = $this->metricRow('QRIS Digital', (float) ($pm['qris'] ?? 0), 'currency');
        $s[] = $this->metricRow('Kartu Debit/Kredit (EDC)', (float) ($pm['card'] ?? 0), 'currency');
        $s[] = $this->metricRow('Transfer Bank', (float) ($pm['transfer'] ?? 0), 'currency');
        $s[] = '   <Row/>';

        // Breakdown Tipe Pesanan
        $s[] = '   <Row><Cell ss:StyleID="SectionHeader"><Data ss:Type="String">3. DISTRIBUSI TIPE PESANAN</Data></Cell><Cell ss:StyleID="SectionHeader"/></Row>';
        $s[] = $this->metricRow('Makan di Tempat (Dine-In)', (float) ($ot['dine_in'] ?? 0), 'number');
        $s[] = $this->metricRow('Bungkus (Takeaway)', (float) ($ot['takeaway'] ?? 0), 'number');
        $s[] = $this->metricRow('Antar (Delivery)', (float) ($ot['delivery'] ?? 0), 'number');

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildProfitLossSheet(string $startDate, string $endDate): string
    {
        $items = OrderItem::whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->with(['product.category'])
            ->get()
            ->groupBy('product_id');

        $s = [];
        $s[] = ' <Worksheet ss:Name="Laba Rugi &amp; HPP">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="160"/>';
        $s[] = '   <Column ss:Width="200"/>';
        $s[] = '   <Column ss:Width="80"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="90"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">ANALISIS LABA KOTOR &amp; HPP PRODUK</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Kategori</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Produk</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Qty Terjual</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Harga Jual</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">HPP per Unit</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Omzet</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total HPP</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Laba Kotor</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Margin (%)</Data></Cell>';
        $s[] = '   </Row>';

        $sumRevenue = 0;
        $sumCogs = 0;
        $sumProfit = 0;

        foreach ($items as $group) {
            $first = $group->first();
            $product = $first->product;
            $qty = $group->sum('quantity');
            $revenue = (float) $group->sum('subtotal');
            $cogsUnit = (float) ($product->cost_price ?? 0);
            $totalCogs = round($cogsUnit * $qty, 2);
            $grossProfit = round($revenue - $totalCogs, 2);
            $marginPct = $revenue > 0 ? ($grossProfit / $revenue) : 0;

            $sumRevenue += $revenue;
            $sumCogs += $totalCogs;
            $sumProfit += $grossProfit;

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($product->category->name ?? 'Uncategorized') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($product->name ?? 'Produk') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $qty . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) ($product->price ?? 0) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $cogsUnit . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $revenue . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $totalCogs . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $grossProfit . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellPercent"><Data ss:Type="Number">' . $marginPct . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        // Total Row
        $overallMargin = $sumRevenue > 0 ? ($sumProfit / $sumRevenue) : 0;
        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $sumRevenue . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $sumCogs . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $sumProfit . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="CellPercent"><Data ss:Type="Number">' . $overallMargin . '</Data></Cell>';
        $s[] = '   </Row>';

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildDailyRevenueSheet(string $startDate, string $endDate): string
    {
        $rows = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(id) as total_orders'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(discount_amount) as total_discount'),
                DB::raw('SUM(tax_amount) as total_tax'),
                DB::raw('SUM(total_amount) as net_revenue')
            )
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Tren Omzet Harian">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="140"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">TREN PENDAPATAN &amp; OMZET HARIAN</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Pesanan</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Penjualan Kotor</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Diskon</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Pajak</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Omzet Bersih</Data></Cell>';
        $s[] = '   </Row>';

        foreach ($rows as $r) {
            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $r->date . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $r->total_orders . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) $r->total_subtotal . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) $r->total_discount . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) $r->total_tax . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) $r->net_revenue . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildTopProductsSheet(string $startDate, string $endDate): string
    {
        $items = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                  ->whereDate('created_at', '>=', $startDate)
                  ->whereDate('created_at', '<=', $endDate);
            })
            ->with(['product.category'])
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->take(50)
            ->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Menu Terlaris">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="50"/>';
        $s[] = '   <Column ss:Width="200"/>';
        $s[] = '   <Column ss:Width="140"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="130"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">PERINGKAT MENU &amp; PRODUK TERLARIS</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Produk</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Kategori</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Qty Terjual</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Harga Jual</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Omzet</Data></Cell>';
        $s[] = '   </Row>';

        $rank = 1;
        foreach ($items as $item) {
            $product = $item->product;
            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">' . $rank++ . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($product->name ?? 'Produk #' . $item->product_id) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($product->category->name ?? '-') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $item->total_sold . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) ($product->price ?? 0) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . (float) $item->total_revenue . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildCashierPerformanceSheet(string $startDate, string $endDate): string
    {
        $users = User::select('id', 'name', 'email', 'role')->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Performa Kasir">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="160"/>';
        $s[] = '   <Column ss:Width="180"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="130"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">PERFORMA &amp; AKUNTABILITAS KASIR</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Staf</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Peran</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Transaksi</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Omzet Tunai</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Omzet Non-Tunai</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Omzet</Data></Cell>';
        $s[] = '   </Row>';

        foreach ($users as $user) {
            $orders = Order::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate);

            $count = (clone $orders)->count();
            if ($count === 0 && !in_array($user->role, ['cashier', 'admin'])) {
                continue;
            }

            $cash = (float) (clone $orders)->where('payment_method', 'cash')->sum('total_amount');
            $nonCash = (float) (clone $orders)->where('payment_method', '!=', 'cash')->sum('total_amount');
            $total = $cash + $nonCash;

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($user->name) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($user->email) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . strtoupper($user->role) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $count . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $cash . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $nonCash . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $total . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildKitchenWasteSheet(string $startDate, string $endDate): string
    {
        $wastes = WasteRecord::with(['ingredient', 'user'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Limbah Dapur">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="180"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="60"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="140"/>';
        $s[] = '   <Column ss:Width="120"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">AUDIT LIMBAH &amp; BAHAN RUSAK (WASTE LOSS)</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal &amp; Jam</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Bahan Baku</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Qty Terbuang</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Satuan</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Biaya per Unit</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Estimasi Kerugian</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Alasan Limbah</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Pencatat</Data></Cell>';
        $s[] = '   </Row>';

        $totalLoss = 0;
        foreach ($wastes as $w) {
            $cost = (float) ($w->ingredient->cost_per_unit ?? 0);
            $loss = round($cost * (float) $w->quantity, 2);
            $totalLoss += $loss;

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $w->created_at->format('Y-m-d H:i') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($w->ingredient->name ?? 'Bahan #' . $w->ingredient_id) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) $w->quantity . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $this->escape($w->ingredient->unit ?? 'unit') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $cost . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $loss . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($w->reason . ($w->notes ? " ({$w->notes})" : '')) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($w->user->name ?? '-') . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL KERUGIAN LIMBAH</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalLoss . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '   </Row>';

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildStockOpnameSheet(string $startDate, string $endDate): string
    {
        $opnames = StockMutation::where('type', 'opname')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->with(['ingredient', 'user'])
            ->latest()
            ->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Audit Opname &amp; Anomali">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="180"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="60"/>';
        $s[] = '   <Column ss:Width="120"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="140"/>';
        $s[] = '   <Column ss:Width="110"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">REKONSILIASI STOK OPNAME &amp; DETEKSI ANOMALI</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . ' (Selisih &gt;5% ditandai Indikasi Anomali)</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal &amp; Jam</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Bahan Baku</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Stok Sistem</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Hitungan Fisik</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Selisih (+/-)</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Satuan</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Nilai Selisih</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Status Audit</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Catatan Pemeriksa</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Auditor</Data></Cell>';
        $s[] = '   </Row>';

        foreach ($opnames as $op) {
            $before = (float) $op->stock_before;
            $after = (float) $op->stock_after;
            $diff = $after - $before;
            $cost = (float) ($op->ingredient->cost_per_unit ?? 0);
            $lossValue = round($diff * $cost, 2);

            $absPct = $before > 0 ? (abs($diff) / $before) * 100 : 0;
            $status = $absPct > 5.0 ? 'ANOMALI (>5%)' : ($diff != 0 ? 'SELISIH WAJAR' : 'COCOK');

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $op->created_at->format('Y-m-d H:i') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($op->ingredient->name ?? 'Bahan #' . $op->ingredient_id) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $before . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $after . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . $diff . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $this->escape($op->ingredient->unit ?? 'unit') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $lossValue . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $status . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($op->reference_note ?? '-') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($op->user->name ?? '-') . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildForecastingSheet(): string
    {
        $snapshots = ForecastSnapshot::with('ingredient')
            ->orderBy('urgency_status', 'asc')
            ->latest('forecast_date')
            ->get()
            ->unique('ingredient_id');

        $s = [];
        $s[] = ' <Worksheet ss:Name="Prediksi Stok &amp; Belanja">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="180"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="110"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">PREDIKSI KEBUTUHAN STOK &amp; REKOMENDASI BELANJA AI</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Model: Multi-Tier Time Series (AutoETS, Croston, WMA) dengan P90 Buffer</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Bahan Baku</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Urgensi</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Stok Saat Ini</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Burn Rate / Hari</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Sisa Hari</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Safety Stock</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Saran Beli (Unit)</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Saran Kemasan</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Estimasi Biaya</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Model Terpakai</Data></Cell>';
        $s[] = '   </Row>';

        $totalEstimatedBudget = 0;
        foreach ($snapshots as $snap) {
            $ingredient = $snap->ingredient;
            $unit = $ingredient ? ($ingredient->unit ?? 'unit') : 'unit';
            $cost = (float) $snap->estimated_reorder_cost_rp;
            $totalEstimatedBudget += $cost;

            $purchasePackText = $snap->purchase_unit
                ? (float) $snap->recommended_purchase_packs . ' ' . $snap->purchase_unit
                : (float) $snap->recommended_reorder_qty . ' ' . $unit;

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($ingredient->name ?? 'Bahan #' . $snap->ingredient_id) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $snap->urgency_status . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) $snap->current_stock . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) $snap->predicted_daily_burn . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) ($snap->days_until_stockout ?? 0) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) $snap->safety_stock_qty . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellNumber"><Data ss:Type="Number">' . (float) $snap->recommended_reorder_qty . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $this->escape($purchasePackText) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $cost . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $this->escape($snap->model_used) . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL ANGGARAN BELANJA PREDRAWN</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalEstimatedBudget . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '   </Row>';

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function buildTransactionLedgerSheet(string $startDate, string $endDate): string
    {
        $orders = Order::with(['user:id,name', 'table:id,table_number'])
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->latest()
            ->get();

        $s = [];
        $s[] = ' <Worksheet ss:Name="Rincian Transaksi">';
        $s[] = '  <Table ss:DefaultRowHeight="20">';
        $s[] = '   <Column ss:Width="140"/>';
        $s[] = '   <Column ss:Width="130"/>';
        $s[] = '   <Column ss:Width="120"/>';
        $s[] = '   <Column ss:Width="90"/>';
        $s[] = '   <Column ss:Width="80"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="110"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="100"/>';
        $s[] = '   <Column ss:Width="120"/>';

        $s[] = '   <Row><Cell ss:StyleID="DocTitle"><Data ss:Type="String">BUKU BESAR &amp; RINCIAN TRANSAKSI KASIR</Data></Cell></Row>';
        $s[] = '   <Row><Cell ss:StyleID="DocSubtitle"><Data ss:Type="String">Periode: ' . $startDate . ' s/d ' . $endDate . '</Data></Cell></Row>';
        $s[] = '   <Row/>';

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">No. Invoice</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Waktu Transaksi</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Kasir</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Tipe Order</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Meja</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Metode Bayar</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Subtotal</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Diskon</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Pajak</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Akhir</Data></Cell>';
        $s[] = '   </Row>';

        $totalSubtotal = 0;
        $totalDiscount = 0;
        $totalTax = 0;
        $totalNet = 0;

        foreach ($orders as $o) {
            $sub = (float) $o->subtotal;
            $disc = (float) $o->discount_amount;
            $tax = (float) $o->tax_amount;
            $tot = (float) $o->total_amount;

            $totalSubtotal += $sub;
            $totalDiscount += $disc;
            $totalTax += $tax;
            $totalNet += $tot;

            $s[] = '   <Row>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $this->escape($o->invoice_number) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . $o->created_at->format('Y-m-d H:i:s') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($o->user->name ?? 'Kasir') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . strtoupper($o->order_type) . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . ($o->table ? "Meja {$o->table->table_number}" : '-') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">' . strtoupper($o->payment_method ?? 'CASH') . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $sub . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $disc . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $tax . '</Data></Cell>';
            $s[] = '    <Cell ss:StyleID="CellCurrency"><Data ss:Type="Number">' . $tot . '</Data></Cell>';
            $s[] = '   </Row>';
        }

        $s[] = '   <Row>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL KESELURUHAN</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalLabel"/>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalSubtotal . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalDiscount . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalTax . '</Data></Cell>';
        $s[] = '    <Cell ss:StyleID="TotalCurrency"><Data ss:Type="Number">' . $totalNet . '</Data></Cell>';
        $s[] = '   </Row>';

        $s[] = '  </Table>';
        $s[] = ' </Worksheet>';

        return implode("\n", $s);
    }

    private function metricRow(string $label, float $value, string $format = 'currency'): string
    {
        $style = match ($format) {
            'percent'  => 'CellPercent',
            'number'   => 'CellNumber',
            default    => 'CellCurrency'
        };

        $val = $format === 'percent' ? ($value / 100) : $value;

        return '   <Row>' .
            '<Cell ss:StyleID="CellText"><Data ss:Type="String">' . $this->escape($label) . '</Data></Cell>' .
            '<Cell ss:StyleID="' . $style . '"><Data ss:Type="Number">' . $val . '</Data></Cell>' .
            '</Row>';
    }

    private function escape(mixed $value): string
    {
        return htmlspecialchars((string) ($value ?? ''), ENT_XML1, 'UTF-8');
    }
}
