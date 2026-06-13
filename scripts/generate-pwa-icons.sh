#!/usr/bin/env bash
# Генерация PNG-иконок PWA из public/favicon.png (512x512)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
SRC="$PUBLIC/favicon.png"

if [[ ! -f "$SRC" ]]; then
  echo "Файл не найден: $SRC" >&2
  exit 1
fi

if command -v sips >/dev/null; then
  sips -z 512 512 "$SRC" --out "$SRC" >/dev/null
  sips -z 192 192 "$SRC" --out "$PUBLIC/icon-192.png" >/dev/null
  sips -z 512 512 "$SRC" --out "$PUBLIC/icon-512.png" >/dev/null
  sips -z 180 180 "$SRC" --out "$PUBLIC/apple-touch-icon.png" >/dev/null
  sips -z 32 32 "$SRC" --out "$PUBLIC/favicon-32.png" >/dev/null
else
  echo "sips not found (macOS). Install ImageMagick or run on Mac." >&2
  exit 1
fi

echo "PWA icons updated from favicon.png"
