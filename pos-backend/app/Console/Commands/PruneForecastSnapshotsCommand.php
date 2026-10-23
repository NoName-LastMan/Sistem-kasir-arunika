<?php

namespace App\Console\Commands;

use App\Models\AiBriefingLog;
use App\Models\ForecastSnapshot;
use Carbon\Carbon;
use Illuminate\Console\Command;

class PruneForecastSnapshotsCommand extends Command
{
    protected $signature = 'forecast:prune {--days=90 : Batas hari retensi penyimpanan snapshot}';
    protected $description = 'Hapus snapshot peramalan dan log briefing usang untuk menghemat ruang penyimpanan database';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: 90);
        $cutoffDate = Carbon::today()->subDays($days)->toDateString();

        $this->info("Menghapus snapshot peramalan & briefing lebih tua dari {$cutoffDate} ({$days} hari terakhir)...");

        $deletedSnapshots = ForecastSnapshot::where('forecast_date', '<', $cutoffDate)->delete();
        $deletedBriefings = AiBriefingLog::where('briefing_date', '<', $cutoffDate)->delete();

        $this->info("✓ Selesai: {$deletedSnapshots} baris forecast_snapshots dan {$deletedBriefings} baris ai_briefing_logs dibersihkan.");

        return Command::SUCCESS;
    }
}
