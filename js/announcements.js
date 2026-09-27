/**
 * Ankündigungen ("Schwarzes Brett") - laedt aktive Ankuendigungen von der
 * Backend-API und zeigt entweder die Liste oder einen "Coming Soon"-Hinweis.
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('announcementsList');
  if (!container) return;

  loadAnnouncements(container);
});

async function loadAnnouncements(container) {
  try {
    const res = await fetch('backend/api/announcements.php');
    const data = await res.json();
    renderAnnouncements(container, data.announcements || []);
  } catch (err) {
    container.innerHTML = '<div class="announcements-empty"><p>Ankündigungen konnten nicht geladen werden.</p></div>';
  }
}

function renderAnnouncements(container, items) {
  if (items.length === 0) {
    container.innerHTML = `
      <div class="announcements-empty">
        <h2>Coming Soon</h2>
        <p>Hier erscheinen in Kürze aktuelle Ankündigungen.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(renderCard).join('');
}

function renderCard(item) {
  const mediaHtml = renderMedia(item);

  return `
    <article class="glass-card announcement-card">
      ${mediaHtml}
      <div class="announcement-card-body">
        ${item.title ? `<h2 class="announcement-title">${escapeHtml(item.title)}</h2>` : ''}
        ${item.body ? `<p class="announcement-text">${escapeHtml(item.body)}</p>` : ''}
      </div>
    </article>
  `;
}

function renderMedia(item) {
  if (item.media_type === 'image' && item.media_url) {
    return `<img class="announcement-media" src="${escapeAttr(item.media_url)}" alt="" loading="lazy">`;
  }

  if (item.media_type === 'video' && item.media_url) {
    // Externer Link (z.B. YouTube) - eingebettet, kein direkter Datei-Download-Button
    return `<div class="announcement-media announcement-media-video">
      <iframe src="${escapeAttr(item.media_url)}" loading="lazy" allowfullscreen
        title="${escapeAttr(item.title || 'Video')}"></iframe>
    </div>`;
  }

  return '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
