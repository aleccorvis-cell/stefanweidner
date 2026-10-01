# 04 – Coming-Soon-Seiten

## Was es ist
Zwei eigenständige, einseitige statische Seiten ohne Funktion – je Domain, je **Deutsch und Englisch getrennt** (Umschalter `DE · EN` oben rechts; nie beide Sprachen auf einer Seite):

| Domain | Look |
|---|---|
| `stefanweidnermusic.com` | Portal-Look: Header „Stefan Weidner Music“, „Coming soon“, darunter die Kacheln Stefan Weidner Live und Written in Sound (nicht klickbar; Desktop nebeneinander, Mobil untereinander) |
| `writteninsoundmusic.com` | Eigenständige Written-in-Sound-Seite: Master-Kachel (Logo, Claim, Domain) + „Coming soon“. `writteninsoundmusic.de` leitet per `.htaccess` dauerhaft (301) auf die `.com` weiter |

- Adressen: `/de/` und `/en/`; die Startadresse `/` leitet je nach Browser-Sprache weiter (`.htaccess`, Fallback JavaScript-Seite `index.html`).
- `noindex` + `robots.txt` (bis zum Launch nicht in Suchmaschinen), keine Cookies, kein Tracking, keine externen Anfragen, Schriften lokal.
- Impressum/Datenschutz bewusst **noch nicht** enthalten (kommen mit der echten Seite, neue Anschrift).

## Quellen & Build
Ordner `coming-soon-sites/`: `shared/` (Bilder als WebP aus den freigegebenen Masterdateien, Schriften, CSS) und `build.py`.

```bash
cd coming-soon-sites && python3 build.py   # erzeugt dist/<domain>/
```

## Upload auf Strato (Hosting Basic, ein Paket, drei Domains)
Domains im Paket: stefanweidnermusic.com, writteninsoundmusic.com, writteninsoundmusic.de (alle aktiviert, SSL aktiv). Webspace-Pfad `/home/www`.

1. Strato → *Domains verwalten*: pro Domain das **Verzeichnis** ansehen bzw. festlegen. Empfehlung: `stefanweidnermusic.com` → `/stefanweidnermusic`, `writteninsoundmusic.com` **und** `.de` → `/writteninsoundmusic` (so greift die .de-Weiterleitung).
2. Per SFTP/Webspace-Dateimanager den **Inhalt** von `dist/stefanweidnermusic.com/` bzw. `dist/writteninsoundmusic.com/` in das jeweilige Verzeichnis legen (inkl. versteckter `.htaccess`, vorhandene Strato-Platzhalter-`index.html` ersetzen).
3. Prüfen: beide Domains (mit/ohne `www`), `/de/`, `/en/`, Umschalter, Smartphone.

Zugangsdaten gibt der Repo-Owner selbst ein.

## Später
Der Echtbetrieb ersetzt den Inhalt der Verzeichnisse (GitHub-Deploy). `noindex`/`robots.txt` entfernen, Impressum/Datenschutz ergänzen.
