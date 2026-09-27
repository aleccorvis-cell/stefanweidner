<?php
/**
 * Konfigurationsvorlage. Kopieren nach config.php und mit echten Werten fuellen.
 * config.php wird NIE eingecheckt (siehe .gitignore) - die echten Zugangsdaten
 * existieren ausschliesslich lokal bzw. direkt auf dem Strato-Server.
 */

return [
    // 'mysql' auf dem Live-Server (Strato), 'sqlite' fuer lokale Entwicklung ohne DB-Server
    'db_driver' => 'sqlite',

    'db_mysql' => [
        'host' => 'localhost',
        'name' => '',
        'user' => '',
        'password' => '',
        'charset' => 'utf8mb4',
    ],

    // Nur fuer lokale Entwicklung relevant
    'db_sqlite_path' => __DIR__ . '/dev.sqlite',

    // Fuer Einladungs-/Passwort-Reset-Mails an Admins (siehe backend/lib/mailer.php).
    // API-Key unter https://resend.com/api-keys erzeugen. Ohne eigene verifizierte
    // Domain funktioniert der Test-Absender "onboarding@resend.dev" sofort.
    'resend_api_key' => '',
    'resend_from' => 'Written in Sound <onboarding@resend.dev>',

    // Zufaellige, lange Zeichenkette fuer Session-/CSRF-Sicherheit (z.B. via bin2hex(random_bytes(32)))
    'app_secret' => 'CHANGE-ME',

    'app_url' => 'https://www.writteninsoundmusic.com',
];
