<?php
/**
 * POST /api/auth/set-password.php { token, password }
 * Oeffentlich (kein Login noetig) - wird sowohl fuer die Einladungs-Annahme
 * (invite_token) als auch fuer selbst angeforderte Passwort-Resets
 * (password_reset_token) verwendet: technisch identischer Vorgang.
 */
require_once __DIR__ . '/../../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    wis_json_error(405, 'Nur POST erlaubt.');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$token = trim($input['token'] ?? '');
$password = (string) ($input['password'] ?? '');

if ($token === '' || strlen($password) < 8) {
    wis_json_error(400, 'Token fehlt oder Passwort ist zu kurz (mind. 8 Zeichen).');
}

$db = wis_db();
$now = date('Y-m-d H:i:s');

// Erst als Einladung, dann als Passwort-Reset pruefen
$stmt = $db->prepare('SELECT * FROM users WHERE invite_token = ? AND invite_expires_at > ?');
$stmt->execute([$token, $now]);
$user = $stmt->fetch();
$isInvite = (bool) $user;

if (!$user) {
    $stmt = $db->prepare('SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires_at > ?');
    $stmt->execute([$token, $now]);
    $user = $stmt->fetch();
}

if (!$user) {
    wis_json_error(400, 'Link ist ungültig oder abgelaufen. Bitte neuen Link anfordern.');
}

$hash = password_hash($password, PASSWORD_DEFAULT);

if ($isInvite) {
    $stmt = $db->prepare(
        'UPDATE users SET password_hash = ?, status = ?, invite_token = NULL, invite_expires_at = NULL WHERE id = ?'
    );
    $stmt->execute([$hash, 'active', $user['id']]);
} else {
    $stmt = $db->prepare(
        'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?'
    );
    $stmt->execute([$hash, $user['id']]);
}

wis_audit($user['id'], $isInvite ? 'user.accept_invite' : 'user.reset_password_complete');
wis_json_response(['ok' => true]);
