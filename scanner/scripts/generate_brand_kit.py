"""
HL Intel — Brand Kit Generator
Tron aesthetic: deep black, electric cyan, magenta

Run from project root:
    python3 scripts/generate_brand_kit.py

Outputs to assets/brand/
"""

import sys
import math
import io
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image, ImageDraw, ImageFont
from alerts.branding import generate_logo, _load_font

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
BLACK       = (0, 0, 0, 255)
BG          = (1, 11, 19, 255)
BG_MID      = (3, 20, 35, 255)
CYAN        = (0, 220, 255, 255)
CYAN_MID    = (0, 140, 180, 180)
CYAN_DIM    = (0, 60, 90, 100)
MAGENTA     = (255, 0, 120, 255)
MAGENTA_DIM = (255, 0, 120, 80)
WHITE_COOL  = (200, 240, 255, 255)
TEXT_DIM    = (80, 140, 170, 200)
GRID        = (0, 40, 60, 60)

OUT_DIR = Path(__file__).parent.parent / "assets" / "brand"
OUT_DIR.mkdir(parents=True, exist_ok=True)

TAGLINE = "Smart money surveillance."


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _draw_grid(img: Image.Image, spacing: int = 60) -> None:
    """Draw a subtle Tron grid using alpha compositing."""
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, w, spacing):
        d.line([x, 0, x, h], fill=(0, 180, 220, 18), width=1)
    for y in range(0, h, spacing):
        d.line([0, y, w, y], fill=(0, 180, 220, 18), width=1)
    img.alpha_composite(overlay)


def _draw_scanlines(img: Image.Image) -> None:
    """Extremely subtle scanline texture — every 4th row, barely visible."""
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, h, 4):
        d.line([0, y, w, y], fill=(0, 0, 0, 22), width=1)
    img.alpha_composite(overlay)


def _draw_corner_brackets(draw: ImageDraw.ImageDraw, x: int, y: int,
                           size: int = 20, color=CYAN, width: int = 2) -> None:
    """Draw HUD-style corner bracket at (x, y)."""
    draw.line([x, y, x + size, y], fill=color, width=width)
    draw.line([x, y, x, y + size], fill=color, width=width)


def _accent_lines(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    """Top and bottom cyan border lines."""
    draw.line([0, 0, w, 0], fill=CYAN, width=2)
    draw.line([0, h - 1, w, h - 1], fill=CYAN, width=2)
    draw.line([0, 1, w, 1], fill=(0, 220, 255, 50), width=1)
    draw.line([0, h - 2, w, h - 2], fill=(0, 220, 255, 50), width=1)


def _left_bar(draw: ImageDraw.ImageDraw, h: int, width: int = 4) -> None:
    draw.rectangle([0, 0, width - 1, h], fill=CYAN)


def _save(img: Image.Image, name: str) -> None:
    path = OUT_DIR / name
    img.convert("RGBA").save(path, format="PNG")
    kb = path.stat().st_size // 1024
    print(f"  ✓  {name:<35} {kb:>4} KB")


# ---------------------------------------------------------------------------
# 1. Logo mark — transparent PNG
# ---------------------------------------------------------------------------

def make_logo_mark() -> None:
    img = generate_logo(size=512)
    _save(img, "logo_mark_512.png")

    # Also export small versions
    for sz in [256, 128, 64]:
        small = generate_logo(size=sz)
        _save(small, f"logo_mark_{sz}.png")


# ---------------------------------------------------------------------------
# 2. Telegram / Twitter avatar — logo on dark bg with bracket HUD
# ---------------------------------------------------------------------------

def make_avatar(size: int, filename: str) -> None:
    img  = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Subtle grid
    _draw_grid(img, spacing=size // 10)
    _draw_scanlines(img)

    # Logo centred
    logo_sz = int(size * 0.72)
    logo    = generate_logo(size=logo_sz)
    offset  = (size - logo_sz) // 2
    img.paste(logo, (offset, offset), logo)

    # Corner brackets
    m = size // 16
    bs = size // 8
    _draw_corner_brackets(draw, m, m, size=bs, color=CYAN, width=max(2, size // 100))
    # Flip for other corners
    for tx, ty, sx, sy in [(size - m, m, -1, 1),
                            (m, size - m, 1, -1),
                            (size - m, size - m, -1, -1)]:
        _draw_corner_brackets(draw,
                              tx - (bs if sx < 0 else 0),
                              ty - (bs if sy < 0 else 0),
                              size=bs, color=CYAN, width=max(2, size // 100))

    # Outer border
    draw.rectangle([0, 0, size - 1, size - 1], outline=CYAN, width=max(2, size // 128))

    _save(img, filename)


# ---------------------------------------------------------------------------
# 3. Telegram banner — 1280×320
# ---------------------------------------------------------------------------

def make_telegram_banner() -> None:
    W, H = 1280, 320
    img  = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(img)

    _draw_grid(img, spacing=64)
    _draw_scanlines(img)

    # Large decorative radar arc — background element
    cx, cy = 160, H // 2
    for r in [220, 170, 120, 75]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     outline=(0, 220, 255, 25), width=1)
    draw.line([cx - 220, cy, cx + 220, cy], fill=(0, 220, 255, 20), width=1)
    draw.line([cx, cy - 220, cx, cy + 220], fill=(0, 220, 255, 20), width=1)

    # Logo
    logo_sz = 220
    logo = generate_logo(size=logo_sz)
    img.paste(logo, (cx - logo_sz // 2, cy - logo_sz // 2), logo)

    # "HL INTEL" wordmark
    font_title = _load_font(72)
    font_tag   = _load_font(22)

    text_x = 340
    draw.text((text_x, 70), "HL INTEL", fill=CYAN, font=font_title)

    # Underline accent
    title_w = int(draw.textlength("HL INTEL", font=font_title))
    draw.line([text_x, 158, text_x + title_w, 158],
              fill=MAGENTA, width=3)
    draw.line([text_x, 161, text_x + title_w, 161],
              fill=(255, 0, 120, 60), width=1)

    # Tagline
    draw.text((text_x + 2, 175), TAGLINE, fill=TEXT_DIM, font=font_tag)

    # Vertical divider
    div_x = text_x - 24
    draw.line([div_x, 40, div_x, H - 40], fill=(0, 220, 255, 80), width=1)

    _accent_lines(draw, W, H)
    _left_bar(draw, H)

    # Corner brackets
    _draw_corner_brackets(draw, 10, 10, size=28)
    _draw_corner_brackets(draw, W - 38, 10, size=28)

    _save(img, "telegram_banner_1280x320.png")


# ---------------------------------------------------------------------------
# 4. Twitter / X banner — 1500×500
# ---------------------------------------------------------------------------

def make_twitter_banner() -> None:
    W, H = 1500, 500
    img  = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(img)

    _draw_grid(img, spacing=75)
    _draw_scanlines(img)

    # Large background radar
    cx, cy = 200, H // 2
    for r in [340, 260, 180, 110, 60]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     outline=(0, 220, 255, 18), width=1)
    draw.line([cx - 340, cy, cx + 340, cy], fill=(0, 220, 255, 15), width=1)
    draw.line([cx, cy - 340, cx, cy + 340], fill=(0, 220, 255, 15), width=1)

    # Sweep arm hint
    arm_deg = 310
    arm_rad = math.radians(arm_deg)
    ax = cx + int(300 * math.cos(arm_rad))
    ay = cy + int(300 * math.sin(arm_rad))
    draw.line([cx, cy, ax, ay], fill=(0, 220, 255, 40), width=2)

    # Logo
    logo_sz = 280
    logo = generate_logo(size=logo_sz)
    img.paste(logo, (cx - logo_sz // 2, cy - logo_sz // 2), logo)

    # Wordmark
    font_title = _load_font(96)
    font_sub   = _load_font(28)
    font_tag   = _load_font(22)

    text_x = 490
    draw.text((text_x, 120), "HL INTEL", fill=CYAN, font=font_title)

    title_w = int(draw.textlength("HL INTEL", font=font_title))
    draw.line([text_x, 236, text_x + title_w, 236], fill=MAGENTA, width=4)
    draw.line([text_x, 240, text_x + title_w, 240],
              fill=(255, 0, 120, 50), width=2)

    draw.text((text_x + 3, 258), TAGLINE.upper(), fill=TEXT_DIM, font=font_tag)

    # Stats / features row
    font_feat = _load_font(17)
    features  = [
        "TOP-50 WALLET TRACKING",
        "REAL-TIME CONFLUENCE",
        "4H CHART ALERTS",
        "WEEKLY DIGEST",
    ]
    feat_y = 340
    feat_x = text_x
    for feat in features:
        draw.text((feat_x + 16, feat_y), feat, fill=(120, 200, 220, 200), font=font_feat)
        # Bullet
        draw.ellipse([feat_x + 2, feat_y + 7, feat_x + 9, feat_y + 14],
                     fill=MAGENTA)
        feat_x += int(draw.textlength(feat, font=font_feat)) + 50

    # Vertical divider
    div_x = text_x - 30
    draw.line([div_x, 60, div_x, H - 60],
              fill=(0, 220, 255, 70), width=1)

    _accent_lines(draw, W, H)
    _left_bar(draw, H)

    _draw_corner_brackets(draw, 12, 12, size=36)
    _draw_corner_brackets(draw, W - 48, 12, size=36)

    _save(img, "twitter_banner_1500x500.png")


# ---------------------------------------------------------------------------
# 5. Brand reference card — 1200×675
# ---------------------------------------------------------------------------

def make_brand_card() -> None:
    W, H = 1200, 675
    img  = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(img)

    _draw_grid(img, spacing=60)
    _draw_scanlines(img)
    _accent_lines(draw, W, H)
    _left_bar(draw, H)

    font_head  = _load_font(36)
    font_label = _load_font(16)
    font_hex   = _load_font(13)
    font_title = _load_font(52)
    font_tag   = _load_font(18)

    # Title
    draw.text((40, 30), "HL INTEL — BRAND REFERENCE", fill=CYAN, font=font_head)
    draw.line([40, 82, W - 40, 82], fill=(0, 220, 255, 80), width=1)

    # Logo
    logo = generate_logo(size=200)
    img.paste(logo, (40, 100), logo)

    # Wordmark beside logo
    draw.text((260, 130), "HL INTEL", fill=CYAN, font=font_title)
    draw.text((263, 196), TAGLINE, fill=TEXT_DIM, font=font_tag)
    wm_w = int(draw.textlength("HL INTEL", font=font_title))
    draw.line([260, 192, 260 + wm_w, 192], fill=MAGENTA, width=2)

    # Color swatches
    palette = [
        ("BACKGROUND",  (1,   11,  19),  "#010B13"),
        ("CYAN",        (0,  220, 255),  "#00DCFF"),
        ("MAGENTA",     (255,  0, 120),  "#FF0078"),
        ("COOL WHITE",  (200, 240, 255), "#C8F0FF"),
        ("MUTED",       (80,  140, 170), "#508AAA"),
    ]

    swatch_y = 330
    swatch_w = 180
    swatch_h = 90
    swatch_gap = 20
    total_sw = len(palette) * swatch_w + (len(palette) - 1) * swatch_gap
    start_x  = (W - total_sw) // 2

    draw.text((start_x, swatch_y - 36), "COLOUR PALETTE",
              fill=TEXT_DIM, font=font_label)

    for i, (name, rgb, hex_val) in enumerate(palette):
        sx = start_x + i * (swatch_w + swatch_gap)
        sy = swatch_y
        # Swatch box
        draw.rectangle([sx, sy, sx + swatch_w, sy + swatch_h],
                        fill=(*rgb, 255))
        # Border
        draw.rectangle([sx, sy, sx + swatch_w, sy + swatch_h],
                        outline=(0, 220, 255, 60), width=1)
        # Label
        draw.text((sx, sy + swatch_h + 8),  name,    fill=WHITE_COOL, font=font_hex)
        draw.text((sx, sy + swatch_h + 26), hex_val, fill=TEXT_DIM,   font=font_hex)

    # Typography block
    ty = 500
    draw.text((40, ty), "TYPOGRAPHY", fill=TEXT_DIM, font=font_label)
    draw.line([40, ty + 24, 400, ty + 24], fill=(0, 220, 255, 40), width=1)

    font_samples = [
        ("PRIMARY   SF Mono / Courier New Bold", _load_font(20), CYAN),
        ("SECONDARY  SF Mono / Courier New", _load_font(16), WHITE_COOL),
        ("METADATA   SF Mono regular",       _load_font(13), TEXT_DIM),
    ]
    for j, (sample, fnt, col) in enumerate(font_samples):
        draw.text((40, ty + 36 + j * 40), sample, fill=col, font=fnt)

    # Feature bullets right side
    bx = 700
    draw.text((bx, ty), "ALERT TYPES", fill=TEXT_DIM, font=font_label)
    draw.line([bx, ty + 24, W - 40, ty + 24], fill=(0, 220, 255, 40), width=1)

    alerts = [
        ("WHALE MOVE",      CYAN),
        ("WHALE ADDING",    CYAN),
        ("CONFLUENCE",      MAGENTA),
        ("FUNDING SPIKE",   (255, 180, 0, 255)),
        ("OI SURGE",        (255, 180, 0, 255)),
        ("WEEKLY DIGEST",   TEXT_DIM),
    ]
    for j, (name, col) in enumerate(alerts):
        ax = bx
        ay = ty + 36 + j * 32
        draw.ellipse([ax, ay + 6, ax + 8, ay + 14], fill=col)
        draw.text((ax + 16, ay), name, fill=col, font=font_hex)

    _save(img, "brand_card_1200x675.png")


# ---------------------------------------------------------------------------
# Run all
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\nHL Intel — Generating brand kit...\n")
    make_logo_mark()
    make_avatar(512, "avatar_512.png")
    make_avatar(400, "avatar_400.png")
    make_telegram_banner()
    make_twitter_banner()
    make_brand_card()
    print(f"\nAll assets saved to: assets/brand/\n")
