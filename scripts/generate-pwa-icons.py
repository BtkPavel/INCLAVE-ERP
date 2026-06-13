#!/usr/bin/env python3
"""Generate PWA and iOS home screen icons from public/favicon.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "favicon.png"

SIZES = {
    "favicon-32.png": 32,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "apple-touch-icon-precomposed.png": 180,
    "apple-touch-icon-120x120.png": 120,
    "apple-touch-icon-152x152.png": 152,
    "apple-touch-icon-167x167.png": 167,
    "apple-touch-icon-180x180.png": 180,
}


def flatten_on_white(src: Image.Image, size: int) -> Image.Image:
    rgba = src.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    background = Image.new("RGB", (size, size), (255, 255, 255))
    background.paste(rgba, mask=rgba.split()[3])
    return background


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source not found: {SOURCE}")

    source = Image.open(SOURCE)
    master = flatten_on_white(source, 512)
    master.save(SOURCE, format="PNG", optimize=True)

    for filename, size in SIZES.items():
        icon = flatten_on_white(source, size)
        icon.save(PUBLIC / filename, format="PNG", optimize=True)

    ico = flatten_on_white(source, 32)
    ico.save(PUBLIC / "favicon.ico", format="ICO", sizes=[(32, 32)])

    print("Generated iOS/PWA icons in public/")


if __name__ == "__main__":
    main()
