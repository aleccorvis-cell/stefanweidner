<?php
/**
 * Nur fuer lokale Entwicklung: legt die SQLite-Testdatenbank an (backend/dev.sqlite)
 * und erstellt einen ersten Owner-Account.
 *
 * Aufruf: php backend/bin/init-local-db.php owner@example.com einTestPasswort
 */

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

$config = wis_config();

if ($config['db_driver'] !== 'sqlite') {
    fwrite(STDERR, "Dieses Skript ist nur fuer db_driver=sqlite gedacht (lokale Entwicklung).\n");
    exit(1);
}

if ($argc < 3) {
    fwrite(STDERR, "Aufruf: php {$argv[0]} <owner-email> <passwort>\n");
    exit(1);
}

[$script, $email, $password] = $argv;

$schemaPath = __DIR__ . '/../schema.sqlite.sql';
$pdo = wis_db();
$pdo->exec(file_get_contents($schemaPath));

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    echo "Nutzer $email existiert bereits - ueberspringe Anlage.\n";
} else {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$email, $hash, 'owner', 'active']);
    echo "Owner-Account angelegt: $email\n";
}

echo "Lokale SQLite-DB bereit unter: {$config['db_sqlite_path']}\n";
