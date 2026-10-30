# Arunika F&B System Stopper (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       SISTEM KASIR ARUNIKA - STOPPING ALL SERVICES" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Stop by ports 8000 (Backend), 8001 (Forecast), 5173 (POS), 5174 (Cafe)
$ports = @(8000, 8001, 5173, 5174)
$foundAny = $false

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $p = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                $foundAny = $true
                Write-Host "Menghentikan proses pada port $port (PID: $($p.Id), $($p.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Stop any lingering background artisan serve or forecasting run.py processes
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -match "run\.py" -or 
    ($_.CommandLine -match "artisan" -and $_.CommandLine -match "serve")
} | ForEach-Object {
    $foundAny = $true
    Write-Host "Menghentikan $($_.Name) (PID: $($_.ProcessId))..." -ForegroundColor Yellow
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Semua server web Arunika telah berhasil dimatikan!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
