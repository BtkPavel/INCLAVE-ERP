#!/usr/bin/env bash
# Выпуск Let's Encrypt для erp-inclave.pro (запускать на VDS от root после настройки DNS).
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
DOMAIN="${DOMAIN:-erp-inclave.pro}"
WWW="www.${DOMAIN}"
SERVER_IP="${SERVER_IP:-87.199.192.18}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
WEBROOT="/var/www/inclave-erp"

export DEBIAN_FRONTEND=noninteractive

echo "==> Проверка DNS для ${DOMAIN}..."
resolved="$(dig +short "${DOMAIN}" A | tail -1)"
if [[ "${resolved}" != "${SERVER_IP}" ]]; then
  echo "ОШИБКА: ${DOMAIN} указывает на «${resolved:-пусто}», нужно ${SERVER_IP}" >&2
  echo "Пропишите A-записи @ и www → ${SERVER_IP} у регистратора и повторите." >&2
  exit 1
fi

www_resolved="$(dig +short "${WWW}" A | tail -1)"
if [[ -n "${www_resolved}" && "${www_resolved}" != "${SERVER_IP}" ]]; then
  echo "ОШИБКА: ${WWW} указывает на ${www_resolved}, нужно ${SERVER_IP}" >&2
  exit 1
fi

echo "==> Установка certbot..."
apt-get update -qq
apt-get install -y -qq certbot

echo "==> Временный nginx (HTTP для домена)..."
cp "${SRC_DIR}/deploy/nginx-bootstrap.conf" /etc/nginx/sites-available/inclave-erp
ln -sf /etc/nginx/sites-available/inclave-erp /etc/nginx/sites-enabled/inclave-erp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Выпуск сертификата..."
certbot certonly \
  --webroot \
  -w "${WEBROOT}" \
  -d "${DOMAIN}" \
  -d "${WWW}" \
  --non-interactive \
  --agree-tos \
  --no-eff-email \
  -m "${EMAIL}"

echo "==> Финальный nginx (HTTPS)..."
cp "${SRC_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/inclave-erp
nginx -t
systemctl reload nginx

echo "==> Автообновление сертификата..."
systemctl enable certbot.timer >/dev/null 2>&1 || true
systemctl start certbot.timer >/dev/null 2>&1 || true

echo ""
echo "============================================"
echo "  Домен настроен"
echo "  https://${DOMAIN}/"
echo "  https://${WWW}/"
echo "============================================"
