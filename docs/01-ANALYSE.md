# 01 – Analyse (Stand 01.10.2026)

## 1. Repo `aleccorvis-cell/stefanweidner`

- **Inhalt heute:** der *alte* Ein-Marken-Auftritt „Written in Sound“ (Rebrand von „MAPMusic“ am 27.09.2026). Statisches HTML/CSS/JS (`index`, `vita`, `leistungen`, `referenzen`, `media`, `ankuendigungen`, `impressum`, `datenschutz`, `danke`), lokale Schriften (DSGVO), Theme-Toggle Dark/Light.
- **Backend:** PHP/MySQL-Fundament (`backend/`, `admin/`) für ein Admin-Dashboard (Seiten-Blöcke, Ankündigungen, Team, Login/Passwort-Reset über Resend). Läuft laut `backend/README.md` auf **Strato Hosting Basic** (PHP + MySQL, **kein Node, kein Cronjob**).
- **Coming-Soon (alt):** `.htaccess` leitet alle Besucher auf `coming-soon.html` um (Admin/Backend ausgenommen).
- **Deployment:** `.github/workflows/deploy.yml` – bei jedem Push auf `main` Spiegelung per SFTP (lftp) auf Strato. Zugangsdaten liegen als GitHub-Secrets (`STRATO_SFTP_*`) – die müssen vom Repo-Owner selbst gepflegt werden.
- **Backup:** `stefanweidner-original-backup` (privat) = Stand vor dem Written-in-Sound-Rebrand.
- **Bewertung:** Die neue Planung (Dachmarke + zwei gleichwertige Marken, Portal, DE/EN nur bei Written in Sound) passt **nicht** zur bisherigen Ein-Marken-Struktur. Wiederverwendbar sind: Schriften, Deploy-Workflow, Rechtstext-Grundlagen (`branding/eRecht24-Checkliste.md`), Backend-Ideen (Ankündigungen/Termine). Die alten Seiten sollten nicht „umgebaut“, sondern durch die neue Struktur ersetzt werden.

## 2. Domains / DNS (geprüft am 01.10.2026)

| Domain | Nameserver | A-Record | Aktuell ausgeliefert |
|---|---|---|---|
| stefanweidnermusic.com (+ www) | Strato (`*.rzone.de`) | 217.160.0.138 | Strato-Platzhalterseite |
| writteninsoundmusic.com (+ www) | Strato (`*.rzone.de`) | 217.160.0.138 | Strato-Platzhalterseite |

Beide Domains sind bei Strato registriert, zeigen auf Strato-Webspace und haben noch keinen Inhalt. **Nicht geklärt:** ob beide Domains im selben Strato-Paket liegen und welches Zielverzeichnis jeweils zugeordnet ist (→ [05-OFFENE-FRAGEN.md](05-OFFENE-FRAGEN.md)).

## 3. Material aus HiDrive.zip (329 MB)

| Ordner | Inhalt | Verwendung |
|---|---|---|
| `Logos/Stefan_Weidner_Logo_Paket_v2` | 3 Marken (Written in Sound, Stefan Weidner Music, Stefan Weidner Live) × FULL / PRIMARY / COMPACT (transparente PNG, hell/dunkel) + Social-Media-Karten + Facebook-Cover | Header, Footer, Favicon, Social. **Nur PNG, keine Vektoren.** |
| `Webdesign/Startportal Bilder und Anleitung` | Header „Stefan Weidner Music“ (Desktop/Mobile), je 2 Kachel-Master (Live, Written in Sound; Desktop 1448×1086, Mobile 1080×810) + Webdesigner-Hinweis | Startportal und Coming-Soon-Seiten |
| `Webdesign/Homepage "Stefan Weidner Live" - Startseite` | Startseiten-Master (DOCX/PDF), verbindliche Designreferenz, Hero ohne Text, 5 Kachelbilder, Planungs-Langmockup, Webdesigner-Hinweis | Live-Startseite |
| `Webdesign/Alle Texte Menüs Stefan Weidner Live` (+ `Sicherungen`, identische Kopie) | **Master-Textquelle „ALLE TEXTE FINAL“ vom 30.09.2026**: Startseite, Über mich, 5 Instrumentenseiten, Keyboard Programming, Referenzen, Termine, Media, Kontakt | Alle Live-Texte |
| `Stefan_Weidner_Website_Chat_Backup_2026-09-29.pdf` | Entscheidungsprotokoll: Architektur, Sprachstrategie, Hero-Briefing, Workflow-Regeln | Grundlage Plan |
| `Written in Sound/Written in Sound` | Moodboard (CI), 3 fertige Tracks (MP3), 3 Track-Cover (PNG), Teaser/Clips (MP4) | Media-Bereich Written in Sound |

### Nicht ins Repo
- `Entwürfe/26_09_26 Noire/*` (Cubase-Projekt `.cpr`, Auto-Saves, Demo-MP3) – **unveröffentlichte Musik**, nie in ein öffentliches Repo.
- MP3/MP4 (≈ 290 MB): GitHub-Dateigrenzen und Strato-Traffic → Videos über YouTube (datenschutzfreundliche Einbettung, im Repo bereits umgesetzt), Audio später gezielt als komprimierte Dateien auf dem Webspace.
- Das **Original-HiDrive-Paket bleibt das Master-Archiv**; im Repo liegen nur web-optimierte Ableitungen.

## 4. Widersprüche und Lücken, die beim Lesen aufgefallen sind

1. **Mockup vs. Master:** Das Designmockup nennt den Menüpunkt „Musical Programming“, der Master sagt **„Keyboard Programming“** (gilt). Mockup-Texte sind laut Vorgabe nicht verbindlich.
2. **Sprache der Portal-Kacheln:** Die fertigen Kachelgrafiken enthalten englische Texte („Live & Performance“, „Musical Theatre“). Die Live-Seite ist laut Strategie deutsch. Das Portal gilt als „spracharm / DE-EN neutral“ → vermutlich bewusst so, sollte aber bestätigt werden.
3. **Domain-Strategie:** Konzept: *beide* Domains führen zum Portal. Gleichzeitig soll writteninsoundmusic.com „eigenständige Markenadresse“ bleiben. Für Suchmaschinen sollte das technisch sauber gelöst werden (Weiterleitung oder `canonical`, kein identischer Inhalt unter zwei Domains).
4. **Impressum/Kontakt:** Im alten Repo stehen als Kontakt eine private Gmail-Adresse und „Written in Sound, Bruckstr. 24“ als Anschrift. Für die neuen Domains sollte eine Domain-Mailadresse und die korrekte Anbieterkennzeichnung (Name Stefan Weidner) bestätigt werden.
5. **Written in Sound:** Es gibt Marke, CI, Moodboard, Kachel und 3 Tracks – aber **keine finalen Seitentexte** (DE/EN) und keine WIS-spezifische Bio. Das ist der größte inhaltliche Posten nach der Live-Seite.
6. **Echte Fotos fehlen** (Hero ist KI-/Mockup-Bild; Live-Kachelbilder stammen aus dem Mockup mit begrenzter Auflösung). Laut Hinweis später austauschbar.
7. **Logo nur als PNG**; für Favicons, Druck und scharfe Darstellung wäre eine SVG-Reinzeichnung ideal.
8. **Mehrere Termine mit Zeiträumen** (z. B. „29.01.–07.02.2027“): Archivlogik muss das *Enddatum* verwenden.
