#!/bin/bash
# Arunika POS - Health & Service Verification Script

GREEN='\033[032m'
RED='\033[031m'
YELLOW='\033[1;33m'
CYAN='\033[036m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================================${NC}"
echo -e "${YELLOW}       ARUNIKA POS SUITE - SYSTEM HEALTH CHECK          ${NC}"
echo -e "${CYAN}========================================================${NC}"
echo ""

ALL_HEALTHY=true

check_service() {
    local name="$1"
    local url="$2"
    local expected_code="$3"

    echo -n "Checking $name ($url)... "
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)

    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}[OK - HTTP $response]${NC}"
    else
        echo -e "${RED}[FAIL - Got HTTP '$response', expected '$expected_code']${NC}"
        ALL_HEALTHY=false
    fi
}

# 1. Forecasting Engine
check_service "Python Forecasting Engine" "http://127.0.0.1:8001/health" "200"

# 2. Laravel Backend API Health
check_service "Laravel Backend Core API" "http://127.0.0.1:8000/api/health" "200"

# 3. POS Frontend
check_service "POS & Admin Frontend" "http://127.0.0.1:5173" "200"

# 4. Cafe QR Frontend
check_service "Cafe Self-Order Frontend" "http://127.0.0.1:5174" "200"

echo ""
echo -e "${CYAN}--------------------------------------------------------${NC}"
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ SEMUA LAYANAN BERJALAN NORMAL DAN SIAP DIGUNAKAN!${NC}"
    echo ""
    echo -e "Akses Layanan:"
    echo -e " - POS & Admin Panel:  http://localhost:5173"
    echo -e " - Cafe QR Order:     http://localhost:5174"
    echo -e " - Backend API:       http://localhost:8000/api"
    echo -e " - AI Forecast Docs:  http://localhost:8001/docs"
    echo ""
    echo -e "Akun Default (Seeded):"
    echo -e " - Superadmin/Owner:  owner@pos.com / password"
    echo -e " - Admin:             admin@pos.com / password"
    echo -e " - Kasir:             kasir@pos.com / password"
    echo -e " - Dapur:             kitchen@pos.com / password"
    exit 0
else
    echo -e "${RED}✗ Beberapa layanan gagal merespons. Periksa log proses/container terkait.${NC}"
    echo -e "  - Docker log: docker compose logs -f"
    echo -e "  - Laravel log: tail -n 50 pos-backend/storage/logs/laravel.log"
    echo -e "  - Python log: journalctl -u arunika-forecasting -n 50"
    exit 1
fi
