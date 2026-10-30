@echo off
title Arunika F&B System Stopper
echo ========================================================
echo        SISTEM KASIR ARUNIKA - STOPPING ALL SERVICES
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"

echo.
timeout /t 3
