#!/usr/bin/env python3
"""Erzeugt fertige Upload-Ordner unter dist/<domain>/ (DE + EN als getrennte Seiten).

Grafiken: erst  python3 tools/make_images.py  (siehe dort), dann  python3 build.py
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
MAIL = "info@stefanweidnermusic.com"

TXT = {
    "de": {
        "imp": "Impressum", "back": "← Zurück", "switch": "Sprache wählen", "credit": "Webdesign",
        "swm": {"title": "Stefan Weidner Music – Coming soon",
                "desc": "Stefan Weidner Music – Stefan Weidner Live & Written in Sound. Die neue Website ist in Entwicklung.",
                "alt": "Stefan Weidner Music – Musician, Composer, Arranger, Producer. Coming soon. Ein neues digitales Zuhause für beide Musikwelten ist in Entwicklung. Stefan Weidner Live und Written in Sound."},
        "wis": {"title": "Written in Sound – Coming soon",
                "desc": "Written in Sound by Stefan Weidner – From Score to Sound. Die neue Website befindet sich derzeit in Entwicklung.",
                "alt": "Written in Sound by Stefan Weidner – From Score to Sound. Original cinematic, orchestral & theatrical music. Coming soon. Die neue Website befindet sich derzeit in Entwicklung."},
    },
    "en": {
        "imp": "Legal notice", "back": "← Back", "switch": "Choose language", "credit": "Webdesign",
        "swm": {"title": "Stefan Weidner Music – Coming soon",
                "desc": "Stefan Weidner Music – Stefan Weidner Live & Written in Sound. The new website is in development.",
                "alt": "Stefan Weidner Music – Musician, Composer, Arranger, Producer. Coming soon. A new digital home for both musical worlds is in development. Stefan Weidner Live and Written in Sound."},
        "wis": {"title": "Written in Sound – Coming soon",
                "desc": "Written in Sound by Stefan Weidner – From Score to Sound. The new website is currently in development.",
                "alt": "Written in Sound by Stefan Weidner – From Score to Sound. Original cinematic, orchestral & theatrical music. Coming soon. The new website is currently in development."},
    },
}

SITES = {"stefanweidnermusic.com": "swm", "writteninsoundmusic.com": "wis"}

IMPRESSUM = {
    "de": """
    <div class="legal">
      <a class="back" href="index.html">{back}</a>
      <h1>Impressum</h1>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>Stefan Weidner<br>c/o Block Service<br>Stuttgarter Str. 106<br>70736 Fellbach, Deutschland</p>
      <h2>Kontakt</h2>
      <p>Telefon: 0174 7089514<br>E-Mail: <a href="mailto:{mail}">{mail}</a></p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (gemäß § 36 VSBG).</p>
    </div>""",
    "en": """
    <div class="legal">
      <a class="back" href="index.html">{back}</a>
      <h1>Legal notice</h1>
      <h2>Information pursuant to § 5 DDG</h2>
      <p>Stefan Weidner<br>c/o Block Service<br>Stuttgarter Str. 106<br>70736 Fellbach, Germany</p>
      <h2>Contact</h2>
      <p>Phone: +49 174 7089514<br>Email: <a href="mailto:{mail}">{mail}</a></p>
      <h2>Consumer dispute resolution</h2>
      <p>We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board (§ 36 VSBG).</p>
    </div>""",
}

HEAD = """<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0c">
  <link rel="alternate" hreflang="de" href="https://{domain}/de/">
  <link rel="alternate" hreflang="en" href="https://{domain}/en/">
  <link rel="alternate" hreflang="x-default" href="https://{domain}/">
  <link rel="icon" type="image/png" href="../img/favicon.png">
  <link rel="apple-touch-icon" href="../img/apple-touch-icon.png">
  <link rel="stylesheet" href="../style.css">
{extra_head}</head>
"""

NAV = """  <nav class="lang" aria-label="{switch}">
    <a href="{href_de}" hreflang="de" lang="de"{cur_de}>DE</a><span aria-hidden="true">·</span><a href="{href_en}" hreflang="en" lang="en"{cur_en}>EN</a>
  </nav>
"""

FOOTER = """  <footer>{imp_link}© 2026 Stefan Weidner<span class="sep">·</span>{credit}: Starmindsdesign by Alex 💻</footer>
"""

EDGE_CSS = """  <style>
    .stage img{{background:linear-gradient(to bottom,{d[top]} 0 50%,{d[bottom]} 50% 100%)}}
    @media (min-aspect-ratio:16/9){{.stage img{{background:linear-gradient(to right,{d[left]} 0 50%,{d[right]} 50% 100%)}}}}
    @media (orientation:portrait) and (max-width:1099px){{
      .stage img{{background:linear-gradient(to bottom,{m[top]} 0 50%,{m[bottom]} 50% 100%)}}
    }}
    @media (orientation:portrait) and (max-width:1099px) and (min-aspect-ratio:9/16){{
      .stage img{{background:linear-gradient(to right,{m[left]} 0 50%,{m[right]} 50% 100%)}}
    }}
  </style>
"""

STAGE = """<body class="stage">
{nav}  <h1 class="sr">{title}</h1>
  <picture>
    <source media="(orientation:portrait) and (max-width:1099px)" srcset="../img/{key}-mobile-{lang}.webp">
    <img src="../img/{key}-desktop-{lang}.webp" alt="{alt}" fetchpriority="high">
  </picture>
{footer}</body>
</html>
"""

PAGE = """<body class="page">
{nav}  <main>{main}
  </main>
{footer}</body>
</html>
"""

CHOOSER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0d0d0c">
  <link rel="alternate" hreflang="de" href="https://{domain}/de/">
  <link rel="alternate" hreflang="en" href="https://{domain}/en/">
  <link rel="icon" type="image/png" href="img/favicon.png">
  <link rel="stylesheet" href="style.css">
  <script>
    (function () {{
      var l = (navigator.language || 'en').toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
      location.replace(l + '/');
    }})();
  </script>
</head>
<body class="chooser">
  <p class="choose"><a href="de/" hreflang="de" lang="de">Deutsch</a><span aria-hidden="true">·</span><a href="en/" hreflang="en" lang="en">English</a></p>
</body>
</html>
"""

HTACCESS = """Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
RewriteEngine On
{extra}
# Startadresse: Browser mit deutscher Hauptsprache -> /de/, sonst -> /en/
RewriteCond %{{REQUEST_URI}} ^/$
RewriteCond %{{HTTP:Accept-Language}} ^de [NC]
RewriteRule ^$ /de/ [R=302,L]
RewriteCond %{{REQUEST_URI}} ^/$
RewriteRule ^$ /en/ [R=302,L]
</IfModule>
<IfModule mod_headers.c>
Header append Vary Accept-Language
</IfModule>
"""

# writteninsoundmusic.de (liegt im selben Strato-Paket) -> dauerhaft auf die .com
WIS_EXTRA = """# Alias-Domain .de -> .com
RewriteCond %{HTTP_HOST} ^(www\\.)?writteninsoundmusic\\.de$ [NC]
RewriteRule ^(.*)$ https://writteninsoundmusic.com/$1 [R=301,L]
"""


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    for domain, key in SITES.items():
        out = DIST / domain
        out.mkdir(parents=True)
        (out / "img").mkdir()
        for f in (ROOT / "shared" / "img").iterdir():
            if f.name.startswith(key + "-") or f.name in ("favicon.png", "apple-touch-icon.png"):
                shutil.copy(f, out / "img" / f.name)
        shutil.copytree(ROOT / "shared" / "fonts", out / "fonts")
        shutil.copy(ROOT / "shared" / "style.css", out / "style.css")
        for lang, t in TXT.items():
            (out / lang).mkdir()
            nav_vars = dict(switch=t["switch"], cur_de=' aria-current="true"' if lang == "de" else "",
                            cur_en=' aria-current="true"' if lang == "en" else "")
            edges = json.loads((ROOT / "shared" / "img" / "edges.json").read_text())
            edge_css = EDGE_CSS.format(d=edges[key + "-desktop"], m=edges[key + "-mobile"])
            head = dict(lang=lang, domain=domain, extra_head="", **t[key])
            footer = FOOTER.format(imp_link=f'<a href="impressum.html">{t["imp"]}</a><span class="sep">·</span>',
                                   credit=t["credit"])
            stage = HEAD.format(**dict(head, extra_head=edge_css)) + STAGE.format(
                nav=NAV.format(href_de="../de/", href_en="../en/", **nav_vars),
                title=t[key]["title"], key=key, lang=lang, alt=t[key]["alt"], footer=footer)
            (out / lang / "index.html").write_text(stage, encoding="utf-8")
            imp_head = dict(head, title=f'{t["imp"]} – Stefan Weidner Music')
            imp = HEAD.format(**imp_head) + PAGE.format(
                nav=NAV.format(href_de="../de/impressum.html", href_en="../en/impressum.html", **nav_vars),
                main=IMPRESSUM[lang].format(back=t["back"], mail=MAIL),
                footer=FOOTER.format(imp_link="", credit=t["credit"]))
            (out / lang / "impressum.html").write_text(imp, encoding="utf-8")
        (out / "index.html").write_text(CHOOSER.format(title=TXT["en"][key]["title"], domain=domain), encoding="utf-8")
        extra = WIS_EXTRA if key == "wis" else ""
        (out / ".htaccess").write_text(HTACCESS.format(extra=extra), encoding="utf-8")
        (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
        print("gebaut:", out.name)


if __name__ == "__main__":
    build()
