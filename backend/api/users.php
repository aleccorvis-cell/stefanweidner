<?php
/**
 * Team-Verwaltung - ausschliesslich fuer die Rolle "owner".
 *
 * GET                        Alle Nutzer auflisten
 * POST                       Neuen Nutzer einladen { email, role }
 * PUT  ?id=<id>&action=reset Passwort-Reset-Link fuer diesen Nutzer erzeugen
 * DELETE ?id=<id>            Zugang endgueltig entfernen (keine Wiederherstellung)
 */
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/mailer.php';

const WIS_TOKEN_LIFETIME_HOURS = 48;

$method = $_SERVER['REQUEST_METHOD'];
$currentUser = wis_require_role('owner');
$db = wis_db();

function wis_invite_link(string $token): string
{
    $config = wis_config();
    return rtrim($config['app_url'], '/') . '/set-password.html?token=' . $token;
}

if ($method === 'GET') {
    $stmt = $db->query('SELECT id, email, role, status, created_at FROM users ORDER BY created_at ASC');
    wis_json_response(['users' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    wis_verify_csrf();
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = trim(strtolower($input['email'] ?? ''));
    $role = $input['role'] ?? 'editor';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        wis_json_error(400, 'Ungültige E-Mail-Adresse.');
    }

    if (!in_array($role, ['owner', 'editor', 'viewer'], true)) {
        wis_json_error(400, 'Ungültige Rolle.');
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        wis_json_error(409, 'Für diese E-Mail existiert bereits ein Zugang.');
    }

    $token = wis_generate_token();
    $expires = date('Y-m-d H:i:s', time() + WIS_TOKEN_LIFETIME_HOURS * 3600);

    $stmt = $db->prepare(
        'INSERT INTO users (email, role, status, invite_token, invite_expires_at) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$email, $role, 'pending', $token, $expires]);
    $newId = (int) $db->lastInsertId();

    $link = wis_invite_link($token);
    $mailSent = wis_send_mail(
        $email,
        'Einladung zu Written in Sound',
        "Du wurdest als $role zu Written in Sound eingeladen.\n\n" .
        "Lege dein Passwort hier fest (gültig " . WIS_TOKEN_LIFETIME_HOURS . " Stunden):\n$link\n"
    );

    wis_audit($currentUser['id'], 'user.invite', 'user:' . $newId);

    // Link wird bewusst zusaetzlich zurueckgegeben - Empfaenger ist der bereits
    // authentifizierte Owner, der den Link im Zweifel selbst weiterleiten kann,
    // falls der Mailversand (noch kein SMTP konfiguriert) fehlschlaegt.
    wis_json_response(['id' => $newId, 'invite_link' => $link, 'mail_sent' => $mailSent], 201);
}

if ($method === 'PUT' && isset($_GET['id']) && ($_GET['action'] ?? '') === 'reset') {
    wis_verify_csrf();
    $id = (int) $_GET['id'];

    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $target = $stmt->fetch();

    if (!$target) {
        wis_json_error(404, 'Nutzer nicht gefunden.');
    }

    $token = wis_generate_token();
    $expires = date('Y-m-d H:i:s', time() + WIS_TOKEN_LIFETIME_HOURS * 3600);

    $stmt = $db->prepare('UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?');
    $stmt->execute([$token, $expires, $id]);

    $link = wis_invite_link($token);
    $mailSent = wis_send_mail(
        $target['email'],
        'Passwort zurücksetzen - Written in Sound',
        "Für deinen Zugang wurde ein Passwort-Reset angefordert.\n\n" .
        "Neues Passwort hier festlegen (gültig " . WIS_TOKEN_LIFETIME_HOURS . " Stunden):\n$link\n"
    );

    wis_audit($currentUser['id'], 'user.reset_password', 'user:' . $id);
    wis_json_response(['reset_link' => $link, 'mail_sent' => $mailSent]);
}

if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = (int) $_GET['id'];

    if ($id === $currentUser['id']) {
        wis_json_error(400, 'Der eigene Zugang kann nicht selbst entfernt werden.');
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);

    wis_audit($currentUser['id'], 'user.delete', 'user:' . $id);
    wis_json_response(['ok' => true]);
}

wis_json_error(405, 'Methode nicht erlaubt.');
