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


