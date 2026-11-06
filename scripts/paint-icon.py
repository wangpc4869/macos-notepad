#!/usr/bin/env python3
"""画出星笺的程序图标：一封信，上面一颗星。"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "build" / "icon.png"
CANVAS = 1024
SCALE = 2


def wpc_lerp(start, end, amount):
    return tuple(int(start[index] + (end[index] - start[index]) * amount) for index in range(3))


def wpc_star(center_x, center_y, outer, inner):
    points = []
    for step in range(10):
        angle = -math.pi / 2 + step * math.pi / 5
        radius = outer if step % 2 == 0 else inner
        points.append((center_x + math.cos(angle) * radius, center_y + math.sin(angle) * radius))
    return points


def wpc_background(size):
    image = Image.new("RGBA", (size, size))
    pixels = image.load()
    top = (255, 214, 196)
    middle = (244, 214, 232)
    bottom = (186, 214, 245)
    for y in range(size):
        amount = y / (size - 1)
        color = wpc_lerp(top, middle, amount / 0.55) if amount < 0.55 else wpc_lerp(middle, bottom, (amount - 0.55) / 0.45)
        for x in range(size):
            pixels[x, y] = (*color, 255)
    light = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paint = ImageDraw.Draw(light)
    paint.ellipse((size * 0.12, size * -0.08, size * 0.88, size * 0.46), fill=(255, 255, 255, 78))
    light = light.filter(ImageFilter.GaussianBlur(int(size * 0.04)))
    return Image.alpha_composite(image, light)


def wpc_paint():
    size = CANVAS * SCALE
    image = wpc_background(size)
    unit = SCALE
    left, top, right, bottom = 188 * unit, 168 * unit, 836 * unit, 860 * unit
    radius = 78 * unit
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_paint = ImageDraw.Draw(shadow)
    shadow_paint.rounded_rectangle((left, top + 28 * unit, right, bottom + 36 * unit), radius=radius, fill=(92, 112, 150, 70))
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(36 * unit)))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((left, top, right, bottom), radius=radius, fill=(255, 250, 244, 255))
    fold = 168 * unit
    draw.polygon(
        [(right - fold, top), (right, top + fold), (right - fold, top + fold)],
        fill=(246, 226, 196, 255),
    )
    draw.line([(right - fold, top), (right - fold, top + fold), (right, top + fold)], fill=(232, 196, 150, 255), width=4 * unit)
    star = wpc_star(512 * unit, 430 * unit, 168 * unit, 70 * unit)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_paint = ImageDraw.Draw(glow)
    glow_paint.ellipse((392 * unit, 318 * unit, 632 * unit, 558 * unit), fill=(240, 179, 90, 80))
    image.alpha_composite(glow.filter(ImageFilter.GaussianBlur(18 * unit)))
    draw = ImageDraw.Draw(image)
    draw.polygon(star, fill=(226, 164, 74, 255))
    tip = [star[0], star[1], star[9]]
    draw.polygon(tip, fill=(255, 228, 176, 255))
    for line_y, line_right in ((640, 700), (708, 760), (776, 620)):
        draw.rounded_rectangle(
            (300 * unit, line_y * unit, line_right * unit, (line_y + 16) * unit),
            radius=8 * unit,
            fill=(232, 210, 188, 255),
        )
    icon = image.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    icon.save(OUT, "PNG")
    print(OUT)


if __name__ == "__main__":
    wpc_paint()
