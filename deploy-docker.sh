#!/bin/bash
# Arunika POS - 1-Click Docker Compose Deployment Script
set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
CYAN='\033[036m'
RED='\033[031m'
NC='\033[0m'

echo -e "${CYAN}========================================================${NC}"
echo -e "${YELLOW}   ARUNIKA POS - DOCKER COMPOSE DEPLOYMENT LAUNCHER     ${NC}"
echo -e "${CYAN}========================================================${NC}"
echo ""

# Periksa apakah Docker terpasang
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker tidak ditemukan! Silakan install Docker terlebih dahulu.${NC}"
    echo "Panduan: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Tentukan perintah docker compose yang aktif
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose plugin maupun binary tidak ditemukan!${NC}"
    exit 1
fi

echo -e "${GREEN}[1/3] Membangun dan menjalankan container Arunika Suite...${NC}"
$DOCKER_COMPOSE_CMD up -d --build

echo ""
echo -e "${GREEN}[2/3] Menunggu inisialisasi database dan kesiapan layanan (15 detik)...${NC}"
sleep 15

echo ""
echo -e "${GREEN}[3/3] Menjalankan verifikasi kesehatan sistem...${NC}"
chmod +x ./check-health.sh 2>/dev/null || true
./check-health.sh
