#!/usr/bin/env bash
# Самоподписанный SSL для доступа по IP (без домена).
# Браузер покажет предупреждение — это нормально для self-signed.
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
SERVER_IP="${SERVER_IP:-87.199.192.18}"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
CERT_FILE="${CERT_DIR}/inclave-erp.crt"
KEY_FILE="${KEY_DIR}/inclave-erp.key"
DAYS="${SSL_DAYS:-3650}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Установка openssl..."
apt-get update -qq
apt-get install -y -qq openssl nginx

if [[ ! -f "$CERT_FILE" ]] || [[ ! -f "$KEY_FILE" ]]; then
  echo "==> Генерация самоподписанного сертификата для IP ${SERVER_IP}..."
  openssl req -x509 -nodes -days "$DAYS" -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=INCLAVE LLC/CN=INCLAVE ERP" \
    -addext "subjectAltName=IP:${SERVER_IP}"
  chmod 600 "$KEY_FILE"
  chmod 644 "$CERT_FILE"
else
  echo "==> Сертификат уже существует: ${CERT_FILE}"
fi

echo "==> Применение конфигурации Nginx..."
cp "${SRC_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/inclave-erp
ln -sf /etc/nginx/sites-available/inclave-erp /etc/nginx/sites-enabled/inclave-erp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Firewall: порт 443..."
ufw allow 443/tcp >/dev/null 2>&1 || true

echo ""
echo "============================================"
echo "  SSL настроен (самоподписанный)"
echo "  Откройте: https://${SERVER_IP}/"
echo ""
echo "  Браузер покажет предупреждение о безопасности."
echo "  Нажмите «Дополнительно» → «Перейти на сайт»."
echo "============================================"
