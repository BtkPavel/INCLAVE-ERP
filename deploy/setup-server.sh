#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/BtkPavel/INCLAVE-ERP.git}"
SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
APP_DIR="${APP_DIR:-/var/www/inclave-erp}"
NODE_MAJOR="${NODE_MAJOR:-22}"

export DEBIAN_FRONTEND=noninteractive

echo "==> Обновление пакетов..."
apt-get update -qq
apt-get install -y -qq curl git nginx ufw

if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  echo "==> Установка Node.js ${NODE_MAJOR}..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Node $(node -v), npm $(npm -v)"

if [[ -d "$SRC_DIR/.git" ]]; then
  echo "==> Обновление репозитория..."
  git -C "$SRC_DIR" pull --ff-only
else
  echo "==> Клонирование репозитория..."
  git clone "$REPO_URL" "$SRC_DIR"
fi

cd "$SRC_DIR"

if [[ ! -f .env ]]; then
  echo "==> Создание .env из примера (смените пароли!)"
  cp .env.example .env
fi

echo "==> Сборка приложения..."
npm ci
npm run build

echo "==> Публикация в ${APP_DIR}..."
mkdir -p "$APP_DIR"
find "$APP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -r dist/* "$APP_DIR"/
chown -R www-data:www-data "$APP_DIR"

echo "==> SSL и Nginx..."
SERVER_IP="${SERVER_IP:-$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"
export SERVER_IP SRC_DIR
bash "$SRC_DIR/deploy/setup-ssl.sh"

echo "==> Firewall..."
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "============================================"
echo "  INCLAVE ERP развёрнут успешно!"
echo "  Откройте: https://${SERVER_IP}/"
echo "  Исходники: ${SRC_DIR}"
echo "  Статика:   ${APP_DIR}"
echo "  Пароли:    отредактируйте ${SRC_DIR}/.env и запустите deploy/update.sh"
echo "============================================"
