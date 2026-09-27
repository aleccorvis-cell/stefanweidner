<?php
/**
 * Mail-Versand ueber Resend (https://resend.com) - gleiches Muster wie im
 * KI-Kompetenzschulung-Projekt, nur per einfachem HTTP-Request (curl) statt
 * Node-SDK, da dieses Backend reines PHP ist.
 *
 * Ohne konfigurierten API-Key (lokal/vor Einrichtung) schlaegt der Versand
 * einfach fehl (Rueckgabewert false) - die Aufrufer (users.php,
 * forgot-password.php) geben den Link im Owner-Kontext trotzdem zusaetzlich
 * zurueck, sodass die Funktion nicht blockiert ist.
 */

function wis_send_mail(string $to, string $subject, string $bodyText): bool
{
    $config = wis_config();
    $apiKey = $config['resend_api_key'] ?? '';

    if ($apiKey === '') {
        return false;
    }

    $from = $config['resend_from'] ?? 'Written in Sound <onboarding@resend.dev>';
    $html = '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;white-space:pre-line;">'
        . htmlspecialchars($bodyText, ENT_QUOTES, 'UTF-8')
        . '</div>';

    $payload = json_encode([
        'from' => $from,
        'to' => [$to],
        'subject' => $subject,
        'html' => $html,
        'text' => $bodyText,
    ]);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $response !== false && $status >= 200 && $status < 300;
}
