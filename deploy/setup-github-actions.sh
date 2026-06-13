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

echo ""
echo "============================================"
echo "  Добавьте секреты в GitHub:"
echo "  https://github.com/BtkPavel/INCLAVE-ERP/settings/secrets/actions"
echo ""
echo "  VDS_HOST        = 87.199.192.18"
echo "  VDS_USER        = root"
echo "  VDS_SSH_KEY     = содержимое файла:"
echo "                    ${KEY_PATH}"
echo ""
echo "  После этого каждый push в main задеплоит сайт."
echo "============================================"
echo ""
cat "$KEY_PATH"
