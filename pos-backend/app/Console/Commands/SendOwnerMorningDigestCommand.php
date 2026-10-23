<?php

namespace App\Console\Commands;

use App\Mail\OwnerMorningDigestMail;
use App\Models\Order;
use App\Models\Shift;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use App\Services\AiInsightService;
use App\Services\ReconciliationService;
use App\Services\ReportService;
use App\Services\StockForecastingService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendOwnerMorningDigestCommand extends Command
{
    protected $signature = 'report:owner-morning-digest {--email= : Target email override}';
    protected $description = 'Kirim laporan eksekutif pagi harian (Morning Digest) otomatis ke email Owner/Superadmin.';

    public function handle(
        ReportService $reportService,
        StockForecastingService $forecastingService,
        ReconciliationService $reconciliationService,
        AiInsightService $aiService
    ): int {
        $yesterday = Carbon::yesterday();
        $dateStr = $yesterday->toDateString();

        $this->info("Menghasilkan Executive Morning Digest untuk tanggal: {$dateStr}");

        // 1. Ambil Data Penjualan Kemarin
        $salesReport = $reportService->calculateSalesSummary($dateStr, $dateStr);

        // 2. Selisih Kas Shift Kemarin
        $shifts = Shift::whereDate('opened_at', $dateStr)->get();
        $cashDiscrepancy = $shifts->sum(fn($s) => (float) ($s->actual_cash ?? 0) - (float) ($s->expected_cash ?? 0));

        // 3. Aktivitas Audit: Stock In & Waste
        $stockInCount = StockMutation::where('type', StockMutation::TYPE_IN)
            ->whereDate('created_at', $dateStr)
            ->count();
        $wasteCount = WasteRecord::whereDate('created_at', $dateStr)->count();

        // 4. Anomali Rekonsiliasi (Stock Opname)
        $reconReport = $reconciliationService->getReconciliationReport($dateStr, $dateStr);
        $anomalyCount = collect($reconReport)->where('is_anomaly', true)->count();

        // 5. Prediksi Stok Kritis Hari Ini
        $forecasts = $forecastingService->getForecast(null, true);
        $criticalItems = $forecasts->where('urgency', 'CRITICAL')->values()->take(5)->toArray();

        $summaryData = [
            'date'                 => $yesterday->isoFormat('dddd, D MMMM Y'),
            'sales'                => $salesReport,
            'cash_discrepancy'     => $cashDiscrepancy,
            'stock_in_count'       => $stockInCount,
            'waste_count'          => $wasteCount,
            'anomaly_count'        => $anomalyCount,
            'critical_ingredients' => $criticalItems,
        ];

        // 6. Generate Narasi AI Eksekutif
        $aiExecutiveNarrative = $aiService->generateInsights($forecasts->toArray(), true);

        // 7. Cari Email Penerima
        $overrideEmail = $this->option('email');
        $owners = User::where('role', 'superadmin')->where('is_active', true)->get();

        if ($overrideEmail) {
            Mail::to($overrideEmail)->send(new OwnerMorningDigestMail($summaryData, $aiExecutiveNarrative));
            $this->info("Berhasil mengirim email ke: {$overrideEmail}");
        } elseif ($owners->isNotEmpty()) {
            foreach ($owners as $owner) {
                if ($owner->email) {
                    Mail::to($owner->email)->send(new OwnerMorningDigestMail($summaryData, $aiExecutiveNarrative));
                    $this->info("Berhasil mengirim email ke owner: {$owner->email}");
                }
            }
        } else {
            $this->warn("Tidak ditemukan akun superadmin aktif untuk pengiriman email.");
        }

        return Command::SUCCESS;
    }
}
