#!/usr/bin/env bash
# Записывает VDS_* секреты в GitHub Actions (нужен gh auth login или GH_TOKEN).
set -euo pipefail

REPO="${GITHUB_REPO:-BtkPavel/INCLAVE-ERP}"
KEY_PATH="${1:-$HOME/.ssh/inclave_erp_deploy}"
VDS_HOST="${VDS_HOST:-87.199.192.18}"
VDS_USER="${VDS_USER:-root}"

find_gh() {
  if [[ -n "${GH_BIN:-}" && -x "$GH_BIN" ]]; then
    echo "$GH_BIN"
    return
  fi
  if command -v gh &>/dev/null; then
    command -v gh
    return
  fi
  for candidate in \
    /opt/homebrew/bin/gh \
    /usr/local/bin/gh \
    /tmp/gh_2.94.0_macOS_arm64/bin/gh; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return
    fi
  done
  return 1
}

GH="$(find_gh)" || {
  echo "GitHub CLI (gh) не найден. Установите: brew install gh"
  exit 1
}

if [[ ! -f "$KEY_PATH" ]]; then
  echo "Ключ не найден: $KEY_PATH"
  exit 1
fi

if ! "$GH" auth status &>/dev/null; then
  echo "Нет доступа к GitHub. Выполните:"
  echo "  $GH auth login --web --scopes repo,workflow"
  echo "или задайте GH_TOKEN с правами repo."
  exit 1
fi

echo "==> Запись секретов в $REPO ..."
"$GH" secret set VDS_HOST --repo "$REPO" --body "$VDS_HOST"
"$GH" secret set VDS_USER --repo "$REPO" --body "$VDS_USER"
"$GH" secret set VDS_SSH_KEY --repo "$REPO" < "$KEY_PATH"

echo "==> Готово. Секреты VDS_HOST, VDS_USER, VDS_SSH_KEY установлены."
