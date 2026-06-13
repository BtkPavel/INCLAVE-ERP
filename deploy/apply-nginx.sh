#!/usr/bin/env bash
# Применить nginx-конфиг на сервере (запускать на VDS от root).
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"

cp "${SRC_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/inclave-erp
ln -sf /etc/nginx/sites-available/inclave-erp /etc/nginx/sites-enabled/inclave-erp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "Nginx обновлён."
echo "HTTP:  http://$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
echo "HTTPS: https://$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
