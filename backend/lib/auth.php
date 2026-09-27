<?php
/**
 * Authentifizierung, Sessions, CSRF-Schutz, Rate-Limiting, Audit-Log.
 * Rollen-Hierarchie: owner > editor > viewer.
 */

require_once __DIR__ . '/db.php';

const WIS_ROLE_RANK = ['viewer' => 1, 'editor' => 2, 'owner' => 3];
const WIS_MAX_LOGIN_ATTEMPTS = 5;
const WIS_LOGIN_LOCKOUT_MINUTES = 15;

function wis_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $config = wis_config();
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    session_name('wis_session');
    session_start();
}

function wis_current_user(): ?array
{
    wis_start_session();

    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = wis_db()->prepare('SELECT id, email, role, status FROM users WHERE id = ? AND status = ?');
    $stmt->execute([$_SESSION['user_id'], 'active']);
    $user = $stmt->fetch();

    return $user ?: null;
}

/**
 * Bricht die Anfrage mit 401/403 ab, wenn kein Nutzer eingeloggt ist bzw.
 * dessen Rolle nicht mindestens $minRole entspricht.
 */
function wis_require_role(string $minRole): array
{
    $user = wis_current_user();

    if (!$user) {
        wis_json_error(401, 'Nicht angemeldet.');
    }

    if (WIS_ROLE_RANK[$user['role']] < WIS_ROLE_RANK[$minRole]) {
        wis_json_error(403, 'Keine Berechtigung fuer diese Aktion.');
    }

    return $user;
}

function wis_json_error(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function wis_json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ========== CSRF ==========

function wis_csrf_token(): string
{
    wis_start_session();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function wis_verify_csrf(): void
{
    wis_start_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $sent)) {
        wis_json_error(403, 'Ungueltiges CSRF-Token.');
    }
}

// ========== Rate-Limiting ==========

function wis_client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function wis_is_rate_limited(string $email): bool
{
    // Cutoff wird in PHP berechnet (nicht in SQL), damit die Query fuer
    // MySQL und SQLite identisch bleibt - beide vergleichen 'YYYY-MM-DD HH:MM:SS' korrekt lexikografisch.
    $cutoff = date('Y-m-d H:i:s', time() - WIS_LOGIN_LOCKOUT_MINUTES * 60);

    $stmt = wis_db()->prepare(
        'SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND attempted_at > ?'
    );
    $stmt->execute([$email, $cutoff]);
    $row = $stmt->fetch();

    return (int) $row['n'] >= WIS_MAX_LOGIN_ATTEMPTS;
}

function wis_record_login_attempt(string $email): void
{
    $stmt = wis_db()->prepare('INSERT INTO login_attempts (email, ip_address) VALUES (?, ?)');
    $stmt->execute([$email, wis_client_ip()]);
}

// ========== Audit-Log ==========

function wis_audit(?int $userId, string $action, ?string $target = null): void
{
    $stmt = wis_db()->prepare(
        'INSERT INTO audit_log (user_id, action, target, ip_address) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $action, $target, wis_client_ip()]);
}

// ========== Tokens (Invite / Passwort-Reset) ==========

function wis_generate_token(): string
{
    return bin2hex(random_bytes(32));
}
