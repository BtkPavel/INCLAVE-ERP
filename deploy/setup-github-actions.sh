#!/usr/bin/env bash
# Однократная настройка автодеплоя GitHub Actions → VDS.
set -euo pipefail

KEY_PATH="${1:-$HOME/.ssh/inclave_erp_deploy}"
SERVER="${2:-root@87.199.192.18}"

if [[ ! -f "$KEY_PATH" ]]; then
  echo "==> Генерация SSH-ключа для деплоя..."
  ssh-keygen -t ed25519 -C "inclave-erp-deploy" -f "$KEY_PATH" -N ""
fi

echo "==> Копирование ключа на сервер (введите пароль root)..."
ssh-copy-id -i "${KEY_PATH}.pub" "$SERVER"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if bash "${SCRIPT_DIR}/set-github-secrets.sh" "$KEY_PATH"; then
  echo ""
  echo "Автодеплой настроен: каждый push в main задеплоит сайт."
else
  echo ""
  echo "============================================"
  echo "  Ключ на сервере. Осталось добавить секреты в GitHub:"
  echo "  https://github.com/BtkPavel/INCLAVE-ERP/settings/secrets/actions"
  echo ""
  echo "  Вариант 1 — автоматически (после gh auth login):"
  echo "    bash deploy/set-github-secrets.sh"
  echo ""
  echo "  Вариант 2 — вручную:"
  echo "    VDS_HOST    = 87.199.192.18"
  echo "    VDS_USER    = root"
  echo "    VDS_SSH_KEY = содержимое ${KEY_PATH}"
  echo "============================================"
fi
