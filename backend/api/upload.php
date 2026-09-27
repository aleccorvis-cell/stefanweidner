<?php
/**
 * POST /api/upload.php - Bild-Upload mit automatischer WebP-Konvertierung.
 * Editor+ erforderlich, CSRF-Token noetig. Multipart-Formular mit Feld "image".
 * Antwort: { "url": "/uploads/xyz.webp", "width": ..., "height": ... }
 */
require_once __DIR__ . '/../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    wis_json_error(405, 'Nur POST erlaubt.');
}

$user = wis_require_role('editor');
wis_verify_csrf();

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    wis_json_error(400, 'Kein gueltiges Bild empfangen.');
}

$tmpPath = $_FILES['image']['tmp_name'];
$info = @getimagesize($tmpPath);

if ($info === false) {
    wis_json_error(400, 'Datei ist kein gueltiges Bild.');
}

[$width, $height, $type] = $info;

$maxDimension = 4000;
if ($width > $maxDimension || $height > $maxDimension) {
    wis_json_error(400, "Bild zu gross (max. {$maxDimension}px pro Seite).");
}

// Aus dem tatsaechlichen Bildinhalt neu rendern (nicht die hochgeladene Datei
// 1:1 uebernehmen) - das entfernt zuverlaessig jeglichen eingebetteten Code/Exploits
switch ($type) {
    case IMAGETYPE_JPEG:
        $image = imagecreatefromjpeg($tmpPath);
        break;
    case IMAGETYPE_PNG:
        $image = imagecreatefrompng($tmpPath);
        break;
    case IMAGETYPE_WEBP:
        $image = imagecreatefromwebp($tmpPath);
        break;
    case IMAGETYPE_GIF:
        $image = imagecreatefromgif($tmpPath);
        break;
    default:
        wis_json_error(400, 'Nicht unterstuetztes Bildformat. Erlaubt: JPEG, PNG, WebP, GIF.');
}

if (!$image) {
    wis_json_error(400, 'Bild konnte nicht gelesen werden.');
}

// Transparenz erhalten (PNG/WebP/GIF)
imagepalettetotruecolor($image);
imagealphablending($image, true);
imagesavealpha($image, true);

$uploadsDir = __DIR__ . '/../../uploads';

if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$filename = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.webp';
$destPath = $uploadsDir . '/' . $filename;

if (!imagewebp($image, $destPath, 85)) {
    imagedestroy($image);
    wis_json_error(500, 'WebP-Konvertierung fehlgeschlagen.');
}

imagedestroy($image);
wis_audit($user['id'], 'image.upload', $filename);

wis_json_response([
    'url' => '/uploads/' . $filename,
    'width' => $width,
    'height' => $height,
]);
