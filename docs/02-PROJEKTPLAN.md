# 02 – Projektplan

## 1. Ziel
Neue Gesamtpräsenz unter der Dachmarke **Stefan Weidner Music**: ein minimales Startportal mit zwei gleichwertigen Einstiegen – **Stefan Weidner Live** (Instrumentalist, primär Deutsch) und **Written in Sound** (Komposition/Orchestration/Produktion, Deutsch + Englisch). Beide Domains führen zum Portal.

## 2. Hosting – Empfehlung

**Heute (Coming Soon): direkt auf Strato.** Die Domains zeigen bereits auf Strato; eine statische Seite braucht keine weitere Technik. Kein DNS-Eingriff nötig.

**Später (Echtbetrieb): ebenfalls Strato – GitHub dient als Quelle und Auslieferungsweg, nicht als Webserver.**

| Kriterium | Strato (Empfehlung) | GitHub Pages |
|---|---|---|
| Domains | liegen schon dort, DNS bleibt unberührt | DNS-Umstellung beider Domains nötig, Risiko für E-Mail/Subdomains |
| PHP (Kontaktformular, Termin-/Admin-Backend) | ja (Hosting Basic: PHP + MySQL) | nein – Formulare nur über Drittdienste |
| DSGVO / Serverstandort | Deutschland, AV-Vertrag | USA-Anbieter, externes Formular nötig |
| Zwei Domains, ein Inhalt | über Strato-Domainverwaltung / `.htaccess`-Redirect | pro Repo nur eine Custom Domain |
| Deployment | **bereits vorhanden**: Push auf `main` → SFTP (`deploy.yml`) | automatisch |
| Cronjob | nicht im Basic-Tarif → Termin-Archiv per JavaScript/PHP beim Aufruf lösen | – |

**Fazit:** GitHub = Quellcode, Versionierung, Doku, automatischer Upload. Strato = Webserver. Das ist der Aufbau, den das Repo schon vorsieht. GitHub Pages wäre nur dann sinnvoll, wenn die Seite komplett ohne PHP und ohne Formular auskäme – das widerspricht dem Booking-Formular der Live-Seite.

## 3. Technische Leitentscheidungen (Vorschlag, zur Bestätigung)

1. **Statische Seiten (HTML/CSS/JS)**, kein Framework/Build-Zwang → schnell, wartbar, läuft überall. Gemeinsames CSS-Designsystem für alle Seiten.
2. **Struktur:** eine Codebasis, zum Beispiel
   je Sprache getrennt: `/de/…` und `/en/…` (Umschalter, `hreflang`) mit Portal, Live und Written in Sound darunter. Gilt für alle Seiten.
   (Alternative: Live/WIS als eigene Hauptpfade je Domain – siehe offene Frage 3.)
3. **writteninsoundmusic.com:** Weiterleitung (301) auf das Portal oder auf `/written-in-sound/` – kein Doppelinhalt.
4. **Termine:** Datei `termine.json`; Seite filtert nach Enddatum (Archiv einklappbar). Kein Cronjob nötig. Startseite zeigt die nächsten 3–4.
5. **Kontaktformular:** kleines PHP-Skript (Strato) mit Einwilligungs-Checkbox, Spamschutz (Honeypot), Mailversand an Domain-Adresse. Bis dahin `mailto:`.
6. **Medien:** YouTube nur über `youtube-nocookie` mit Zwei-Klick-Vorschau; Bilder als WebP; Schriften lokal (Bodoni Moda, Cormorant Garamond, Inter – bereits im Repo).
7. **Admin-Backend** (`backend/`, `admin/`): vorerst *nicht* weiterverfolgen. Für den Umfang (Termine, Referenzen) reichen JSON-Dateien; das Backend bleibt im Repo-Verlauf erhalten und kann später reaktiviert werden. (Entscheidung offen.)

## 4. Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – heute** | Doku im Repo · Coming-Soon für beide Domains · Abgleich mit Alec · Upload auf Strato | Domains zeigen markengerechte „Coming soon“-Seite statt Strato-Platzhalter |
| **1 – Portal** | Klickbares Startportal (Header + 2 Kacheln, Desktop nebeneinander, Mobile untereinander), Rechtstexte neu | Portal live, Kacheln verlinkt (sobald Zielseiten existieren) |
| **2 – Live-Seite** | Unterseiten-Designsystem → Startseite nach Designreferenz → 5 Instrumentenseiten, Keyboard Programming, Referenzen, Termine, Über mich, Media, Kontakt/Booking | Stefan Weidner Live komplett (Texte sind FINAL) |
| **3 – Written in Sound** | Seitenstruktur, DE/EN-Texte (fehlen noch), Media-Player für Tracks/Teaser, Kontakt | Written in Sound komplett zweisprachig |
| **4 – Launch** | Responsive-/Browser-Test, Lighthouse/Performance, SEO (Titel, Meta, Sitemap, hreflang), Redirects, Rechtstexte final, Coming-Soon entfernen, Search Console | Go-live |

Reihenfolge-Empfehlung: Phase 1 und 2 zuerst (Material vollständig), Phase 3 parallel zur Textproduktion.

## 5. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Push auf `main` überschreibt Live-Stand ungewollt | Arbeit in Branches, `main` nur nach Freigabe; Deploy-Workflow schließt `docs/` und `coming-soon-sites/` aus |
| Zugangsdaten im öffentlichen Repo | Secrets nur in GitHub-Settings, nie im Code; Repo auf **privat** stellen empfohlen |
| Rechtstexte unvollständig | Impressum/Datenschutz mit eRecht24 neu erzeugen, vor Launch prüfen (Checkliste liegt in `branding/`) |
| Textänderungen am freigegebenen Master | Master-DOCX ist verbindlich; Änderungen nur auf ausdrückliche Anweisung |
| Mobile-Kacheln weichen optisch ab | Regel aus dem Chat-Backup: Mobile nur aus dem Desktop-Master herunterrechnen (nie getrennt erzeugen) |
