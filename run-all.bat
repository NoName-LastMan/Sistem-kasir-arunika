@echo off
setlocal enabledelayedexpansion
title Arunika F&B System Launcher

echo ========================================================
echo        SISTEM KASIR ARUNIKA - FULLSTACK LAUNCHER
echo ========================================================
echo.

:: Detect PHP executable from PATH first, then fallback to Winget packages
set "PHP_CMD=php"
where php >nul 2>&1
if !errorlevel! neq 0 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.5_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
        set "PHP_CMD=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.5_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    ) else if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
        set "PHP_CMD=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    ) else (
        echo [ERROR] PHP executable tidak ditemukan di PATH! Pastikan PHP sudah terinstal.
        pause
        exit /b 1
    )
)

echo [1/4] Menjalankan Python FastAPI Forecasting Engine (Port 8001)...
start "Arunika - AI Forecasting Engine (Port 8001)" cmd /k "cd /d "%~dp0forecasting-engine" && python run.py"

echo [2/4] Menjalankan Laravel Backend Core (Port 8000)...
start "Arunika - Laravel Backend (Port 8000)" cmd /k "cd /d "%~dp0pos-backend" && "!PHP_CMD!" artisan serve --host=127.0.0.1 --port=8000"

echo [3/4] Menjalankan POS & KDS Frontend (Port 5173)...
start "Arunika - POS Frontend (Port 5173)" cmd /k "cd /d "%~dp0pos-frontend" && npm run dev"

echo [4/4] Menjalankan Cafe Guest Self-Order Portal (Port 5174)...
start "Arunika - Cafe Guest Portal (Port 5174)" cmd /k "cd /d "%~dp0cafe-frontend" && npm run dev"

echo.
echo ========================================================
echo  Semua layanan Arunika POS Suite berhasil diluncurkan!
echo  - POS & Admin Panel:   http://localhost:5173
echo  - Cafe QR Self-Order:  http://localhost:5174
echo  - AI Forecast Engine:  http://127.0.0.1:8001/docs
echo  - Backend Core API:    http://127.0.0.1:8000
echo ========================================================
echo.
timeout /t 5
