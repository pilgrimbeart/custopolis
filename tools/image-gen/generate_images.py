#!/usr/bin/env python3
"""Generate transparent customer PNGs from CHARACTERS.md using OpenAI Images."""
import argparse
import base64
import os
import sys
import time
from pathlib import Path

from openai import OpenAI
from PIL import Image

DEFAULT_MODEL = "gpt-image-1"
DEFAULT_SIZE = 1024
TARGET_SIZE = 128

STYLE_HINT = (
    "Bust portrait, friendly, modern, simple shapes, no text, transparent background. "
    "Centered character, clean outlines, consistent lighting."
)


def parse_characters(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"Missing character file: {path}")
    lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    return [line for line in lines if line and not line.startswith("#")]


def generate_image(client: OpenAI, prompt: str) -> bytes:
    response = client.images.generate(
        model=DEFAULT_MODEL,
        prompt=f"{prompt}. {STYLE_HINT}",
        size=f"{DEFAULT_SIZE}x{DEFAULT_SIZE}",
        background="transparent"
    )
    data = response.data[0].b64_json
    if not data:
        raise RuntimeError("No image data returned")
    return base64.b64decode(data)


def write_resized(png_bytes: bytes, output_path: Path) -> None:
    tmp_path = output_path.parent / "_tmp.png"
    tmp_path.write_bytes(png_bytes)
    with Image.open(tmp_path) as image:
        image = image.convert("RGBA")
        image = image.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
        image.save(output_path, format="PNG")
    tmp_path.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--characters",
        default="CHARACTERS.md",
        help="Path to CHARACTERS.md"
    )
    parser.add_argument(
        "--output-dir",
        default="src/common/assets",
        help="Output directory for PNGs"
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.5,
        help="Seconds to sleep between requests"
    )
    args = parser.parse_args()

    characters = parse_characters(Path(args.characters))
    if not characters:
        print("No characters found.")
        return 1

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    client = OpenAI()

    for idx, character in enumerate(characters, start=1):
        filename = f"customer_image_{idx:02d}.png"
        output_path = output_dir / filename
        print(f"Generating {filename} for: {character}")
        png_bytes = generate_image(client, character)
        write_resized(png_bytes, output_path)
        time.sleep(args.sleep)

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
