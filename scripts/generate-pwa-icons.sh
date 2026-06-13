#!/usr/bin/env bash
# Генерация PNG-иконок PWA из favicon.svg
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
TMP="$PUBLIC/icon-source.png"

node -e "
const fs = require('fs');
const svg = fs.readFileSync('$PUBLIC/favicon.svg', 'utf8');
const m = svg.match(/xlink:href=\"data:image\\/png;base64,([^\"]+)\"/);
if (!m) throw new Error('PNG not found in favicon.svg');
fs.writeFileSync('$TMP', Buffer.from(m[1], 'base64'));
"

if command -v sips >/dev/null; then
  sips -z 192 192 "$TMP" --out "$PUBLIC/icon-192.png" >/dev/null
  sips -z 512 512 "$TMP" --out "$PUBLIC/icon-512.png" >/dev/null
  sips -z 180 180 "$TMP" --out "$PUBLIC/apple-touch-icon.png" >/dev/null
else
  echo "sips not found (macOS). Install ImageMagick or run on Mac." >&2
  exit 1
fi

rm -f "$TMP"
echo "PWA icons updated in public/"
