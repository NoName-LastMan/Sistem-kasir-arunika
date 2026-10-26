# Arunika F&B System Launcher (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       SISTEM KASIR ARUNIKA - FULLSTACK LAUNCHER" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$PhpPath = "php"
$found = Get-Command php -ErrorAction SilentlyContinue
if (-not $found) {
    if (Test-Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.5_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe") {
        $PhpPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.5_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    } elseif (Test-Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe") {
        $PhpPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    } else {
        Write-Error "PHP executable tidak ditemukan di PATH! Pastikan PHP sudah terinstal."
        exit 1
    }
}

$rootDir = $PSScriptRoot

Write-Host "[1/4] Menjalankan Python FastAPI Forecasting Engine (Port 8001)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\forecasting-engine`" && python run.py" -WindowStyle Normal

Write-Host "[2/4] Menjalankan Laravel Backend Core (Port 8000)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\pos-backend`" && `"$PhpPath`" artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Normal

Write-Host "[3/4] Menjalankan POS & KDS Frontend (Port 5173)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\pos-frontend`" && npm run dev" -WindowStyle Normal

Write-Host "[4/4] Menjalankan Cafe Guest Self-Order Portal (Port 5174)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\cafe-frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Semua layanan Arunika POS Suite berhasil diluncurkan!" -ForegroundColor Yellow
Write-Host " - POS & Admin Panel:   http://localhost:5173" -ForegroundColor White
Write-Host " - Cafe QR Self-Order:  http://localhost:5174" -ForegroundColor White
Write-Host " - AI Forecast Engine:  http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host " - Backend Core API:    http://127.0.0.1:8000" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
