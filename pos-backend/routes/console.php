<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwal Pengiriman Laporan Pagi Harian ke Owner (Setiap Hari Pukul 06:00 WIB)
\Illuminate\Support\Facades\Schedule::command('report:owner-morning-digest')
    ->dailyAt('06:00')
    ->withoutOverlapping();

