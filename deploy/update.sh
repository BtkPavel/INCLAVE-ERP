#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
APP_DIR="${APP_DIR:-/var/www/inclave-erp}"

cd "$SRC_DIR"

echo "==> git pull..."
git pull --ff-only

echo "==> npm ci && build..."
npm ci
npm run build

echo "==> Обновление статики..."
find "$APP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -r dist/* "$APP_DIR"/
chown -R www-data:www-data "$APP_DIR"

echo "==> Готово: http://$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
