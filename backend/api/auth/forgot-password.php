<?php
/**
 * POST /api/auth/forgot-password.php { email }
 * Oeffentliches Self-Service-Reset. Antwortet IMMER gleich (unabhaengig davon
 * ob die E-Mail existiert) und gibt den Link NIE in der Antwort zurueck -
 * nur per Mail. Alles andere waere ein Account-Enumeration/Takeover-Risiko.
 */
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    wis_json_error(405, 'Nur POST erlaubt.');
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim(strtolower($input['email'] ?? ''));

if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $db = wis_db();
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND status = ?');
    $stmt->execute([$email, 'active']);
    $user = $stmt->fetch();

    if ($user) {
        $token = wis_generate_token();
        $expires = date('Y-m-d H:i:s', time() + 48 * 3600);

        $stmt = $db->prepare('UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?');
        $stmt->execute([$token, $expires, $user['id']]);

        $config = wis_config();
        $link = rtrim($config['app_url'], '/') . '/set-password.html?token=' . $token;

        wis_send_mail(
            $email,
            'Passwort zurücksetzen - Written in Sound',
            "Für deinen Zugang wurde ein Passwort-Reset angefordert.\n\n" .
            "Neues Passwort hier festlegen (gültig 48 Stunden):\n$link\n\n" .
            "Falls du das nicht warst, kannst du diese Mail ignorieren."
        );

        wis_audit($user['id'], 'user.forgot_password_request');
    }
}

// Immer der gleiche generische Text, egal ob die E-Mail existierte
wis_json_response(['message' => 'Falls diese E-Mail-Adresse bei uns registriert ist, wurde ein Link zum Zurücksetzen verschickt.']);
