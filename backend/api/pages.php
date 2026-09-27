<?php
/**
 * GET /api/pages.php - Seitenbaum fuer das Admin-Dashboard (Phase 3).
 * Oeffentlich lesbar (keine sensiblen Daten: nur slug/title/Reihenfolge).
 */
require_once __DIR__ . '/../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    wis_json_error(405, 'Nur GET erlaubt.');
}

$stmt = wis_db()->query('SELECT id, slug, title, sort_order FROM pages ORDER BY sort_order ASC');
wis_json_response(['pages' => $stmt->fetchAll()]);
