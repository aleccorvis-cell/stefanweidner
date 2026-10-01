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
        "imp": "Impressum", "dp": "Datenschutz", "back": "← Zurück", "switch": "Sprache wählen", "credit": "Webdesign",
        "swm": {"title": "Stefan Weidner Music – Coming soon",
                "desc": "Stefan Weidner Music – Stefan Weidner Live & Written in Sound. Die neue Website ist in Entwicklung.",
                "alt": "Stefan Weidner Music – Musician, Composer, Arranger, Producer. Coming soon. Ein neues digitales Zuhause für beide Musikwelten ist in Entwicklung. Stefan Weidner Live und Written in Sound."},
        "wis": {"title": "Written in Sound – Coming soon",
                "desc": "Written in Sound by Stefan Weidner – From Score to Sound. Die neue Website befindet sich derzeit in Entwicklung.",
                "alt": "Written in Sound by Stefan Weidner – From Score to Sound. Original cinematic, orchestral & theatrical music. Coming soon. Die neue Website befindet sich derzeit in Entwicklung."},
    },
    "en": {
        "imp": "Legal notice", "dp": "Privacy policy", "back": "← Back", "switch": "Choose language", "credit": "Webdesign",
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

# Datenschutz: Text des Kunden (Stand Oktober 2026); EN = Uebersetzung
DATENSCHUTZ = {
    "de": """
    <div class="legal">
      <a class="back" href="index.html">{back}</a>
      <h1>Datenschutzerklärung</h1>
      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
      <p>Stefan Weidner<br>c/o Block Service<br>Stuttgarter Str. 106<br>70736 Fellbach<br>Deutschland<br>E-Mail: <a href="mailto:{mail}">{mail}</a></p>
      <h2>2. Hosting und Server-Logfiles</h2>
      <p>Diese Website wird bei der STRATO GmbH, Otto-Ostrowski-Straße 7, 10249 Berlin, Deutschland, gehostet.</p>
      <p>Beim Aufruf dieser Website werden durch den Hostinganbieter technisch erforderliche Daten verarbeitet. Hierzu können insbesondere die IP-Adresse des zugreifenden Geräts, Datum und Uhrzeit des Zugriffs, die aufgerufene Seite bzw. Datei, Browsertyp und Browserversion, Betriebssystem sowie die zuvor aufgerufene Seite (Referrer-URL) gehören.</p>
      <p>Die Verarbeitung erfolgt, um die sichere, stabile und technisch fehlerfreie Bereitstellung der Website zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und zuverlässigen Betrieb dieser Website.</p>
      <p>STRATO speichert IP-Adressen zur Erkennung und Abwehr von Angriffen nach eigenen Angaben für maximal sieben Tage. Die für uns bereitgestellten Webserver-Logfiles enthalten anonymisierte IP-Adressen.</p>
      <p>Mit STRATO besteht, soweit erforderlich, eine Vereinbarung zur Auftragsverarbeitung gemäß Art. 28 DSGVO.</p>
      <h2>3. Kontaktaufnahme per E-Mail</h2>
      <p>Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen übermittelten Angaben einschließlich Ihrer Kontaktdaten verarbeitet, um Ihre Anfrage zu bearbeiten und gegebenenfalls Anschlussfragen zu beantworten.</p>
      <p>Erfolgt die Kontaktaufnahme im Zusammenhang mit der Anbahnung oder Durchführung eines Vertrags, ist Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO. In anderen Fällen erfolgt die Verarbeitung auf Grundlage unseres berechtigten Interesses an der Bearbeitung von Anfragen gemäß Art. 6 Abs. 1 lit. f DSGVO.</p>
      <p>Die Daten werden gelöscht, sobald sie für die Bearbeitung der Anfrage nicht mehr erforderlich sind, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
      <h2>4. Cookies, Tracking und externe Dienste</h2>
      <p>Auf dieser Website werden keine Analyse-, Tracking- oder Marketingdienste eingesetzt.</p>
      <p>Es werden keine externen Schriftarten, Social-Media-Plugins, Karten-, Video-, Audio- oder sonstigen Inhalte von Drittanbietern eingebunden. Schriftarten, Bilder und sonstige Inhalte der Website werden lokal bereitgestellt.</p>
      <p>Wir setzen keine nicht technisch erforderlichen Cookies zu Analyse-, Marketing- oder vergleichbaren Zwecken ein.</p>
      <h2>5. Weitergabe von Daten</h2>
      <p>Eine Weitergabe personenbezogener Daten an Dritte erfolgt grundsätzlich nicht, sofern dies nicht zur Bereitstellung und zum sicheren Betrieb dieser Website erforderlich ist, eine gesetzliche Verpflichtung besteht oder Sie ausdrücklich eingewilligt haben.</p>
      <p>Im Rahmen des Hostings kann STRATO als Auftragsverarbeiter Zugriff auf technisch erforderliche Daten erhalten.</p>
      <p>Eine Übermittlung personenbezogener Daten in Drittländer außerhalb der Europäischen Union bzw. des Europäischen Wirtschaftsraums findet im Rahmen der derzeit auf dieser Website eingesetzten Dienste nicht statt.</p>
      <h2>6. Ihre Rechte</h2>
      <p>Sie haben im Rahmen der gesetzlichen Voraussetzungen insbesondere das Recht auf:</p>
      <ul>
        <li>Auskunft über Ihre personenbezogenen Daten gemäß Art. 15 DSGVO,</li>
        <li>Berichtigung unrichtiger Daten gemäß Art. 16 DSGVO,</li>
        <li>Löschung Ihrer Daten gemäß Art. 17 DSGVO,</li>
        <li>Einschränkung der Verarbeitung gemäß Art. 18 DSGVO,</li>
        <li>Datenübertragbarkeit gemäß Art. 20 DSGVO sowie</li>
        <li>Widerspruch gegen eine Verarbeitung gemäß Art. 21 DSGVO.</li>
      </ul>
      <p>Sie haben außerdem gemäß Art. 77 DSGVO das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.</p>
      <h2>7. Automatisierte Entscheidungsfindung</h2>
      <p>Eine automatisierte Entscheidungsfindung einschließlich Profiling findet nicht statt.</p>
      <p class="stand">Stand: Oktober 2026</p>
    </div>""",
    "en": """
    <div class="legal">
      <a class="back" href="index.html">{back}</a>
      <h1>Privacy policy</h1>
      <h2>1. Controller</h2>
      <p>The controller responsible for data processing on this website is:</p>
      <p>Stefan Weidner<br>c/o Block Service<br>Stuttgarter Str. 106<br>70736 Fellbach<br>Germany<br>Email: <a href="mailto:{mail}">{mail}</a></p>
      <h2>2. Hosting and server log files</h2>
      <p>This website is hosted by STRATO GmbH, Otto-Ostrowski-Straße 7, 10249 Berlin, Germany.</p>
      <p>When this website is accessed, the hosting provider processes technically necessary data. This may include in particular the IP address of the accessing device, date and time of access, the page or file requested, browser type and version, operating system, and the previously visited page (referrer URL).</p>
      <p>The processing serves to ensure the secure, stable and technically error-free provision of the website. The legal basis is Art. 6(1)(f) GDPR. Our legitimate interest lies in the secure and reliable operation of this website.</p>
      <p>According to its own information, STRATO stores IP addresses for the detection and defence of attacks for a maximum of seven days. The web server log files made available to us contain anonymised IP addresses.</p>
      <p>Where required, a data processing agreement pursuant to Art. 28 GDPR is in place with STRATO.</p>
      <h2>3. Contact by email</h2>
      <p>If you contact us by email, the information you send, including your contact details, is processed in order to handle your enquiry and to answer any follow-up questions.</p>
      <p>If contact is made in connection with the initiation or performance of a contract, the legal basis is Art. 6(1)(b) GDPR. In other cases, processing is based on our legitimate interest in handling enquiries pursuant to Art. 6(1)(f) GDPR.</p>
      <p>The data is deleted as soon as it is no longer required to handle the enquiry, unless statutory retention obligations apply.</p>
      <h2>4. Cookies, tracking and external services</h2>
      <p>No analytics, tracking or marketing services are used on this website.</p>
      <p>No external fonts, social media plugins, maps, video, audio or other third-party content are embedded. Fonts, images and other content of the website are provided locally.</p>
      <p>We do not use cookies that are not technically necessary for analytics, marketing or similar purposes.</p>
      <h2>5. Disclosure of data</h2>
      <p>Personal data is generally not passed on to third parties, unless this is necessary for the provision and secure operation of this website, there is a legal obligation, or you have expressly consented.</p>
      <p>In the context of hosting, STRATO may gain access to technically necessary data as a processor.</p>
      <p>Personal data is not transferred to third countries outside the European Union or the European Economic Area in connection with the services currently used on this website.</p>
      <h2>6. Your rights</h2>
      <p>Within the framework of the statutory requirements, you have in particular the right to:</p>
      <ul>
        <li>access to your personal data pursuant to Art. 15 GDPR,</li>
        <li>rectification of inaccurate data pursuant to Art. 16 GDPR,</li>
        <li>erasure of your data pursuant to Art. 17 GDPR,</li>
        <li>restriction of processing pursuant to Art. 18 GDPR,</li>
        <li>data portability pursuant to Art. 20 GDPR, and</li>
        <li>object to processing pursuant to Art. 21 GDPR.</li>
      </ul>
      <p>You also have the right under Art. 77 GDPR to lodge a complaint with a data protection supervisory authority if you believe that the processing of your personal data violates the GDPR.</p>
      <h2>7. Automated decision-making</h2>
      <p>There is no automated decision-making, including profiling.</p>
      <p class="stand">Last updated: October 2026</p>
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
            links = (f'<a href="impressum.html">{t["imp"]}</a><span class="sep">·</span>'
                     f'<a href="datenschutz.html">{t["dp"]}</a><span class="sep">·</span>')
            footer = FOOTER.format(imp_link=links, credit=t["credit"])
            stage = HEAD.format(**dict(head, extra_head=edge_css)) + STAGE.format(
                nav=NAV.format(href_de="../de/", href_en="../en/", **nav_vars),
                title=t[key]["title"], key=key, lang=lang, alt=t[key]["alt"], footer=footer)
            (out / lang / "index.html").write_text(stage, encoding="utf-8")
            imp_head = dict(head, title=f'{t["imp"]} – Stefan Weidner Music')
            imp = HEAD.format(**imp_head) + PAGE.format(
                nav=NAV.format(href_de="../de/impressum.html", href_en="../en/impressum.html", **nav_vars),
                main=IMPRESSUM[lang].format(back=t["back"], mail=MAIL),
                footer=footer)
            (out / lang / "impressum.html").write_text(imp, encoding="utf-8")
            dsg = HEAD.format(**dict(head, title=f'{t["dp"]} – Stefan Weidner Music', extra_head="")) + PAGE.format(
                nav=NAV.format(href_de="../de/datenschutz.html", href_en="../en/datenschutz.html", **nav_vars),
                main=DATENSCHUTZ[lang].format(back=t["back"], mail=MAIL), footer=footer)
            (out / lang / "datenschutz.html").write_text(dsg, encoding="utf-8")
        (out / "index.html").write_text(CHOOSER.format(title=TXT["en"][key]["title"], domain=domain), encoding="utf-8")
        extra = WIS_EXTRA if key == "wis" else ""
        (out / ".htaccess").write_text(HTACCESS.format(extra=extra), encoding="utf-8")
        (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
        print("gebaut:", out.name)


if __name__ == "__main__":
    build()
