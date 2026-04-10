"""
Generate favicon assets (PNG + ICO) for FredWav.
Matches the site brand colors: noir #0F0F0F background + gold #D5B053 "FW" text.
Run once after editing the SVG; outputs are committed to public/.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).parent / "public"
NOIR = (15, 15, 15, 255)
GOLD = (213, 176, 83, 255)

FONT_PATH = "C:/Windows/Fonts/georgiab.ttf"


def make_favicon(size: int) -> Image.Image:
    """Render an FW favicon at `size`x`size` with rounded corners."""
    # Work at 4x for crispness, then downsample.
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded square noir background (radius ~22%).
    radius = int(s * 0.22)
    draw.rounded_rectangle([(0, 0), (s - 1, s - 1)], radius=radius, fill=NOIR)

    # "FW" text: fit the largest font size that still fits comfortably.
    target_width = s * 0.78
    font_size = int(s * 0.52)
    while font_size > 1:
        font = ImageFont.truetype(FONT_PATH, font_size)
        bbox = font.getbbox("FW")
        w = bbox[2] - bbox[0]
        if w <= target_width:
            break
        font_size -= 2

    # Center horizontally + vertically.
    bbox = font.getbbox("FW")
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (s - w) / 2 - bbox[0]
    y = (s - h) / 2 - bbox[1] - s * 0.02  # slight lift for optical center
    draw.text((x, y), "FW", font=font, fill=GOLD)

    # Downsample with antialiasing.
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)

    # Multi-resolution ICO (16, 32, 48 — standard sizes).
    ico_sizes = [16, 32, 48]
    ico_images = [make_favicon(s) for s in ico_sizes]
    ico_images[0].save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )
    print(f"Wrote {OUT / 'favicon.ico'}")

    # Apple touch icon (180x180 — iOS home screen).
    make_favicon(180).save(OUT / "apple-touch-icon.png")
    print(f"Wrote {OUT / 'apple-touch-icon.png'}")

    # PNG fallbacks for rel=icon.
    make_favicon(32).save(OUT / "favicon-32.png")
    make_favicon(192).save(OUT / "favicon-192.png")
    print(f"Wrote {OUT / 'favicon-32.png'}, {OUT / 'favicon-192.png'}")


if __name__ == "__main__":
    main()
