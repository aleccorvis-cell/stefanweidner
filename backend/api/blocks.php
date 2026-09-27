<?php
/**
 * Inhalts-Bloecke einer Seite.
 *
 * GET    ?page=<slug>        Oeffentlich - liefert alle Bloecke einer Seite (fuer Live-Seite & Vorschau)
 * POST   { page_id, type }   Editor+ - neuer leerer Block ans Ende der Seite
 * PUT    ?id=<id>            Editor+ - Inhalt eines Blocks aktualisieren (Body: { content: {...} })
 * DELETE ?id=<id>            Editor+ - Block loeschen
 * PUT    ?reorder=1          Editor+ - Body: { page_id, order: [blockId, blockId, ...] }
 */
require_once __DIR__ . '/../lib/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $slug = $_GET['page'] ?? '';

    if ($slug === '') {
        wis_json_error(400, 'Parameter "page" fehlt.');
    }

    $db = wis_db();
    $stmt = $db->prepare('SELECT id FROM pages WHERE slug = ?');
    $stmt->execute([$slug]);
    $page = $stmt->fetch();

    if (!$page) {
        wis_json_error(404, 'Seite nicht gefunden.');
    }

    $stmt = $db->prepare('SELECT id, type, content, sort_order FROM blocks WHERE page_id = ? ORDER BY sort_order ASC');
    $stmt->execute([$page['id']]);
    $blocks = $stmt->fetchAll();

    foreach ($blocks as &$block) {
        $block['content'] = json_decode($block['content'], true);
    }

    wis_json_response(['blocks' => $blocks]);
}

if ($method === 'PUT' && isset($_GET['reorder'])) {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $pageId = (int) ($input['page_id'] ?? 0);
    $order = $input['order'] ?? [];

    if (!$pageId || !is_array($order)) {
        wis_json_error(400, 'page_id und order erforderlich.');
    }

    $db = wis_db();
    $stmt = $db->prepare('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?');

    foreach ($order as $position => $blockId) {
        $stmt->execute([$position, (int) $blockId, $pageId]);
    }

    wis_audit($user['id'], 'blocks.reorder', 'page:' . $pageId);
    wis_json_response(['ok' => true]);
}

if ($method === 'PUT') {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $id = (int) ($_GET['id'] ?? 0);

    if (!$id) {
        wis_json_error(400, 'Parameter "id" fehlt.');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    if (!isset($input['content'])) {
        wis_json_error(400, 'Feld "content" fehlt.');
    }

    $db = wis_db();
    $stmt = $db->prepare('UPDATE blocks SET content = ? WHERE id = ?');
    $stmt->execute([json_encode($input['content'], JSON_UNESCAPED_UNICODE), $id]);

    wis_audit($user['id'], 'block.update', 'block:' . $id);
    wis_json_response(['ok' => true]);
}

if ($method === 'POST') {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $pageId = (int) ($input['page_id'] ?? 0);
    $type = $input['type'] ?? '';
    $allowedTypes = ['heading', 'richtext', 'image', 'button', 'divider'];

    if (!$pageId || !in_array($type, $allowedTypes, true)) {
        wis_json_error(400, 'page_id und gueltiger type erforderlich.');
    }

    $db = wis_db();
    $stmt = $db->prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM blocks WHERE page_id = ?');
    $stmt->execute([$pageId]);
    $nextOrder = (int) $stmt->fetch()['next'];

    $stmt = $db->prepare('INSERT INTO blocks (page_id, type, content, sort_order) VALUES (?, ?, ?, ?)');
    $stmt->execute([$pageId, $type, json_encode(new stdClass()), $nextOrder]);

    $newId = (int) $db->lastInsertId();
    wis_audit($user['id'], 'block.create', 'block:' . $newId);
    wis_json_response(['id' => $newId], 201);
}

if ($method === 'DELETE') {
    $user = wis_require_role('editor');
    wis_verify_csrf();

    $id = (int) ($_GET['id'] ?? 0);

    if (!$id) {
        wis_json_error(400, 'Parameter "id" fehlt.');
    }

    $stmt = wis_db()->prepare('DELETE FROM blocks WHERE id = ?');
    $stmt->execute([$id]);

    wis_audit($user['id'], 'block.delete', 'block:' . $id);
    wis_json_response(['ok' => true]);
}

wis_json_error(405, 'Methode nicht erlaubt.');
