<?php
/**
 * PDO-Verbindung. 'mysql' auf dem Live-Server, 'sqlite' fuer lokale Entwicklung
 * (siehe config.example.php). Beide Treiber verstehen den gleichen SQL-Dialekt
 * fuer die in dieser Anwendung verwendeten Queries.
 */

function wis_config(): array
{
    static $config = null;

    if ($config === null) {
        $path = __DIR__ . '/../config.php';

        if (!file_exists($path)) {
            http_response_code(500);
            die('config.php fehlt. Bitte config.example.php kopieren und ausfuellen.');
        }

        $config = require $path;
    }

    return $config;
}

function wis_db(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $config = wis_config();
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if ($config['db_driver'] === 'sqlite') {
        $pdo = new PDO('sqlite:' . $config['db_sqlite_path'], null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
        return $pdo;
    }

    $db = $config['db_mysql'];
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $db['host'],
        $db['name'],
        $db['charset'] ?? 'utf8mb4'
    );

    $pdo = new PDO($dsn, $db['user'], $db['password'], $options);

    return $pdo;
}
