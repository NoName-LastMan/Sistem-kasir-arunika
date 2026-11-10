#!/bin/bash
# Arunika POS - Automated Native Deployment for Ubuntu Linux VPS (1-2GB RAM)
# Tested on Ubuntu 22.04 / 24.04 LTS
set -e

GREEN='\033[032m'
YELLOW='\033[1;33m'
CYAN='\033[036m'
RED='\033[031m'
NC='\033[0m'

if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Skrip ini harus dijalankan dengan hak akses root / sudo!${NC}"
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive
export COMPOSER_ALLOW_SUPERUSER=1
if [ -f /etc/needrestart/needrestart.conf ]; then
    sed -i "s/#\$nrconf{restart} = 'i';/\$nrconf{restart} = 'a';/g" /etc/needrestart/needrestart.conf 2>/dev/null || true
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}========================================================${NC}"
echo -e "${YELLOW}   ARUNIKA POS - AUTOMATED UBUNTU VPS DEPLOYMENT        ${NC}"
echo -e "${CYAN}========================================================${NC}"
echo -e "Direktori Aplikasi: ${BASE_DIR}"
echo ""

# 1. SETUP SWAP (Mencegah OOM saat npm build / composer di VPS 1GB)
echo -e "${GREEN}[1/8] Memeriksa Swap Memory...${NC}"
if [ "$(swapon --show | wc -l)" -le 1 ]; then
    echo "Membuat Swap 2GB..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}✓ Swap 2GB berhasil diaktifkan.${NC}"
else
    echo -e "${GREEN}✓ Swap sudah aktif.${NC}"
fi

# 2. INSTALL SYSTEM PACKAGES, PHP 8.4, PYTHON3, NODEJS 20
echo -e "${GREEN}[2/8] Menginstal paket sistem & dependensi (PHP 8.4)...${NC}"
apt-get update -y
apt-get install -y curl wget git unzip zip software-properties-common ufw nginx sqlite3 ca-certificates gnupg

# Tambah PPA Ondrej PHP untuk PHP 8.4
if ! grep -q "^deb .*ondrej/php" /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null; then
    add-apt-repository ppa:ondrej/php -y 2>/dev/null || true
    apt-get update -y
fi

apt-get install -y php8.4-fpm php8.4-cli php8.4-sqlite3 php8.4-gd \
    php8.4-curl php8.4-mbstring php8.4-xml php8.4-zip php8.4-bcmath php8.4-opcache

# Optimasi konfigurasi PHP 8.4-FPM
sed -i 's/^pm = .*/pm = ondemand/' /etc/php/8.4/fpm/pool.d/www.conf 2>/dev/null || true
sed -i 's/^pm.max_children = .*/pm.max_children = 10/' /etc/php/8.4/fpm/pool.d/www.conf 2>/dev/null || true
systemctl restart php8.4-fpm
systemctl enable php8.4-fpm

apt-get install -y python3 python3-pip python3-venv

# Install Node.js 20 jika belum ada
if ! command -v node &> /dev/null; then
    echo "Menginstal Node.js 20 LTS..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes 2>/dev/null || true
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
fi

# Install Composer jika belum ada
if ! command -v composer &> /dev/null; then
    echo "Menginstal Composer..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
fi

# 3. SETUP LARAVEL BACKEND (pos-backend)
echo -e "${GREEN}[3/8] Menyiapkan pos-backend...${NC}"
cd "$BASE_DIR/pos-backend"

# Buat .env jika belum ada
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Pastikan pengaturan SQLite WAL & File Cache
sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' .env
sed -i 's/^APP_ENV=.*/APP_ENV=production/' .env
sed -i 's/^APP_DEBUG=.*/APP_DEBUG=false/' .env

composer install --no-dev --optimize-autoloader --no-interaction

# Generate key jika kosong
php artisan key:generate --force

# Database SQLite WAL mode
mkdir -p database storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs public/uploads
touch database/database.sqlite

php artisan migrate --force --seed || true
php artisan storage:link --force || true

# Set izin ke www-data
chown -R www-data:www-data storage bootstrap/cache database public/uploads
chmod -R 775 storage bootstrap/cache database public/uploads

php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# 4. SETUP PYTHON FASTAPI ENGINE (forecasting-engine)
echo -e "${GREEN}[4/8] Menyiapkan Python Forecasting Microservice...${NC}"
cd "$BASE_DIR/forecasting-engine"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Buat Systemd Service Daemon
cat <<EOF > /etc/systemd/system/arunika-forecasting.service
[Unit]
Description=Arunika Forecasting Engine Microservice
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$BASE_DIR/forecasting-engine
ExecStart=$BASE_DIR/forecasting-engine/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 --workers 1 --limit-concurrency 50 --no-access-log
Restart=always
RestartSec=5
KillMode=process
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=arunika-forecast

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl restart arunika-forecasting
systemctl enable arunika-forecasting

# 5. BUILD FRONTENDS (pos-frontend & cafe-frontend)
echo -e "${GREEN}[5/8] Membangun Frontend (POS & Cafe Guest)...${NC}"
cd "$BASE_DIR/pos-frontend"
npm install
npm run build

cd "$BASE_DIR/cafe-frontend"
npm install
npm run build

# 6. SETUP NGINX CONFIGURATION
echo -e "${GREEN}[6/8] Mengonfigurasi Nginx...${NC}"
cat <<EOF > /etc/nginx/sites-available/arunika-pos.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
gzip_min_length 1024;
gzip_vary on;

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root $BASE_DIR/pos-frontend/dist;
    index index.html;

    client_max_body_size 15M;

    # 1. POS Frontend & Admin Dashboard
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 2. Cafe Guest Self-Order (di path /menu)
    location /menu {
        alias $BASE_DIR/cafe-frontend/dist;
        try_files \$uri \$uri/ /menu/index.html;
    }

    # 3. Uploads Folder
    location /uploads/ {
        alias $BASE_DIR/pos-backend/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files \$uri =404;
    }

    # 4. SSE Order Stream (Wajib Non-Buffering)
    location /api/orders/stream {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $BASE_DIR/pos-backend/public/index.php;
        fastcgi_buffering off;
        fastcgi_cache off;
        fastcgi_read_timeout 120s;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        chunked_transfer_encoding off;
    }

    # 5. Laravel API
    location /api {
        alias $BASE_DIR/pos-backend/public;
        try_files \$uri \$uri/ @laravel;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/run/php/php8.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $BASE_DIR/pos-backend/public/index.php;
            fastcgi_read_timeout 60s;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/\$1 last;
    }

    # Keamanan: Tolak akses berkas sensitif
    location ~ /\.(?!well-known).* {
        deny all;
    }
    location ~* \.sqlite$ {
        deny all;
    }
}
EOF

# Aktifkan site Nginx
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
ln -sf /etc/nginx/sites-available/arunika-pos.conf /etc/nginx/sites-enabled/arunika-pos.conf
nginx -t
systemctl reload nginx
systemctl restart php8.4-fpm

# 7. SETUP CRON SCHEDULER
echo -e "${GREEN}[7/8] Menyiapkan Cron Scheduler Laravel...${NC}"
CRON_JOB="* * * * * cd $BASE_DIR/pos-backend && php artisan schedule:run >> /dev/null 2>&1"
(crontab -u www-data -l 2>/dev/null | grep -F -v "artisan schedule:run"; echo "$CRON_JOB") | crontab -u www-data -

# 8. FIREWALL (UFW)
echo -e "${GREEN}[8/8] Membuka port firewall (SSH & HTTP)...${NC}"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true

echo ""
echo -e "${CYAN}========================================================${NC}"
echo -e "${YELLOW}✓ DEPLOYMENT UBUNTU NATIVE SELESAI DENGAN SUKSES!       ${NC}"
echo -e "${CYAN}========================================================${NC}"
echo -e "Website sudah aktif dan dapat diakses melalui browser:"
echo -e " - POS & Admin Kasir: http://<IP_VPS>/"
echo -e " - Cafe QR Guest:     http://<IP_VPS>/menu"
echo -e " - Backend API:       http://<IP_VPS>/api"
echo ""
echo -e "Akun Login Default:"
echo -e " - Superadmin/Owner: owner@pos.com / password"
echo -e " - Admin Toko:       admin@pos.com / password"
echo -e " - Kasir:            kasir@pos.com / password"
echo -e " - Dapur/KDS:        kitchen@pos.com / password"
