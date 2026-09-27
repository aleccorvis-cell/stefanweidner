# Corporate Identity – Written in Sound

Marke von Stefan Weidner. Claim: **"From Score to Sound"**.
Quelle: `Written_in_Sound_Web_Typografie.pdf` (Web-Typografie-Vorgabe von Stefan), extrahiert am 27.09.2026.

## Markenname

- Vollständiger Name: **Written in Sound**
- Byline: "by Stefan Weidner"
- Claim: "From Score to Sound"
- Kurzform/Wortmarke: **W | S**
- Kategorien (Badge-Zeile): Composed · Orchestrated · Produced

Ersetzt den bisherigen Markennamen "MAPMusic" vollständig (Logo, Titel, Meta-Daten, Footer).

## Farben

| Name          | Hex       | Verwendung                                   |
|---------------|-----------|-----------------------------------------------|
| Deep Charcoal | `#1B1B1B` | Haupt-Hintergrund Dark-Theme, Text Light-Theme |
| Ivory         | `#F8F6EF` | Haupt-Hintergrund Light-Theme, Text Dark-Theme |
| Antique Gold  | `#B89B68` | Akzentfarbe – identisch in Dark & Light-Modus  |

Dark-Theme ist Standard (Nutzeranforderung), Light-Theme ist CI-konforme Ergänzung, umschaltbar per Theme-Toggle im Nav (Zustand in `localStorage`, Schlüssel `wis-theme`).

Umgesetzt als CSS-Custom-Properties in `css/style.css` (`:root` = Dark, `:root[data-theme="light"]` = Light-Override). Zusätzliche abgeleitete Töne (Gold hell/dunkel, Hintergrund-Stufen) wurden im gleichen Farbklima ergänzt, wo das Original-CI keine Werte vorgibt.

## Typografie

| Ebene              | Schrift              | Gewicht        | Einsatz                                   | Fallback                        |
|---------------------|-----------------------|----------------|--------------------------------------------|----------------------------------|
| Brand / Display     | Bodoni Moda           | Regular/Medium | Logo, H1, große Seitentitel                | Didot, Times New Roman, serif   |
| Secondary Serif     | Cormorant Garamond    | Regular/Medium | Claim, Byline, H2/H3, Zitate               | EB Garamond, Georgia, serif     |
| UI / Body           | Inter                 | Regular/Bold   | Fließtext, Navigation, Buttons, Formulare  | Arial, Helvetica, sans-serif    |

Alle drei Schriften sind kostenlos über Google Fonts erhältlich (SIL Open Font License) und werden **lokal selbst gehostet** (`assets/fonts/*.woff2`) – keine Google-Fonts-CDN-Anfragen, DSGVO-konform, keine Lizenzkosten.

Hinweis zur Umsetzung: Die im PDF genannten sehr weiten Letter-Spacing-Werte (0.12–0.25em) sind für die **großgeschriebene** Hero-Darstellung ("WRITTEN IN SOUND") gedacht und wurden dort exakt übernommen (`.hero-subtitle`, `.section-label`, bereits vorhandene Uppercase-Labels). Für normale, gemischt-geschriebene Überschriften (h1–h3) wurde eine dezentere Laufweite (0.01–0.02em) gewählt, da die extremen Werte bei Groß-/Kleinschreibung schwer lesbar würden.

## Logo

Konzept aus dem PDF: "W | S"-Wortmarke mit einer mehrschichtigen, wellenförmigen Soundwellen-Linie darüber (Sinnbild für Klang/Musik).

Umsetzung im Code: eigenständig als Inline-SVG nachgebaut (nicht 1:1 aus dem PDF-Bild extrahiert, da dort nur als niedrig aufgelöstes Rastergrafik-Mockup vorhanden) – drei geschwungene, golden abgestufte Linien links neben der Wortmarke "W | S", in `--font-display` (Bodoni Moda) gesetzt. Verwendet im Nav-Logo aller Seiten (`.nav-logo`, `.nav-logo-mark`, `.nav-logo-text` in `css/style.css`).

**Für eine professionelle Reinzeichnung** (z.B. als Vektor-Datei von einem Grafiker) sollte dieses Icon perspektivisch noch einmal sauber nachgezeichnet werden – die aktuelle Version ist eine funktionale, seitenweite Übergangslösung.

## Heroshot

Das aktuell verwendete Hero-Bild (`assets/images/hero-mountain.webp` / `.jpg`) stammt aus dem Moodboard-Mockup der PDF (Berggipfel bei Sonnenaufgang, Rückenansicht) – auf Wunsch des Nutzers 1:1 übernommen. Es handelt sich **nicht** um ein echtes Foto von Stefan Weidner. Für eine spätere Version wird ein echtes Foto empfohlen.

## Offene Punkte

- Professionelle Vektor-Reinzeichnung des Logos.
- Echtes Hero-/Portraitfoto von Stefan als Ersatz für das Moodboard-Bild.
- Domain: `www.writteninsoundmusic.com`.
