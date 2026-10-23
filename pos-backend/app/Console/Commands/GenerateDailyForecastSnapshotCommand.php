<?php

namespace App\Console\Commands;

use App\Services\AiInsightService;
use App\Services\StockForecastingService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateDailyForecastSnapshotCommand extends Command
{
    protected $signature = 'forecast:generate-daily {--date= : Tanggal target snapshot (default hari ini)}';
    protected $description = 'Hitung & simpan pre-computed materialized snapshot forecasting stok dan AI briefing log.';

    public function handle(
        StockForecastingService $forecastingService,
        AiInsightService $aiService
    ): int {
        $targetDate = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : Carbon::today();

        $dateStr = $targetDate->toDateString();
        $this->info("=== Menjalankan Pre-Computed Forecasting Snapshot: {$dateStr} ===");

        // 1. Hitung & simpan snapshot stok bahan baku
        $startTime = microtime(true);
        $snapshots = $forecastingService->generateAndSaveDailySnapshot($targetDate);
        $elapsed = round((microtime(true) - $startTime) * 1000, 2);

        $this->info("Berhasil membuat {$snapshots->count()} snapshot bahan baku dalam {$elapsed} ms.");

        // 2. Buat & simpan narasi AI operasional (Admin) dan eksekutif (Owner)
        $this->info("Menghasilkan narasi AI Intelligence (Admin & Owner)...");
        $forecastList = $forecastingService->getForecast(null, true)->toArray();

        $aiService->generateInsights($forecastList, false, true); // Admin
        $aiService->generateInsights($forecastList, true, true);  // Owner

        $this->info("✅ Pre-Computed Snapshot & AI Briefing berhasil diperbarui untuk {$dateStr}!");
        return Command::SUCCESS;
    }
}
