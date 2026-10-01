#!/usr/bin/env python3
"""Erzeugt die Coming-Soon-Grafiken je Sprache aus dem freigegebenen Paket (V7 FINAL).

Das Paket enthaelt den englischen Satz fest im Bild. Fuer die deutsche Fassung
(und fuer die abgeschnittene Zeile im SWM-Mobile-Bild) wird der Satz entfernt
(Hintergrund wird vertikal interpoliert) und in Cormorant Garamond neu gesetzt.
Logos, Wortmarken, COMING SOON und alle Farben bleiben unveraendert.

Aufruf:  python3 tools/make_images.py <Ordner-des-entpackten-V7-Pakets> <Cormorant-Regular.ttf>
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PKG = Path(sys.argv[1])
TTF = sys.argv[2]
OUT = Path(__file__).resolve().parent.parent / "shared" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# Quelle, Zielname-Praefix, Sprache -> Text, Sprache EN neu setzen?, gemessene Box (x0,y0,x1,y1)
JOBS = [
    ("stefanweidnermusic/assets/SWM_ComingSoon_Desktop_16x9.jpg", "swm-desktop", (368, 486, 1304, 518), False),
    ("stefanweidnermusic/assets/SWM_ComingSoon_Mobile_9x16.jpg", "swm-mobile", (101, 424, 841, 448), True),
    ("writteninsoundmusic/assets/WIS_ComingSoon_Desktop_16x9.jpg", "wis-desktop", (467, 747, 1201, 776), False),
    ("writteninsoundmusic/assets/WIS_ComingSoon_Mobile_9x16.jpg", "wis-mobile", (201, 1284, 868, 1311), False),
]
TEXT = {
    "swm": {"en": "A new digital home for both musical worlds is in development.",
            "de": "Ein neues digitales Zuhause für beide Musikwelten ist in Entwicklung."},
    "wis": {"en": "The new website is currently in development.",
            "de": "Die neue Website befindet sich derzeit in Entwicklung."},
}
SS = 4  # Supersampling beim Textsatz


def text_width(font, s, track):
    return sum(font.getlength(c) for c in s) + track * (len(s) - 1)


def fit_font(box, ref_text):
    """Schriftgroesse so waehlen, dass die Hoehe (Oberlaenge bis Unterlaenge) der Originalzeile passt;
    Laufweite so, dass die Breite des Originaltextes getroffen wird."""
    x0, y0, x1, y1 = box
    th, tw = y1 - y0 + 1, x1 - x0 + 1
    f100 = ImageFont.truetype(TTF, 100 * SS)
    b = f100.getbbox(ref_text)
    size = 100 * th / ((b[3] - b[1]) / SS)
    font = ImageFont.truetype(TTF, round(size * SS))
    base = sum(font.getlength(c) for c in ref_text)
    track = (tw * SS - base) / (len(ref_text) - 1)
    return font, track


def text_color(im, box):
    x0, y0, x1, y1 = box
    px = im.load()
    best = max(((sum(px[x, y]), px[x, y]) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)))
    return best[1]


def erase(im, box, pad=9, padx=16):
    x0, y0, x1, y1 = box
    top, bot = y0 - pad, y1 + pad
    px = im.load()
    for x in range(max(0, x0 - padx), min(im.width, x1 + padx)):
        a, b = px[x, top - 1], px[x, bot + 1]
        for y in range(top, bot + 1):
            t = (y - top + 1) / (bot - top + 2)
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


def draw(im, box, s, font, track, color, max_w):
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2
    w = text_width(font, s, track)
    if w > max_w * SS:  # zu breit -> Laufweite reduzieren
        track = (max_w * SS - sum(font.getlength(c) for c in s)) / (len(s) - 1)
        w = max_w * SS
    layer = Image.new("L", (round(w) + 40 * SS, 80 * SS), 0)
    d = ImageDraw.Draw(layer)
    ref = font.getbbox("Ag")
    x = 20 * SS
    ytop = 20 * SS - ref[1]
    for c in s:
        d.text((x, ytop), c, font=font, fill=255)
        x += font.getlength(c) + track
    # Unterkante auf Originalzeile ausrichten (Unterlaenge = Boxunterkante)
    full = font.getbbox("gpy")
    shift_y = y1 - (ytop + full[3]) / SS
    small = layer.resize((layer.width // SS, layer.height // SS), Image.LANCZOS)
    glow = small.filter(ImageFilter.GaussianBlur(2.2)).point(lambda v: int(v * 0.35))
    ox = round(cx - small.width / 2)
    oy = round(shift_y)
    col = Image.new("RGB", small.size, color)
    for m in (glow, small):
        im.paste(col, (ox, oy), m)


def feather_panels(im, rects, bg=(7, 7, 7), ramp=85, bottom=14):
    """WIS-Mobile: die sichtbaren Kasten-Kanten weich in den dunklen Hintergrund ausblenden."""
    px = im.load()
    for (rx0, ry0, rx1, ry1) in rects:
        for y in range(ry0, ry1):
            for x in range(rx0, rx1):
                # unten nur schmal ausblenden, damit die Textzeile am Kastenrand erhalten bleibt
                d = min((x - rx0) / ramp, (rx1 - 1 - x) / ramp, (y - ry0) / ramp, (ry1 - 1 - y) / bottom)
                if d >= 1:
                    continue
                m = d
                m = m * m * (3 - 2 * m)
                p = px[x, y]
                px[x, y] = tuple(round(bg[i] * (1 - m) + p[i] * m) for i in range(3))


def edge_colors(im):
    """Mittlere Randfarben (mittlere 60 % jeder Kante) fuer den Hintergrund neben der Grafik."""
    w, h = im.size
    px = im.load()

    def avg(pts):
        pts = list(pts)
        return tuple(round(sum(p[i] for p in pts) / len(pts)) for i in range(3))
    xa, xb, ya, yb = int(w * .2), int(w * .8), int(h * .2), int(h * .8)
    hexc = lambda c: "#%02x%02x%02x" % c
    return {"top": hexc(avg(px[x, 1] for x in range(xa, xb))), "bottom": hexc(avg(px[x, h - 2] for x in range(xa, xb))),
            "left": hexc(avg(px[1, y] for y in range(ya, yb))), "right": hexc(avg(px[w - 2, y] for y in range(ya, yb)))}


PANELS = {"wis-mobile": [(40, 150, 1041, 549), (40, 1110, 1041, 1447)]}


def main():
    edges = {}
    for rel, name, box, fix_en in JOBS:
        key = name.split("-")[0]
        src = Image.open(PKG / rel).convert("RGB")
        font, track = fit_font(box, TEXT[key]["en"])
        color = text_color(src, box)
        max_w = (box[2] - box[0] + 1) * 1.10
        for lang in ("en", "de"):
            if lang == "en" and not fix_en:
                im = src.copy()
            else:
                im = src.copy()
                erase(im, box)
                draw(im, box, TEXT[key][lang], font, track, color, max_w)
            if name in PANELS:
                feather_panels(im, PANELS[name])
            edges[name] = edge_colors(im)
            dst = OUT / f"{name}-{lang}.webp"
            im.save(dst, "WEBP", quality=92, method=6)
            print(dst.name, im.size, "Farbe", color)
    (OUT / "edges.json").write_text(json.dumps(edges, indent=1))


main()
