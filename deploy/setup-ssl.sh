#!/usr/bin/env bash
# Самоподписанный SSL для доступа по IP (без домена).
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
SERVER_IP="${SERVER_IP:-87.199.192.18}"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
CERT_FILE="${CERT_DIR}/inclave-erp.crt"
KEY_FILE="${KEY_DIR}/inclave-erp.key"
DAYS="${SSL_DAYS:-3650}"
FORCE_REGEN="${FORCE_REGEN:-0}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Установка пакетов..."
apt-get update -qq
apt-get install -y -qq openssl nginx

generate_cert() {
  local openssl_cnf
  openssl_cnf="$(mktemp)"
  cat > "$openssl_cnf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = RU
ST = Moscow
L = Moscow
O = INCLAVE LLC
CN = INCLAVE ERP

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
IP.1 = ${SERVER_IP}
EOF

  echo "==> Генерация сертификата для IP ${SERVER_IP}..."
  openssl req -x509 -nodes -days "$DAYS" -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -config "$openssl_cnf" \
    -extensions v3_req

  rm -f "$openssl_cnf"
  chmod 600 "$KEY_FILE"
  chmod 644 "$CERT_FILE"
}

if [[ "$FORCE_REGEN" == "1" ]] || [[ ! -f "$CERT_FILE" ]] || [[ ! -f "$KEY_FILE" ]]; then
  generate_cert
else
  echo "==> Сертификат уже есть: ${CERT_FILE}"
  echo "    (для пересоздания: FORCE_REGEN=1 bash deploy/setup-ssl.sh)"
fi

echo "==> Проверка сертификата..."
openssl x509 -in "$CERT_FILE" -noout -subject -dates

echo "==> Nginx..."
cp "${SRC_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/inclave-erp
ln -sf /etc/nginx/sites-available/inclave-erp /etc/nginx/sites-enabled/inclave-erp
rm -f /etc/nginx/sites-enabled/default

if ! nginx -t; then
  echo "ОШИБКА: конфигурация nginx невалидна" >&2
  exit 1
fi

systemctl enable nginx
systemctl restart nginx

echo "==> Firewall..."
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

echo "==> Проверка портов..."
sleep 1
ss -tlnp | grep -E ':80|:443' || { echo "ОШИБКА: nginx не слушает 80/443" >&2; exit 1; }

echo "==> Локальный тест HTTPS..."
if curl -skI --connect-timeout 5 "https://127.0.0.1/" | head -1 | grep -q "200\|301\|302"; then
  echo "    HTTPS на сервере: OK"
else
  echo "ОШИБКА: HTTPS не отвечает локально" >&2
  journalctl -u nginx -n 20 --no-pager
  exit 1
fi

echo ""
echo "============================================"
echo "  SSL настроен"
echo "  HTTP:  http://${SERVER_IP}/"
echo "  HTTPS: https://${SERVER_IP}/"
echo ""
echo "  Браузер покажет предупреждение (self-signed)."
echo "  «Дополнительно» → «Перейти на сайт»"
echo ""
echo "  Если HTTPS снаружи не открывается — откройте"
echo "  порт 443 в панели хостинга (VDS firewall)."
echo "============================================"
