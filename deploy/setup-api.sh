#!/usr/bin/env bash
# Установка и перезапуск API-сервера синхронизации данных.
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/inclave-erp}"
SERVICE_NAME="inclave-api"

if command -v apt-get >/dev/null && ! dpkg -s build-essential >/dev/null 2>&1; then
  echo "==> Установка build-essential для SQLite..."
  apt-get install -y -qq build-essential python3
fi

cd "$SRC_DIR/server"

if [[ ! -f .env ]]; then
  echo "==> Создание server/.env из примера..."
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
  echo "    Задайте DIRECTOR_PASSWORD и ACCOUNTANT_PASSWORD в $SRC_DIR/server/.env"
fi

echo "==> npm ci (server)..."
npm ci --omit=dev

mkdir -p "$(dirname "$(grep DATABASE_PATH .env | cut -d= -f2)")"

if [[ ! -f "/etc/systemd/system/${SERVICE_NAME}.service" ]]; then
  echo "==> Установка systemd unit..."
  cp "$SRC_DIR/deploy/inclave-api.service" "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
fi

systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME"
echo "==> API запущен (порт 4000)"
