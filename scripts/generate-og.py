#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
生成默认分享卡片 public/og-default.png（1200x630，水墨风）。

社交平台基本不支持 SVG 格式的 og:image，必须用 PNG/JPEG，
所以这个脚本负责把卡片渲染成位图。

用法：
    python scripts/generate-og.py

标题与副标题会从 src/config.ts 里自动读取（site.title / site.tagline），
所以改完站点配置后重新跑一次即可。
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "src" / "config.ts"
OUTPUT = ROOT / "public" / "og-default.jpg"

# ---------- 水墨风配色（与 src/styles/global.css 保持一致）----------
BG = (247, 244, 237)  # 宣纸底
SURFACE = (253, 251, 247)  # 印章上的字
INK = (28, 25, 23)  # 焦墨
INK_SOFT = (74, 68, 61)  # 重墨
INK_MUTE = (138, 128, 120)  # 淡墨
SEAL = (168, 50, 42)  # 朱红

W, H = 1200, 630

# Windows 自带字体：宋体（正文/标题）、楷体（印章）
FONT_SONG = Path("C:/Windows/Fonts/simsun.ttc")
FONT_KAI = Path("C:/Windows/Fonts/simkai.ttf")


def read_config() -> tuple[str, str]:
    """从 src/config.ts 中取出 site.title 与 site.tagline。"""
    if not CONFIG.exists():
        return "我的博客", "记录与思考"

    src = CONFIG.read_text(encoding="utf-8")
    block = re.search(r"export const site = \{(.*?)\n\};", src, re.S)
    scope = block.group(1) if block else src

    title = re.search(r"title:\s*'([^']*)'", scope)
    tagline = re.search(r"tagline:\s*'([^']*)'", scope)

    return (
        title.group(1) if title else "我的博客",
        tagline.group(1) if tagline else "记录与思考",
    )


def radial_glow(
    size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int], alpha: float
) -> Image.Image:
    """生成一层柔和的径向墨晕。"""
    w, h = size
    yy, xx = np.ogrid[:h, :w]
    cx, cy = center
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    falloff = np.clip(1.0 - dist / radius, 0.0, 1.0) ** 2 * alpha

    layer = np.zeros((h, w, 4), dtype=np.uint8)
    layer[..., 0], layer[..., 1], layer[..., 2] = color
    layer[..., 3] = (falloff * 255).astype(np.uint8)
    return Image.fromarray(layer, "RGBA")


def add_paper_grain(img: Image.Image, strength: float = 5.0, seed: int = 7) -> Image.Image:
    """叠加极轻微的噪点，模拟宣纸纹理。"""
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, strength, (img.height, img.width, 1)).repeat(3, axis=2)
    arr = np.clip(np.asarray(img, dtype=np.float32) + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def load_font(path: Path, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    if not path.exists():
        print(f"[warn] font not found: {path}", file=sys.stderr)
        return ImageFont.load_default()
    return ImageFont.truetype(str(path), size, index=index)


def centered_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
) -> None:
    x0, y0, x1, y1 = box
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (x0 + (x1 - x0 - tw) / 2 - bbox[0], y0 + (y1 - y0 - th) / 2 - bbox[1]),
        text,
        font=font,
        fill=fill,
    )


def make_seal(character: str, size: int = 110) -> Image.Image:
    """朱红方章，白文（红底白字）。"""
    pad = 8
    canvas = Image.new("RGBA", (size + pad * 2, size + pad * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle([pad, pad, pad + size, pad + size], radius=10, fill=SEAL + (255,))

    font = load_font(FONT_KAI, int(size * 0.52))
    centered_text(draw, (pad, pad, pad + size, pad + size), character, font, SURFACE + (255,))

    return canvas.rotate(-4, resample=Image.BICUBIC, expand=True)


def main() -> int:
    title, tagline = read_config()

    img = Image.new("RGB", (W, H), BG).convert("RGBA")

    # 墨晕：左上较重、右下较轻，形成对角呼应
    img = Image.alpha_composite(img, radial_glow((W, H), (150, 20), 780, INK, 0.10))
    img = Image.alpha_composite(img, radial_glow((W, H), (1120, 600), 700, INK, 0.075))
    img = img.convert("RGB")
    img = add_paper_grain(img, strength=3.5)

    draw = ImageDraw.Draw(img)

    f_title = load_font(FONT_SONG, 76)
    f_tagline = load_font(FONT_SONG, 30)
    f_foot = load_font(FONT_SONG, 22)

    draw.text((96, 196), title, font=f_title, fill=INK)
    draw.text((96, 322), tagline, font=f_tagline, fill=INK_SOFT)

    # 朱红短横线
    draw.rectangle([96, 408, 246, 414], fill=SEAL)

    draw.text((96, 476), "技术笔记 · 生活随笔 · 长期记录", font=f_foot, fill=INK_MUTE)

    # 印章放在右上角（想刻自己的字号就改这里）
    seal = make_seal("墨")
    img.paste(seal, (W - 96 - seal.width, 104), seal)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # JPEG 比 PNG 小一个数量级；纸纹噪点会让 PNG 几乎无法压缩
    img.save(OUTPUT, "JPEG", quality=88, optimize=True, progressive=True)

    print(f"OK -> {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size / 1024:.1f} KB, {W}x{H})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
