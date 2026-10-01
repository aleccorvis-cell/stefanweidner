# 04 – Coming-Soon-Seiten

## Was es ist
Zwei eigenständige Seiten ohne Funktion, je Domain **Deutsch und Englisch getrennt** (Umschalter `DE · EN` oben rechts; nie beide Sprachen auf einer Seite). Grundlage sind die freigegebenen Komplettgrafiken aus dem Paket *HiDrive-ComingSoon_Webdesigner_FINAL_V7_FINAL_2026-10-01*:

| Domain | Inhalt |
|---|---|
| `stefanweidnermusic.com` | Stefan Weidner Music (SW-Monogramm), COMING SOON, darunter Stefan Weidner Live (links) und Written in Sound (rechts) |
| `writteninsoundmusic.com` | Eigenständige Written-in-Sound-Seite. `writteninsoundmusic.de` leitet per `.htaccess` dauerhaft (301) auf die `.com` |

- Adressen `/de/` und `/en/`; `/` leitet je nach Browser-Sprache weiter (`.htaccess`, Fallback `index.html`).
- Fußzeile: Impressum / Legal notice, © 2026 Stefan Weidner, Webdesign-Credit.
- **Impressum** (DE/EN): Stefan Weidner, c/o Block Service, Stuttgarter Str. 106, 70736 Fellbach; Kontakt `info@stefanweidnermusic.com` (Postfach wird direkt bei Strato gelesen, keine Weiterleitung nötig), Telefon.
- `noindex` + `robots.txt`; keine Cookies, kein Tracking, keine externen Anfragen.
- Noch **keine Datenschutzerklärung** (bewusst später).

## Abweichungen zum gelieferten V7-Paket (und warum)
1. **Zwei Sprachen:** Das Paket hat den englischen Satz fest im Bild. Für Deutsch wurde nur dieser Satz entfernt und in Cormorant Garamond neu gesetzt (SWM: „Ein neues digitales Zuhause für beide Musikwelten ist in Entwicklung.“, WIS: „Die neue Website befindet sich derzeit in Entwicklung.“). Logos, Wortmarken, COMING SOON, Farben unverändert.
2. **SWM-Mobile:** Die Zeile „…is in development.“ war unten abgeschnitten (Unterlängen). Sie wurde in beiden Sprachen neu gesetzt.
3. **WIS-Mobile:** Die zwei sichtbaren Kästen (heller als der Hintergrund) wurden an den Kanten weich ausgeblendet.
4. **Tablet-Grafiken** (4:3) entfallen: sie zeigten die Desktop-Grafik in einem sichtbaren Rahmen. Hochformat bis 1099 px = Mobile-Grafik, sonst Desktop-Grafik, jeweils `object-fit: contain` (nie beschnitten).
5. **Hintergrund** neben der Grafik wird aus den Bildrändern abgeleitet (statt einheitlich `#0d0d0c`), damit bei abweichenden Seitenverhältnissen keine harte Kante entsteht.
6. **Seitenstruktur:** echter Seitentitel/Beschreibung, `lang`, `hreflang`, Alt-Texte und eine unsichtbare H1 statt reiner Bildseite.

## Quellen & Build
`coming-soon-sites/`: `tools/make_images.py` (Grafiken je Sprache aus dem V7-Paket), `build.py` (Seiten), `shared/` (Schriften, CSS, Grafiken). Die Grafiken selbst liegen bewusst nicht im öffentlichen Repo.

## Upload auf Strato (Hosting Basic, ein Paket, drei Domains)
Domains: stefanweidnermusic.com, writteninsoundmusic.com, writteninsoundmusic.de (SSL aktiv). Webspace-Pfad `/home/www`.
1. *Domains verwalten*: Verzeichnisse prüfen. Empfehlung `/stefanweidnermusic` und `/writteninsoundmusic` (`.com` und `.de` gemeinsam).
2. Inhalt der Ordner `stefanweidnermusic.com/` bzw. `writteninsoundmusic.com/` per SFTP/Dateimanager hochladen (inkl. `.htaccess`), Platzhalter-`index.html` ersetzen.
3. Prüfen: beide Domains, `/de/`, `/en/`, Umschalter, Impressum, `.de`-Weiterleitung, Smartphone.

## E-Mail
Postfach `info@stefanweidnermusic.com` in Strato anlegen (E-Mail → Postfächer; im Paket sind 3 Postfächer enthalten, 1 genutzt). Lesen per Strato-Webmail oder Mail-Programm. Die alte private Adresse steht nicht mehr auf den neuen Seiten (die alten Repo-Seiten enthalten sie noch und werden ersetzt).

## Später
Echtbetrieb ersetzt den Inhalt der Verzeichnisse (GitHub-Deploy). `noindex`/`robots.txt` entfernen, Datenschutzerklärung ergänzen.
