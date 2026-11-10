#!/bin/sh
set -e

# Pastikan folder database dan storage memiliki hak akses yang tepat
mkdir -p /var/www/database
mkdir -p /var/www/storage/framework/cache/data
mkdir -p /var/www/storage/framework/sessions
mkdir -p /var/www/storage/framework/views
mkdir -p /var/www/storage/logs
mkdir -p /var/www/public/uploads

# Buat file SQLite jika belum ada
if [ ! -f /var/www/database/database.sqlite ]; then
    echo "Creating SQLite database..."
    touch /var/www/database/database.sqlite
fi

# Berikan izin ke www-data
chown -R www-data:www-data /var/www/database /var/www/storage /var/www/bootstrap/cache /var/www/public/uploads
chmod -R 775 /var/www/database /var/www/storage /var/www/bootstrap/cache /var/www/public/uploads

# Pastikan symlink storage tersedia
php artisan storage:link --force || true

# Jalankan migrasi dan seeder bila database kosong
echo "Running database migrations..."
php artisan migrate --force --seed || true

# Jalankan command yang diberikan ke container (default: php artisan serve)
exec "$@"
