#!/bin/bash
# Arunika POS - Health & Service Verification Script
# Mendukung mode Native Nginx (Port 80) dan Docker Compose (Port 5173/5174/8000)

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

# 1. Selalu periksa Python Forecasting Engine (Port 8001)
check_service "Python Forecasting Engine" "http://127.0.0.1:8001/health" "200"

# 2. Deteksi Mode: Native Nginx (Port 80) vs Docker (Port 8000/5173)
if curl -s -o /dev/null --connect-timeout 2 "http://127.0.0.1/api/health"; then
    MODE="NATIVE"
elif curl -s -o /dev/null --connect-timeout 2 "http://127.0.0.1:8000/api/health"; then
    MODE="DOCKER"
else
    # Cek apakah port 80 aktif
    if curl -s -o /dev/null --connect-timeout 2 "http://127.0.0.1/"; then
        MODE="NATIVE"
    else
        MODE="DOCKER"
    fi
fi

if [ "$MODE" = "NATIVE" ]; then
    echo -e "${CYAN}Mode Terdeteksi: NATIVE UBUNTU (Nginx Port 80)${NC}"
    check_service "Laravel Backend Core API" "http://127.0.0.1/api/health" "200"
    check_service "POS & Admin Frontend" "http://127.0.0.1/" "200"
    check_service "Cafe Self-Order Frontend" "http://127.0.0.1/menu" "200"
else
    echo -e "${CYAN}Mode Terdeteksi: DOCKER / STANDALONE (Port 8000/5173/5174)${NC}"
    check_service "Laravel Backend Core API" "http://127.0.0.1:8000/api/health" "200"
    check_service "POS & Admin Frontend" "http://127.0.0.1:5173" "200"
    check_service "Cafe Self-Order Frontend" "http://127.0.0.1:5174" "200"
fi

echo ""
echo -e "${CYAN}--------------------------------------------------------${NC}"
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ SEMUA LAYANAN BERJALAN NORMAL DAN SIAP DIGUNAKAN!${NC}"
    echo ""
    echo -e "Akses Layanan dari Browser:"
    if [ "$MODE" = "NATIVE" ]; then
        echo -e " - POS & Admin Panel:  http://<IP_VPS>/"
        echo -e " - Cafe QR Order:     http://<IP_VPS>/menu"
        echo -e " - Backend API:       http://<IP_VPS>/api"
        echo -e " - AI Forecast Docs:  http://<IP_VPS>:8001/docs"
    else
        echo -e " - POS & Admin Panel:  http://<IP_VPS>:5173"
        echo -e " - Cafe QR Order:     http://<IP_VPS>:5174"
        echo -e " - Backend API:       http://<IP_VPS>:8000/api"
        echo -e " - AI Forecast Docs:  http://<IP_VPS>:8001/docs"
    fi
    echo ""
    echo -e "Akun Default (Seeded):"
    echo -e " - Superadmin/Owner:  owner@pos.com / password"
    echo -e " - Admin:             admin@pos.com / password"
    echo -e " - Kasir:             kasir@pos.com / password"
    echo -e " - Dapur:             kitchen@pos.com / password"
    exit 0
else
    echo -e "${RED}✗ Beberapa layanan gagal merespons. Periksa log terkait:${NC}"
    if [ "$MODE" = "NATIVE" ]; then
        echo -e "  - Status Nginx: systemctl status nginx"
        echo -e "  - Status PHP-FPM: systemctl status php8.4-fpm"
        echo -e "  - Nginx error: tail -n 50 /var/log/nginx/error.log"
        echo -e "  - Laravel log: tail -n 50 pos-backend/storage/logs/laravel.log"
    else
        echo -e "  - Docker log: docker compose logs -f"
    fi
    exit 1
fi
