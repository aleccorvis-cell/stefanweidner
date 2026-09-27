<?php
/**
 * Ankuendigungen ("Schwarzes Brett").
 *
 * GET    (oeffentlich)              Aktive Ankuendigungen (fuer die Live-Seite),
 *                                     sortiert nach sort_order
 * GET    ?all=1     (editor+)       Alle nicht-archivierten Ankuendigungen (Admin-Liste)
 * GET    ?archived=1 (editor+)      Archivierte Ankuendigungen
 * POST               (editor+)      Neue Ankuendigung anlegen
 * PUT    ?id=<id>    (editor+)      Ankuendigung aktualisieren
 * PUT    ?id=<id>&restore=1 (editor+) Aus dem Archiv wiederherstellen
 * PUT    ?reorder=1  (editor+)      Body: { order: [id, id, ...] }
 * DELETE ?id=<id>    (editor+)      Endgueltig loeschen
 *
 * "Aktiv" wird bei jedem Request live berechnet (kein Cron auf Strato Basic
 * verfuegbar): is_active=1 AND (start_at NULL oder <= jetzt) AND (end_at NULL
 * oder >= jetzt). Abgelaufene Eintraege werden beim GET automatisch archiviert.
 */
require_once __DIR__ . '/../lib/auth.php';

const WIS_MAX_ACTIVE_ANNOUNCEMENTS = 20;

function wis_auto_archive_expired(PDO $db): void
{
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare(
        'UPDATE announcements SET is_archived = 1
         WHERE is_archived = 0 AND end_at IS NOT NULL AND end_at < ?'
    );
    $stmt->execute([$now]);
}

function wis_row_to_announcement(array $row): array
{
    $row['is_active'] = (bool) $row['is_active'];
    $row['is_archived'] = (bool) $row['is_archived'];
    return $row;
}

$method = $_SERVER['REQUEST_METHOD'];
$db = wis_db();
wis_auto_archive_expired($db);

if ($method === 'GET' && !isset($_GET['all']) && !isset($_GET['archived'])) {
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare(
        "SELECT * FROM announcements
         WHERE is_archived = 0 AND is_active = 1
           AND (start_at IS NULL OR start_at <= ?)
           AND (end_at IS NULL OR end_at >= ?)
         ORDER BY sort_order ASC"
    );
    $stmt->execute([$now, $now]);
    $rows = array_map('wis_row_to_announcement', $stmt->fetchAll());

    wis_json_response(['announcements' => $rows]);
}

if ($method === 'GET' && isset($_GET['all'])) {
    wis_require_role('editor');
    $stmt = $db->query('SELECT * FROM announcements WHERE is_archived = 0 ORDER BY sort_order ASC');
    wis_json_response(['announcements' => array_map('wis_row_to_announcement', $stmt->fetchAll())]);
}

if ($method === 'GET' && isset($_GET['archived'])) {
    wis_require_role('editor');
    $stmt = $db->query('SELECT * FROM announcements WHERE is_archived = 1 ORDER BY updated_at DESC');
    wis_json_response(['announcements' => array_map('wis_row_to_announcement', $stmt->fetchAll())]);
}

if ($method === 'POST') {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $stmt = $db->query('SELECT COUNT(*) AS n FROM announcements WHERE is_archived = 0');
    if ((int) $stmt->fetch()['n'] >= WIS_MAX_ACTIVE_ANNOUNCEMENTS) {
        wis_json_error(400, 'Maximal ' . WIS_MAX_ACTIVE_ANNOUNCEMENTS . ' Ankündigungen gleichzeitig erlaubt. Bitte erst welche archivieren.');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $title = trim($input['title'] ?? 'Neue Ankündigung');

    $stmt = $db->query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM announcements WHERE is_archived = 0');
    $nextOrder = (int) $stmt->fetch()['next'];

    $stmt = $db->prepare(
        'INSERT INTO announcements (title, body, media_type, media_url, is_active, start_at, end_at, sort_order, created_by)
         VALUES (?, ?, ?, ?, 0, NULL, NULL, ?, ?)'
    );
    $stmt->execute([$title, '', 'none', null, $nextOrder, $user['id']]);

    $newId = (int) $db->lastInsertId();
    wis_audit($user['id'], 'announcement.create', 'announcement:' . $newId);
    wis_json_response(['id' => $newId], 201);
}

if ($method === 'PUT' && isset($_GET['reorder'])) {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $order = $input['order'] ?? [];

    $stmt = $db->prepare('UPDATE announcements SET sort_order = ? WHERE id = ?');
    foreach ($order as $position => $id) {
        $stmt->execute([$position, (int) $id]);
    }

    wis_audit($user['id'], 'announcements.reorder');
    wis_json_response(['ok' => true]);
}

if ($method === 'PUT' && isset($_GET['id']) && isset($_GET['restore'])) {
    $user = wis_require_role('editor');
    wis_verify_csrf();
    $id = (int) $_GET['id'];

    $stmt = $db->prepare('UPDATE announcements SET is_archived = 0, is_active = 0 WHERE id = ?');
    $stmt->execute([$id]);

    wis_audit($user['id'], 'announcement.restore', 'announcement:' . $id);
    wis_json_response(['ok' => true]);
}

if ($method === 'PUT' && isset($_GET['id'])) {
    $user = wis_require_role('editor');
    wis_verify_csrf();
    $id = (int) $_GET['id'];

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $fields = [];
    $values = [];

    foreach (['title', 'body', 'media_type', 'media_url', 'start_at', 'end_at'] as $key) {
        if (array_key_exists($key, $input)) {
            $fields[] = "$key = ?";
            $values[] = $input[$key] === '' ? null : $input[$key];
        }
    }

    if (array_key_exists('is_active', $input)) {
        $fields[] = 'is_active = ?';
        $values[] = $input['is_active'] ? 1 : 0;
    }

    if (array_key_exists('is_archived', $input)) {
        $fields[] = 'is_archived = ?';
        $values[] = $input['is_archived'] ? 1 : 0;
    }

    if (empty($fields)) {
        wis_json_error(400, 'Keine Felder zum Aktualisieren übergeben.');
    }

    $values[] = $id;
    $stmt = $db->prepare('UPDATE announcements SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($values);

    wis_audit($user['id'], 'announcement.update', 'announcement:' . $id);
    wis_json_response(['ok' => true]);
}

if ($method === 'DELETE' && isset($_GET['id'])) {
    $user = wis_require_role('editor');
    wis_verify_csrf();
    $id = (int) $_GET['id'];

    $stmt = $db->prepare('DELETE FROM announcements WHERE id = ?');
    $stmt->execute([$id]);

    wis_audit($user['id'], 'announcement.delete', 'announcement:' . $id);
    wis_json_response(['ok' => true]);
}

wis_json_error(405, 'Methode nicht erlaubt.');
