#!/bin/bash
# ==============================================================================
# Arunika POS - Ubuntu 24.04 LTS Complete Dependency Installer
# Menginstal seluruh dependensi sistem: PHP 8.3, Composer, Node.js 20, Python 3, Nginx, SQLite
# ==============================================================================

set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
CYAN='\033[036m'
RED='\033[031m'
NC='\033[0m'

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Skrip ini harus dijalankan dengan hak akses root atau sudo!${NC}"
    echo "Gunakan: sudo bash install-dependencies-ubuntu24.sh"
    exit 1
fi

echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}  INSTALASI OTOMATIS DEPENDENSI ARUNIKA POS (UBUNTU 24.04 LTS)  ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. Hindari pop-up dialog interaktif (needrestart / debconf di Ubuntu 24.04)
export DEBIAN_FRONTEND=noninteractive
if [ -f /etc/needrestart/needrestart.conf ]; then
    sed -i "s/#\$nrconf{restart} = 'i';/\$nrconf{restart} = 'a';/g" /etc/needrestart/needrestart.conf 2>/dev/null || true
fi

# 2. Setup Swap 2GB (Sangat krusial untuk mencegah Out-Of-Memory saat build Vite & Composer)
echo -e "${GREEN}[1/6] Memeriksa & Menyiapkan Swap Memory 2GB...${NC}"
if [ "$(swapon --show | wc -l)" -le 1 ]; then
    echo "Membuat berkas swap 2GB..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}✓ Swap 2GB berhasil diaktifkan.${NC}"
else
    echo -e "${GREEN}✓ Swap sudah aktif di server ini.${NC}"
fi

# 3. Update repository & Install utilitas dasar + Nginx + SQLite
echo -e "${GREEN}[2/6] Memperbarui repositori dan menginstal utilitas sistem...${NC}"
apt-get update -y
apt-get install -y curl wget git unzip zip sqlite3 nginx ufw software-properties-common ca-certificates gnupg

# 4. Install PHP 8.3 & Ekstensi Resmi Ubuntu 24.04 (Bawaan Asli Noble Numbat)
echo -e "${GREEN}[3/6] Menginstal PHP 8.3-FPM & ekstensi yang dibutuhkan...${NC}"
apt-get install -y \
    php8.3-fpm \
    php8.3-cli \
    php8.3-sqlite3 \
    php8.3-gd \
    php8.3-curl \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-zip \
    php8.3-bcmath \
    php8.3-opcache

# Optimasi konfigurasi PHP-FPM untuk efisiensi RAM
sed -i 's/^pm = .*/pm = ondemand/' /etc/php/8.3/fpm/pool.d/www.conf 2>/dev/null || true
sed -i 's/^pm.max_children = .*/pm.max_children = 10/' /etc/php/8.3/fpm/pool.d/www.conf 2>/dev/null || true
systemctl restart php8.3-fpm
systemctl enable php8.3-fpm

# 5. Install Composer (PHP Dependency Manager)
echo -e "${GREEN}[4/6] Menginstal Composer...${NC}"
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    echo -e "${GREEN}✓ Composer berhasil diinstal.${NC}"
else
    echo -e "${GREEN}✓ Composer sudah terinstal.$(composer --version | head -n 1)${NC}"
fi

# 6. Install Python 3 & venv (Untuk AI Forecasting Engine)
echo -e "${GREEN}[5/6] Menginstal Python 3 & python3-venv...${NC}"
apt-get install -y python3 python3-pip python3-venv

# 7. Install Node.js 20 LTS & npm (NodeSource Repository Resmi)
echo -e "${GREEN}[6/6] Menginstal Node.js 20 LTS & npm...${NC}"
if ! command -v node &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js $(node -v) & npm $(npm -v) berhasil diinstal.${NC}"
else
    echo -e "${GREEN}✓ Node.js $(node -v) sudah terpasang.${NC}"
fi

# Konfigurasi Firewall Dasar
ufw allow OpenSSH 2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}  VERIFIKASI SEMUA DEPENDENSI YANG BERHASIL DIINSTAL:           ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "✓ PHP:       $(php -v | head -n 1)"
echo -e "✓ Composer:  $(composer --version 2>/dev/null | head -n 1)"
echo -e "✓ Node.js:   $(node -v)"
echo -e "✓ NPM:       $(npm -v)"
echo -e "✓ Python:    $(python3 --version)"
echo -e "✓ Nginx:     $(nginx -v 2>&1)"
echo -e "✓ SQLite:    $(sqlite3 --version | awk '{print $1}')"
echo -e "✓ PHP-FPM:   $(systemctl is-active php8.3-fpm)"
echo ""
echo -e "${GREEN}Semua dependensi server Ubuntu 24.04 telah lengkap 100%!${NC}"
echo -e "Langkah selanjutnya: Anda bisa langsung menjalankan ${YELLOW}sudo bash setup-native-vps.sh${NC}"
