# 04 – Coming-Soon-Seiten

## Was es ist
Eine einseitige, statische Seite im Look des freigegebenen Startportals – ohne Funktion:
- Header „Stefan Weidner Music“ (Desktop-/Mobile-Variante),
- Hinweis „Coming soon – Die neue Website ist in Kürze online.“,
- darunter die beiden Kacheln **Stefan Weidner Live** und **Written in Sound** (nicht klickbar; Desktop nebeneinander, Mobile untereinander),
- Footer mit **Impressum** und **Datenschutz** (eigene Mini-Seiten),
- `noindex` + `robots.txt` (Seite soll bis zum Launch nicht in Suchmaschinen erscheinen),
- keine Cookies, kein Tracking, keine externen Anfragen, Schriften lokal.

Beide Domains erhalten **dieselbe Seite** – das entspricht der Vorgabe „beide Domains führen zum Portal“.

## Quellen & Build
Ordner `coming-soon-sites/`:
- `shared/` – Bilder (WebP, aus den freigegebenen Masterdateien), Schriften, CSS
- `*.template.html` – Startseite, Impressum, Datenschutz
- `build.sh` – erzeugt `dist/stefanweidnermusic.com/` und `dist/writteninsoundmusic.com/` (fertig zum Hochladen, ca. 1,3 MB je Domain)

```bash
cd coming-soon-sites && sh build.sh
```

## Upload auf Strato (manuell, einmalig)
1. Strato-Kundenservicebereich → *Domains* → prüfen, auf welches **Zielverzeichnis** jede Domain zeigt.
2. Per SFTP oder Strato-Dateimanager den **Inhalt** von `dist/<domain>/` in dieses Zielverzeichnis legen (inkl. `.htaccess`, nicht den Ordner selbst). Vorhandene Strato-Platzhalter-`index.html` überschreiben bzw. entfernen.
3. Aufruf `https://stefanweidnermusic.com` und `https://writteninsoundmusic.com` (jeweils auch mit `www`) prüfen.
4. HTTPS: In Strato SSL für beide Domains aktivieren (falls noch nicht), danach Aufruf testen.

Zugangsdaten gibt der Repo-Owner selbst ein – sie werden nicht im Repo oder in Chats abgelegt.

## Checkliste vor Freigabe
- [ ] Desktop + Smartphone angesehen (Kacheln auf Mobile untereinander)
- [ ] Impressum-Angaben bestätigt (Name/Anschrift/Telefon/Mail)
- [ ] Datenschutztext akzeptiert (Entwurf, siehe Hinweis unten)
- [ ] Texte „Coming soon / Die neue Website ist in Kürze online.“ freigegeben
- [ ] Kunde hat Look abgenommen

## Rückbau beim Launch
Inhalt des Zielverzeichnisses durch die echte Seite ersetzen (Deploy-Workflow), `noindex`/`robots.txt` entfernen, Redirects für `writteninsoundmusic.com` setzen.

## Hinweis Rechtstexte
Impressum und Datenschutz auf den Coming-Soon-Seiten sind **minimal und vorläufig** (nur Hosting-Logs, keine Cookies/Tools). Impressum-Daten stammen aus dem bisherigen Repo. Für den Echtbetrieb werden beide Texte über den eRecht24-Generator neu erstellt und von Stefan freigegeben.
