<?php
require_once __DIR__ . '/../lib/auth.php';

$user = wis_current_user();

if (!$user) {
    wis_json_response(['user' => null]);
}

wis_json_response([
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
    'csrf_token' => wis_csrf_token(),
]);
