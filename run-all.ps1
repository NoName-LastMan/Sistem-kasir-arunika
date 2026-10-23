# Arunika F&B System Launcher (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       SISTEM KASIR ARUNIKA - FULLSTACK LAUNCHER" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$PhpPath = "C:\Users\T4N0C\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
if (-not (Test-Path $PhpPath)) {
    $PhpPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
}
if (-not (Test-Path $PhpPath)) {
    $found = Get-Command php -ErrorAction SilentlyContinue
    if ($found) {
        $PhpPath = "php"
    } else {
        Write-Error "PHP 8.4 executable tidak ditemukan! Pastikan PHP 8.4 terpasang."
        exit 1
    }
}

$rootDir = $PSScriptRoot

Write-Host "[1/3] Menjalankan Python FastAPI Forecasting Engine (Port 8001)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\forecasting-engine`" && python run.py" -WindowStyle Normal

Write-Host "[2/3] Menjalankan Laravel Backend Core (Port 8000)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\pos-backend`" && `"$PhpPath`" artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Normal

Write-Host "[3/3] Menjalankan POS Frontend Vite (Port 5173)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\pos-frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Semua layanan Arunika POS berhasil diluncurkan!" -ForegroundColor Yellow
Write-Host " - Frontend POS:       http://localhost:5173" -ForegroundColor White
Write-Host " - Forecasting Engine: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host " - Backend API:        http://127.0.0.1:8000" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
