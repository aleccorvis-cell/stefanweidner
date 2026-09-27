-- Written in Sound - CMS Datenbankschema (MySQL/MariaDB, fuer Strato Hosting Basic)
-- Zeichensatz utf8mb4 fuer volle Unicode-Unterstuetzung (Umlaute, Emojis in Ankuendigungen etc.)

SET NAMES utf8mb4;

-- ========== Benutzer & Rollen ==========
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,           -- NULL solange Einladung noch nicht angenommen wurde
    role ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'editor',
    status ENUM('pending', 'active', 'disabled') NOT NULL DEFAULT 'pending',
    invite_token VARCHAR(64) NULL,
    invite_expires_at DATETIME NULL,
    password_reset_token VARCHAR(64) NULL,
    password_reset_expires_at DATETIME NULL,
    failed_login_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_invite_token (invite_token),
    INDEX idx_users_reset_token (password_reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Seiten (Page-Tree fuer das Admin-Dashboard) ==========
CREATE TABLE IF NOT EXISTS pages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,          -- z.B. "index", "vita", "leistungen"
    title VARCHAR(255) NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Inhalts-Bloecke (Block-Editor: Text, Bild, Button, Divider ...) ==========
CREATE TABLE IF NOT EXISTS blocks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id INT UNSIGNED NOT NULL,
    type ENUM('heading', 'richtext', 'image', 'button', 'divider') NOT NULL,
    content JSON NOT NULL,                      -- Struktur je nach type, siehe backend/README.md
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_blocks_page_sort (page_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Ankuendigungen ("Schwarzes Brett") ==========
CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NULL,
    media_type ENUM('none', 'image', 'video') NOT NULL DEFAULT 'none',
    media_url VARCHAR(500) NULL,                -- externer Link (Video) oder Pfad zum hochgeladenen Bild
    is_active TINYINT(1) NOT NULL DEFAULT 0,    -- manuelles Haekchen
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    is_archived TINYINT(1) NOT NULL DEFAULT 0,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_announcements_active (is_archived, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Audit-Log (Nachvollziehbarkeit bei Sicherheitsvorfaellen) ==========
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,               -- z.B. "login", "block.update", "user.invite"
    target VARCHAR(255) NULL,                   -- betroffene Entitaet, z.B. "block:42"
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Login-Rate-Limiting ==========
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_email_time (email, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== Seed: initiale Seitenstruktur (passend zu den bestehenden HTML-Seiten) ==========
INSERT INTO pages (slug, title, sort_order) VALUES
    ('index', 'Home', 0),
    ('vita', 'Über Mich', 1),
    ('leistungen', 'Leistungen', 2),
    ('referenzen', 'Referenzen', 3),
    ('media', 'Media', 4),
    ('ankuendigungen', 'Ankündigungen', 5),
    ('impressum', 'Impressum', 6),
    ('datenschutz', 'Datenschutz', 7)
ON DUPLICATE KEY UPDATE title = VALUES(title);
