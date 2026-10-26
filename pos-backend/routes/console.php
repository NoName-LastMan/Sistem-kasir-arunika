<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 1. Jadwal Pre-Computing Snapshot Forecasting (Setiap Hari Pukul 01:00 WIB)
\Illuminate\Support\Facades\Schedule::command('forecast:generate-daily')
    ->dailyAt('01:00')
    ->withoutOverlapping();

// 2. Jadwal Pengiriman Laporan Pagi Harian ke Owner (Setiap Hari Pukul 06:00 WIB)
\Illuminate\Support\Facades\Schedule::command('report:owner-morning-digest')
    ->dailyAt('06:00')
    ->withoutOverlapping();

// 3. Jadwal Pembersihan Retensi Snapshot Usang > 90 Hari (Setiap Hari Minggu Pukul 02:00 WIB)
\Illuminate\Support\Facades\Schedule::command('forecast:prune --days=90')
    ->weeklyOn(0, '02:00')
    ->withoutOverlapping();
// 4. Perintah & Jadwal Backup Database Otomatis (Setiap Hari Pukul 03:00 WIB)
Artisan::command('arunika:backup-db', function () {
    $dbConnection = config('database.default');
    $backupDir = storage_path('app/backups');

    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }

    $timestamp = now()->format('Y-m-d_H-i-s');

    if ($dbConnection === 'sqlite') {
        $source = config('database.connections.sqlite.database');
        if (file_exists($source)) {
            $destination = "{$backupDir}/backup-{$timestamp}.sqlite";
            copy($source, $destination);
            $this->info("Database SQLite berhasil dicadangkan ke: {$destination}");
        } else {
            $this->error("File database SQLite tidak ditemukan: {$source}");
        }
    } else {
        $this->info("Backup untuk driver {$dbConnection} memerlukan konfigurasi mysqldump/pg_dump.");
    }

    // Prune backup lebih lama dari 14 hari
    $files = glob("{$backupDir}/backup-*.sqlite");
    $now = time();
    $deletedCount = 0;
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file) >= 14 * 86400)) {
            unlink($file);
            $deletedCount++;
        }
    }
    if ($deletedCount > 0) {
        $this->info("Berhasil membersihkan {$deletedCount} file backup lama (>14 hari).");
    }
})->purpose('Mencadangkan database sistem ke storage lokal dan membersihkan file lama');

\Illuminate\Support\Facades\Schedule::command('arunika:backup-db')
    ->dailyAt('03:00')
    ->withoutOverlapping();
