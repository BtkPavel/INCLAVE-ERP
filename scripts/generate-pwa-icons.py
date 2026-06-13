#!/usr/bin/env python3
"""Generate PWA and iOS home screen icons from public/favicon.png."""

from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
SOURCE = PUBLIC / "favicon.png"

ICON_SET = {
    "inclave-32.png": 32,
    "inclave-120.png": 120,
    "inclave-152.png": 152,
    "inclave-167.png": 167,
    "inclave-180.png": 180,
    "inclave-192.png": 192,
    "inclave-512.png": 512,
}

# iOS/Safari auto-discovery at site root (no query string).
ROOT_COPIES = {
    "apple-touch-icon.png": 180,
    "apple-touch-icon-precomposed.png": 180,
    "apple-touch-icon-120x120.png": 120,
    "apple-touch-icon-152x152.png": 152,
    "apple-touch-icon-167x167.png": 167,
    "apple-touch-icon-180x180.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "favicon-32.png": 32,
}


def flatten_on_white(src: Image.Image, size: int) -> Image.Image:
    rgba = src.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    background = Image.new("RGB", (size, size), (255, 255, 255))
    background.paste(rgba, mask=rgba.split()[3])
    return background


def save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source not found: {SOURCE}")

    source = Image.open(SOURCE)
    cache: dict[int, Image.Image] = {}

    def get_icon(size: int) -> Image.Image:
        if size not in cache:
            cache[size] = flatten_on_white(source, size)
        return cache[size]

    save_png(SOURCE, get_icon(512))

    for filename, size in ICON_SET.items():
        save_png(ICONS / filename, get_icon(size))

    for filename, size in ROOT_COPIES.items():
        save_png(PUBLIC / filename, get_icon(size))

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [get_icon(s) for s, _ in ico_sizes]
    ico_images[0].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=ico_sizes,
        append_images=ico_images[1:],
    )

    print("Generated icons in public/icons/ and root discovery files")


if __name__ == "__main__":
    main()
