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

    'smtp' => [
        'host' => '',
        'port' => 587,
        'user' => '',
        'password' => '',
        'from_email' => '',
        'from_name' => 'Written in Sound',
    ],

    // Zufaellige, lange Zeichenkette fuer Session-/CSRF-Sicherheit (z.B. via bin2hex(random_bytes(32)))
    'app_secret' => 'CHANGE-ME',

    'app_url' => 'https://www.writteninsoundmusic.com',
];
