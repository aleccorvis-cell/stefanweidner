# Checkliste für eRecht24 (Impressum + Datenschutzerklärung)

Stand: 27.09.2026. Diese Angaben werden bei den eRecht24-Generatoren abgefragt.
Account/Generierung macht der Nutzer selbst (erecht24.de) – ich baue das Ergebnis danach
in `impressum.html`/`datenschutz.html` ein.

## Impressum-Generator

| Feld | Wert |
|---|---|
| Diensteanbieter-Art | Einzelperson/Freiberufler (Musiker) |
| Name | Stefan Weidner |
| Marke/Zusatz | Written in Sound |
| Anschrift | Bruckstr. 24, 73066 Uhingen |
| Telefon | 0174 7089514 |
| E-Mail | mannampiano@gmail.com |
| Umsatzsteuer-ID / Steuernummer | **❓ noch offen – muss bei Stefan erfragt werden, siehe unten** |
| Kleinunternehmer nach §19 UStG? | **❓ noch offen – hängt von obiger Antwort ab** |
| Berufsbezeichnung/Kammer | Keine reglementierte Berufsbezeichnung (Musiker), i.d.R. nicht nötig |
| Verantwortlich nach § 18 Abs. 2 MStV | Stefan Weidner, gleiche Anschrift |
| Verbraucherstreitbeilegung | Nicht bereit/verpflichtet teilzunehmen (bisheriger Text) |

## Datenschutz-Generator

| Frage | Antwort |
|---|---|
| Verantwortlicher | Stefan Weidner, Written in Sound, Bruckstr. 24, 73066 Uhingen, mannampiano@gmail.com |
| Hosting-Anbieter | Strato AG (Deutschland) – mit Auftragsverarbeitungsvertrag |
| Server-Logfiles (IP etc.) | Ja, technisch durch Hosting bedingt (§ 25 Abs. 2 TDDDG) |
| Cookies | **Nein** – Seite setzt aktuell keine Cookies. Theme-Wahl (Hell/Dunkel) läuft über `localStorage`, kein Cookie |
| Google Fonts/externe Schriften | **Nein** – alle Schriften (Inter, Bodoni Moda, Cormorant Garamond) lokal selbst gehostet |
| Kontaktformular | Ja – läuft über Drittanbieter **FormSubmit.co** (USA/EU, sendet Formulardaten per E-Mail), Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO |
| Eingebettete Videos | Ja – YouTube-Embeds auf der Media-Seite (aktuell Platzhalter, grundsätzlich vorzusehen) |
| Social-Media-Verlinkung | Instagram, YouTube, Facebook – nur einfache Links (keine eingebetteten Like-Buttons/Tracking-Plugins) |
| Analytics/Tracking (GA, Matomo, Pixel etc.) | **Nein** – keine im Einsatz |
| Newsletter | Nein |
| Zahlungsdienstleister | Nein (aktuell) |
| Login-/Mitgliederbereich | Ja, aber **nicht für Website-Besucher** – interner Admin-Bereich (`/admin/`) nur für Stefan/Alec zur Seitenpflege. Setzt beim Login einen technisch notwendigen Session-Cookie (kein Tracking, kein Consent nötig nach § 25 Abs. 2 TDDDG) |
| Weitere Auftragsverarbeiter (Backend) | **Resend** (E-Mail-Versand, nur für interne Redakteurs-Einladungen/Passwort-Resets - keine Besucherdaten) |

## Warum sich das ändert (Kontext für den fertigen Text)

- Der Webhoster war bisher nicht namentlich genannt ("ein Webhoster mit AVV") → jetzt konkret **Strato AG**
- Es gibt jetzt einen (nicht-öffentlichen) Login-Bereich mit eigener Datenbank – gehört in die
  Erklärung als kurzer Hinweis, auch wenn er keine Besucherdaten verarbeitet
- Datum "Stand: Januar 2026" muss aktualisiert werden

## ❓ Noch offen

1. **Umsatzsteuer-ID/Steuernummer bei Stefan erfragen** – bevor der Impressum-Generator final
   ausgefüllt wird. Bis dahin: Platzhalter-Hinweis im Impressum.
2. ~~E-Evidence-Passage~~ – entschieden: **weglassen**, nicht Teil des neuen Textes.
