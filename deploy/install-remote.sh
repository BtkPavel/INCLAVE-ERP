#!/usr/bin/env bash
# Запуск с локальной машины: ./deploy/install-remote.sh root@87.199.192.18
set -euo pipefail

TARGET="${1:-root@87.199.192.18}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Подключение к ${TARGET}..."
echo "Введите пароль root, когда SSH запросит."
echo ""

ssh -o StrictHostKeyChecking=accept-new "$TARGET" 'bash -s' < "$SCRIPT_DIR/setup-server.sh"
