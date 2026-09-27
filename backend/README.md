# Written in Sound - Backend

PHP/MySQL-Fundament fuer das Admin-Dashboard (Phase 3). Laeuft auf Strato Hosting Basic
(PHP + MySQL/MariaDB, kein Node.js, kein Cronjob im Basic-Tarif - siehe Projektplan).

## Lokale Entwicklung (ohne MySQL-Server, per SQLite)

```bash
cp backend/config.example.php backend/config.php
# db_driver bleibt 'sqlite' - kein Setup noetig

php backend/bin/init-local-db.php owner@example.com meinTestPasswort

php -S localhost:8130 -t .
# -> http://localhost:8130/backend/api/pages.php
```

`backend/config.php` und `backend/dev.sqlite` sind in `.gitignore` und werden nie eingecheckt.

## Produktion auf Strato

1. Im Strato-Kundenmenue eine MySQL-Datenbank anlegen (Name, Nutzer, Passwort notieren).
2. `backend/schema.sql` einmalig gegen diese Datenbank ausfuehren (z.B. via phpMyAdmin im Strato-Menue).
3. `backend/config.php` **direkt auf dem Server** anlegen (per SFTP-Dateimanager oder `nano` via SSH) -
   Vorlage ist `backend/config.example.php`, mit `db_driver => 'mysql'` und den echten Zugangsdaten.
   Diese Datei existiert bewusst nicht im Git-Repo und wird von jedem Deploy unangetastet gelassen.
4. Ein SMTP-Postfach bei Strato fuer den Versand von Einladungs-/Reset-Mails eintragen (Phase 4).

## Automatisches Deployment

`.github/workflows/deploy.yml` synchronisiert bei jedem Push auf `main` per SFTP auf den Server.
Dafuer muessen im GitHub-Repo unter *Settings -> Secrets and variables -> Actions* folgende
Secrets angelegt werden (**nur durch den Repo-Owner selbst, nie durch Claude** - siehe Sicherheitsregeln):

| Secret                 | Beispiel                     |
|-------------------------|-------------------------------|
| `STRATO_SFTP_HOST`      | `ssh.strato.de`               |
| `STRATO_SFTP_USER`      | SFTP-Benutzername aus Strato  |
| `STRATO_SFTP_PASSWORD`  | SFTP-Passwort aus Strato      |
| `STRATO_REMOTE_PATH`    | z.B. `/htdocs`                |

## API-Uebersicht

Alle Antworten sind JSON. Geschuetzte Endpunkte pruefen die Session (`wis_session`-Cookie)
und zusaetzlich bei aendernden Requests den Header `X-CSRF-Token` (Wert kommt aus `/api/me.php`
bzw. der Login-Antwort).

| Methode | Pfad                              | Rolle    | Zweck                              |
|---------|-----------------------------------|----------|--------------------------------------|
| POST    | `/api/auth/login.php`             | -        | Login (E-Mail + Passwort)           |
| POST    | `/api/auth/logout.php`            | eingeloggt | Logout                            |
| GET     | `/api/me.php`                     | -        | Aktuelle Session + CSRF-Token       |
| GET     | `/api/pages.php`                  | -        | Seitenbaum                          |
| GET     | `/api/blocks.php?page=<slug>`     | -        | Bloecke einer Seite (oeffentlich, fuer Live-Seite & Vorschau) |
| POST    | `/api/blocks.php`                 | editor+  | Neuen Block anlegen                 |
| PUT     | `/api/blocks.php?id=<id>`         | editor+  | Block-Inhalt aktualisieren          |
| PUT     | `/api/blocks.php?reorder=1`       | editor+  | Reihenfolge mehrerer Bloecke setzen |
| DELETE  | `/api/blocks.php?id=<id>`         | editor+  | Block loeschen                      |

## Block-Inhaltsformat (`content`-Spalte, JSON)

| type       | content-Struktur                                              |
|------------|------------------------------------------------------------------|
| `heading`  | `{ "text": "...", "level": 1-6 }`                                |
| `richtext` | `{ "html": "<p>...</p>" }` (bereits sanitisiertes HTML aus dem Editor) |
| `image`    | `{ "src": "...", "alt": "...", "align": "left|right|center", "width": "..." }` |
| `button`   | `{ "text": "...", "url": "..." }`                                |
| `divider`  | `{}`                                                              |

## Sicherheit (bereits umgesetzt)

- Ausschliesslich PDO Prepared Statements (kein String-Concat in SQL).
- Passwoerter via `password_hash`/`password_verify` (bcrypt).
- Sessions: `httpOnly`, `SameSite=Strict`, `secure` sobald HTTPS erkannt wird.
- CSRF-Token pro Session, erforderlich bei allen aendernden Requests.
- Login-Rate-Limiting: 5 Fehlversuche pro E-Mail = 15 Minuten Sperre.
- Audit-Log (`audit_log`-Tabelle) fuer Login, Block-Aenderungen etc.
- `.htaccess` blockiert direkten Zugriff auf `config.php`, `schema.sql` und `lib/`.

Noch offen (Phase 3/4): Admin-Dashboard-UI, Rollen-Verwaltung/Einladungs-Mails, Bild-Upload
mit WebP-Konvertierung, Ankuendigungs-Board-Endpunkte.
