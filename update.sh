#!/bin/bash
# ==============================================================================
# Arunika POS - Script Update Setelah Git Pull
# Jalankan: bash update.sh
# Tidak perlu sudo - script ini auto-escalate yang perlu saja
# ==============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$BASE_DIR/pos-backend"
POS_FRONTEND_DIR="$BASE_DIR/pos-frontend"
CAFE_FRONTEND_DIR="$BASE_DIR/cafe-frontend"

echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}   ARUNIKA POS - UPDATE DEPLOYMENT SCRIPT                      ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "Direktori: ${YELLOW}${BASE_DIR}${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. GIT PULL
# ------------------------------------------------------------------------------
echo -e "${GREEN}[1/6] Mengambil update terbaru dari Git...${NC}"
git -C "$BASE_DIR" pull

echo ""

# ------------------------------------------------------------------------------
# 2. BACKEND - Composer & Migrasi
# ------------------------------------------------------------------------------
echo -e "${GREEN}[2/6] Update dependensi PHP & migrasi database...${NC}"
cd "$BACKEND_DIR"

# Install/update composer packages jika composer.json berubah
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader --no-interaction

# Jalankan migrasi baru (aman, tidak hapus data)
php artisan migrate --force

echo -e "${GREEN}✔ Backend dependencies & migrasi selesai.${NC}"
echo ""

# ------------------------------------------------------------------------------
# 3. PERBAIKI PERMISSION (Root cause utama error 500)
# ------------------------------------------------------------------------------
echo -e "${GREEN}[3/6] Memperbaiki permission file...${NC}"

# WAJIB: bootstrap/cache harus dihapus manual dulu agar bisa di-replace
sudo rm -f "$BACKEND_DIR/bootstrap/cache"/*.php 2>/dev/null || true

# Semua folder yang di-write oleh PHP-FPM (www-data) harus milik www-data
sudo chown -R www-data:www-data \
    "$BACKEND_DIR/storage" \
    "$BACKEND_DIR/bootstrap/cache" \
    "$BACKEND_DIR/database"

sudo chmod -R 775 \
    "$BACKEND_DIR/storage" \
    "$BACKEND_DIR/bootstrap/cache" \
    "$BACKEND_DIR/database"

# Pastikan public/uploads ada dan bisa ditulis
sudo mkdir -p "$BACKEND_DIR/public/uploads"
sudo chown -R www-data:www-data "$BACKEND_DIR/public/uploads"
sudo chmod -R 775 "$BACKEND_DIR/public/uploads"

echo -e "${GREEN}✔ Permission diperbaiki.${NC}"
echo ""

# ------------------------------------------------------------------------------
# 4. CLEAR CACHE LARAVEL
# ------------------------------------------------------------------------------
echo -e "${GREEN}[4/6] Membersihkan cache Laravel...${NC}"
cd "$BACKEND_DIR"
php artisan optimize:clear
echo -e "${GREEN}✔ Cache dibersihkan.${NC}"
echo ""

# ------------------------------------------------------------------------------
# 5. BUILD FRONTEND (Hanya jika ada perubahan di src/)
# ------------------------------------------------------------------------------
echo -e "${GREEN}[5/6] Mengecek perubahan frontend...${NC}"

# Cek apakah ada perubahan di pos-frontend
POS_CHANGED=$(git -C "$BASE_DIR" diff HEAD@{1} HEAD --name-only 2>/dev/null | grep "^pos-frontend/src" | wc -l)
CAFE_CHANGED=$(git -C "$BASE_DIR" diff HEAD@{1} HEAD --name-only 2>/dev/null | grep "^cafe-frontend/src" | wc -l)
POS_ENV_CHANGED=$(git -C "$BASE_DIR" diff HEAD@{1} HEAD --name-only 2>/dev/null | grep "^pos-frontend/\(package\|vite\)" | wc -l)
CAFE_ENV_CHANGED=$(git -C "$BASE_DIR" diff HEAD@{1} HEAD --name-only 2>/dev/null | grep "^cafe-frontend/\(package\|vite\)" | wc -l)

if [ "$POS_CHANGED" -gt 0 ] || [ "$POS_ENV_CHANGED" -gt 0 ]; then
    echo -e "${YELLOW}  → Perubahan terdeteksi di pos-frontend, build ulang...${NC}"
    cd "$POS_FRONTEND_DIR"
    # Pastikan .env ada
    if [ ! -f .env ]; then
        echo "VITE_API_URL=/api" > .env
    fi
    npm install --prefer-offline 2>/dev/null || npm install
    npm run build
    sudo chmod -R 755 "$POS_FRONTEND_DIR/dist"
    echo -e "${GREEN}  ✔ pos-frontend berhasil di-build.${NC}"
else
    echo -e "  → Tidak ada perubahan di pos-frontend, skip build."
fi

if [ "$CAFE_CHANGED" -gt 0 ] || [ "$CAFE_ENV_CHANGED" -gt 0 ]; then
    echo -e "${YELLOW}  → Perubahan terdeteksi di cafe-frontend, build ulang...${NC}"
    cd "$CAFE_FRONTEND_DIR"
    if [ ! -f .env ]; then
        echo "VITE_API_BASE_URL=/api" > .env
    fi
    npm install --prefer-offline 2>/dev/null || npm install
    npm run build
    sudo chmod -R 755 "$CAFE_FRONTEND_DIR/dist"
    echo -e "${GREEN}  ✔ cafe-frontend berhasil di-build.${NC}"
else
    echo -e "  → Tidak ada perubahan di cafe-frontend, skip build."
fi

echo ""

# ------------------------------------------------------------------------------
# 6. RESTART SERVICES & VERIFIKASI
# ------------------------------------------------------------------------------
echo -e "${GREEN}[6/6] Restart services & verifikasi...${NC}"
sudo systemctl reload php8.4-fpm
sudo systemctl reload nginx

sleep 2

# Quick health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1/api/login \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email":"owner@pos.com","password":"password"}' 2>/dev/null || echo "000")

echo ""
echo -e "${CYAN}================================================================${NC}"
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✔ UPDATE BERHASIL! Login API: HTTP $HTTP_STATUS${NC}"
else
    echo -e "${RED}✗ Login API mengembalikan HTTP $HTTP_STATUS - cek log:${NC}"
    echo -e "  sudo tail -n 20 /var/log/nginx/error.log"
    echo -e "  tail -n 20 $BACKEND_DIR/storage/logs/laravel.log"
fi
echo -e "${CYAN}================================================================${NC}"
