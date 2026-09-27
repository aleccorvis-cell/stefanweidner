<?php
require_once __DIR__ . '/../../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    wis_json_error(405, 'Nur POST erlaubt.');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim($input['email'] ?? '');
$password = (string) ($input['password'] ?? '');

if ($email === '' || $password === '') {
    wis_json_error(400, 'E-Mail und Passwort erforderlich.');
}

if (wis_is_rate_limited($email)) {
    wis_json_error(429, 'Zu viele Fehlversuche. Bitte in ' . WIS_LOGIN_LOCKOUT_MINUTES . ' Minuten erneut versuchen.');
}

$stmt = wis_db()->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

wis_record_login_attempt($email);

if (!$user || $user['status'] !== 'active' || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
    wis_audit($user['id'] ?? null, 'login.failed', $email);
    wis_json_error(401, 'E-Mail oder Passwort falsch.');
}

wis_start_session();
session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];

wis_audit($user['id'], 'login.success');

wis_json_response([
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
    'csrf_token' => wis_csrf_token(),
]);
