<?php
require_once __DIR__ . '/../../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    wis_json_error(405, 'Nur POST erlaubt.');
}

$user = wis_current_user();
wis_verify_csrf();

wis_start_session();

if ($user) {
    wis_audit($user['id'], 'logout');
}

$_SESSION = [];
session_destroy();

wis_json_response(['ok' => true]);
