/**
 * Written in Sound - Admin-Dashboard
 * Vanilla JS, kein Build-Step (gleiche Konvention wie js/main.js der Hauptseite).
 */

const API = '../backend/api';

const state = {
  user: null,
  csrf: null,
  pages: [],
  currentPage: null,
  blocks: [],
};

const CI_FONTS = [
  { label: 'Inter (Standard)', value: 'Inter, Arial, sans-serif' },
  { label: 'Bodoni Moda (Display)', value: "'Bodoni Moda', serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
];

const CI_COLORS = [
  { label: 'Ivory', value: '#f8f6ef' },
  { label: 'Charcoal', value: '#1b1b1b' },
  { label: 'Gold', value: '#b89b68' },
];

const BLOCK_TYPE_LABELS = {
  heading: 'Überschrift',
  richtext: 'Textblock',
  image: 'Bild',
  button: 'Button',
  divider: 'Trennlinie',
};

// ========== API-Hilfsfunktion ==========

async function api(path, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && state.csrf) headers['X-CSRF-Token'] = state.csrf;

  const res = await fetch(`${API}/${path}`, {
    method,
    headers,
    credentials: 'include',
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // kein JSON-Body
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }

  return data;
}

// ========== Auth ==========

async function checkAuth() {
  const data = await api('me.php');
  if (data.user) {
    state.user = data.user;
    state.csrf = data.csrf_token;
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('adminApp').hidden = true;
}

async function showApp() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('adminApp').hidden = false;
  document.getElementById('currentUserLabel').textContent =
    `${state.user.email} (${state.user.role})`;

  if (state.user.role === 'owner') {
    document.getElementById('teamNavTitle').hidden = false;
    document.getElementById('ownerNavList').hidden = false;
  }

  await loadPages();
}

document.getElementById('teamNavBtn').addEventListener('click', () => {
  state.currentPage = null;
  renderPageTree();
  document.getElementById('teamNavBtn').classList.add('active');
  document.querySelector('.add-block-row').hidden = true;
  loadTeamAdmin();
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.style.display = 'none';

  try {
    const data = await api('auth/login.php', { method: 'POST', body: { email, password } });
    state.user = data.user;
    state.csrf = data.csrf_token;
    await showApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
});

document.getElementById('forgotPasswordBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const errorEl = document.getElementById('loginError');
  const successEl = document.getElementById('loginSuccess');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!email) {
    errorEl.textContent = 'Bitte zuerst E-Mail-Adresse oben eintragen.';
    errorEl.style.display = 'block';
    return;
  }

  const data = await api('auth/forgot-password.php', { method: 'POST', body: { email } });
  successEl.textContent = data.message;
  successEl.style.display = 'block';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await api('auth/logout.php', { method: 'POST' });
  } catch (e) {
    // egal, Session lokal trotzdem verwerfen
  }
  state.user = null;
  state.csrf = null;
  showLogin();
});

// ========== Seitenbaum ==========

async function loadPages() {
  const data = await api('pages.php');
  state.pages = data.pages;
  renderPageTree();

  if (state.pages.length > 0) {
    selectPage(state.pages[0]);
  }
}

function renderPageTree() {
  const tree = document.getElementById('pageTree');
  tree.innerHTML = '';

  state.pages.forEach((page) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'page-tree-item';
    btn.textContent = page.title;
    btn.type = 'button';
    if (state.currentPage && state.currentPage.id === page.id) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => selectPage(page));
    li.appendChild(btn);
    tree.appendChild(li);
  });
}

async function selectPage(page) {
  state.currentPage = page;
  renderPageTree();
  document.getElementById('teamNavBtn')?.classList.remove('active');

  const addBlockRow = document.querySelector('.add-block-row');

  if (page.slug === 'ankuendigungen') {
    addBlockRow.hidden = true;
    await loadAnnouncementsAdmin();
    return;
  }

  addBlockRow.hidden = false;
  const data = await api(`blocks.php?page=${encodeURIComponent(page.slug)}`);
  state.blocks = data.blocks;
  renderBlockList();
  renderPreview();
}

// ========== Vorschau (Mitte) ==========

function renderPreview() {
  const el = document.getElementById('previewContent');

  if (state.blocks.length === 0) {
    el.innerHTML = '<p class="preview-empty">Noch keine Inhalte auf dieser Seite. Füge rechts einen Block hinzu.</p>';
    return;
  }

  el.innerHTML = state.blocks.map(renderBlockPreview).join('');
}

function renderBlockPreview(block) {
  const c = block.content || {};

  switch (block.type) {
    case 'heading': {
      const level = Math.min(6, Math.max(1, c.level || 2));
      return `<h${level}>${escapeHtml(c.text || '')}</h${level}>`;
    }
    case 'richtext':
      return `<div class="pv-richtext">${c.html || ''}</div>`;
    case 'image':
      return `<img class="pv-image" src="${escapeAttr(c.src || '')}" alt="${escapeAttr(c.alt || '')}"
                style="max-width:${escapeAttr(c.width || '100%')}; ${c.align ? `display:block; margin-${c.align === 'center' ? 'left:auto;margin-right' : c.align}:0;` : ''}">`;
    case 'button':
      return `<a class="btn btn-primary pv-button" href="${escapeAttr(c.url || '#')}">${escapeHtml(c.text || '')}</a>`;
    case 'divider':
      return '<hr style="border-color:var(--glass-border); margin: var(--space-lg) 0;">';
    default:
      return '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// ========== Block-Liste (rechts) ==========

function renderBlockList() {
  const list = document.getElementById('blockList');
  list.innerHTML = '';

  state.blocks.forEach((block) => {
    list.appendChild(buildBlockCard(block));
  });
}

function buildBlockCard(block) {
  const card = document.createElement('div');
  card.className = 'block-card';
  card.draggable = true;
  card.dataset.blockId = block.id;

  const header = document.createElement('div');
  header.className = 'block-card-header';
  header.innerHTML = `
    <span class="block-card-type">${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
    <span class="block-card-actions">
      <button class="icon-btn" data-action="delete" title="Löschen">🗑</button>
    </span>
  `;
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'block-card-body';
  card.appendChild(body);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary admin-btn-sm block-save-btn';
  saveBtn.textContent = 'Speichern';
  card.appendChild(saveBtn);

  const getContent = buildBlockFields(block, body);

  saveBtn.addEventListener('click', async () => {
    saveBtn.textContent = 'Speichere...';
    try {
      const content = getContent();
      await api(`blocks.php?id=${block.id}`, { method: 'PUT', body: { content } });
      block.content = content;
      renderPreview();
      saveBtn.textContent = 'Gespeichert ✓';
      setTimeout(() => { saveBtn.textContent = 'Speichern'; }, 1500);
    } catch (err) {
      alert('Fehler beim Speichern: ' + err.message);
      saveBtn.textContent = 'Speichern';
    }
  });

  header.querySelector('[data-action="delete"]').addEventListener('click', async () => {
    if (!confirm('Diesen Block wirklich löschen?')) return;
    await api(`blocks.php?id=${block.id}`, { method: 'DELETE' });
    state.blocks = state.blocks.filter((b) => b.id !== block.id);
    renderBlockList();
    renderPreview();
  });

  // Drag & Drop Reorder
  card.addEventListener('dragstart', () => card.classList.add('dragging'));
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    persistOrder();
  });

  return card;
}

document.getElementById('blockList').addEventListener('dragover', (e) => {
  e.preventDefault();
  const list = e.currentTarget;
  const dragging = list.querySelector('.dragging');
  if (!dragging) return;
  const after = getDragAfterElement(list, e.clientY);
  if (after == null) {
    list.appendChild(dragging);
  } else {
    list.insertBefore(dragging, after);
  }
});

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll('.block-card:not(.dragging)')];
  return cards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function persistOrder() {
  const ids = [...document.querySelectorAll('#blockList .block-card')].map((c) => Number(c.dataset.blockId));
  state.blocks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  renderPreview();
  await api('blocks.php?reorder=1', {
    method: 'PUT',
    body: { page_id: state.currentPage.id, order: ids },
  });
}

// ========== Feld-Editoren je Block-Typ ==========

function buildBlockFields(block, container) {
  const c = block.content || {};

  if (block.type === 'heading') {
    const textInput = document.createElement('input');
    textInput.className = 'form-input';
    textInput.value = c.text || '';
    textInput.placeholder = 'Überschrift-Text';
    textInput.addEventListener('input', renderPreviewLive);

    const levelSelect = document.createElement('select');
    levelSelect.className = 'form-select';
    [1, 2, 3, 4, 5, 6].forEach((lvl) => {
      const opt = document.createElement('option');
      opt.value = lvl;
      opt.textContent = `H${lvl}`;
      if ((c.level || 2) === lvl) opt.selected = true;
      levelSelect.appendChild(opt);
    });
    levelSelect.addEventListener('change', renderPreviewLive);

    container.append(textInput, levelSelect);

    function renderPreviewLive() {
      block.content = { text: textInput.value, level: Number(levelSelect.value) };
      renderPreview();
    }

    return () => ({ text: textInput.value, level: Number(levelSelect.value) });
  }

  if (block.type === 'richtext') {
    return buildRichTextEditor(c, container, block);
  }

  if (block.type === 'image') {
    return buildImageEditor(c, container, block);
  }

  if (block.type === 'button') {
    const textInput = document.createElement('input');
    textInput.className = 'form-input';
    textInput.placeholder = 'Button-Text';
    textInput.value = c.text || '';
    textInput.addEventListener('input', renderPreviewLive);

    const urlInput = document.createElement('input');
    urlInput.className = 'form-input';
    urlInput.placeholder = 'URL (z.B. #kontakt oder https://...)';
    urlInput.value = c.url || '';
    urlInput.addEventListener('input', renderPreviewLive);

    container.append(textInput, urlInput);

    function renderPreviewLive() {
      block.content = { text: textInput.value, url: urlInput.value };
      renderPreview();
    }

    return () => ({ text: textInput.value, url: urlInput.value });
  }

  if (block.type === 'divider') {
    const note = document.createElement('p');
    note.className = 'upload-status';
    note.textContent = 'Trennlinie - keine weiteren Einstellungen.';
    container.appendChild(note);
    return () => ({});
  }

  return () => ({});
}

// ---------- Rich-Text-Editor mit Toolbar ----------

let linkSavedRange = null;
let linkActiveEditable = null;

function buildRichTextEditor(content, container, block) {
  const toolbar = document.createElement('div');
  toolbar.className = 'rt-toolbar';

  const boldBtn = toolbarButton('B', 'Fett', () => document.execCommand('bold'));
  boldBtn.style.fontWeight = '700';
  const italicBtn = toolbarButton('I', 'Kursiv', () => document.execCommand('italic'));
  italicBtn.style.fontStyle = 'italic';
  const underlineBtn = toolbarButton('U', 'Unterstrichen', () => document.execCommand('underline'));
  underlineBtn.style.textDecoration = 'underline';

  const fontSelect = document.createElement('select');
  fontSelect.title = 'Schriftart';
  CI_FONTS.forEach((f) => {
    const opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    fontSelect.appendChild(opt);
  });
  fontSelect.addEventListener('change', () => {
    document.execCommand('fontName', false, fontSelect.value);
  });

  const sizeSelect = document.createElement('select');
  sizeSelect.title = 'Schriftgröße';
  [
    ['14px', 'Klein'], ['17px', 'Normal'], ['22px', 'Groß'], ['30px', 'Sehr groß'],
  ].forEach(([px, label]) => {
    const opt = document.createElement('option');
    opt.value = px;
    opt.textContent = label;
    if (px === '17px') opt.selected = true;
    sizeSelect.appendChild(opt);
  });
  sizeSelect.addEventListener('change', () => wrapSelectionWithStyle(`font-size:${sizeSelect.value}`));

  const colorWrap = document.createElement('div');
  colorWrap.style.display = 'flex';
  colorWrap.style.gap = '4px';
  CI_COLORS.forEach((col) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rt-color';
    btn.style.background = col.value;
    btn.title = col.label;
    btn.addEventListener('click', () => document.execCommand('foreColor', false, col.value));
    colorWrap.appendChild(btn);
  });

  const linkBtn = toolbarButton('🔗', 'Link einfügen', () => {
    const rect = linkBtn.getBoundingClientRect();
    openLinkPopover(editable, rect);
  });

  toolbar.append(boldBtn, italicBtn, underlineBtn, fontSelect, sizeSelect, colorWrap, linkBtn);

  const editable = document.createElement('div');
  editable.className = 'rt-editable';
  editable.contentEditable = 'true';
  editable.innerHTML = content.html || '<p></p>';
  editable.addEventListener('input', () => {
    block.content = { html: editable.innerHTML };
    renderPreview();
  });

  container.append(toolbar, editable);

  return () => ({ html: editable.innerHTML });
}

function toolbarButton(label, title, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.title = title;
  btn.addEventListener('mousedown', (e) => e.preventDefault()); // Fokus im editierbaren Feld behalten
  btn.addEventListener('click', onClick);
  return btn;
}

function wrapSelectionWithStyle(styleAttr) {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement('span');
  span.setAttribute('style', styleAttr);
  span.appendChild(range.extractContents());
  range.insertNode(span);
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);
}

// ---------- Link-Popover ----------

const linkPopover = document.getElementById('linkPopover');
const linkTextInput = document.getElementById('linkTextInput');
const linkUrlInput = document.getElementById('linkUrlInput');

function openLinkPopover(editableEl, rect) {
  const sel = window.getSelection();
  linkSavedRange = null;

  if (sel.rangeCount > 0 && editableEl.contains(sel.anchorNode)) {
    linkSavedRange = sel.getRangeAt(0).cloneRange();
  }

  linkActiveEditable = editableEl;
  linkTextInput.value = linkSavedRange && !linkSavedRange.collapsed ? linkSavedRange.toString() : '';
  linkUrlInput.value = '';

  linkPopover.hidden = false;

  // Horizontal innerhalb des Viewports halten (Link-Button sitzt oft nah am rechten Rand)
  const popoverWidth = 280 + 32; // .link-popover width + padding
  let left = rect.left + window.scrollX;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - popoverWidth - 8;
  if (left > maxLeft) left = Math.max(8, maxLeft);

  linkPopover.style.top = `${rect.bottom + window.scrollY + 6}px`;
  linkPopover.style.left = `${left}px`;
  linkUrlInput.focus();
}

function closeLinkPopover() {
  linkPopover.hidden = true;
  linkSavedRange = null;
  linkActiveEditable = null;
}

document.getElementById('linkCancelBtn').addEventListener('click', closeLinkPopover);

document.getElementById('linkInsertBtn').addEventListener('click', () => {
  if (!linkActiveEditable) return closeLinkPopover();

  const url = linkUrlInput.value.trim();
  if (!url) { linkUrlInput.focus(); return; }
  const text = linkTextInput.value.trim() || url;

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;

  linkActiveEditable.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();

  if (linkSavedRange) {
    sel.addRange(linkSavedRange);
    linkSavedRange.deleteContents();
    linkSavedRange.insertNode(a);
    linkSavedRange.setStartAfter(a);
    linkSavedRange.setEndAfter(a);
    sel.removeAllRanges();
    sel.addRange(linkSavedRange);
  } else {
    linkActiveEditable.appendChild(a);
  }

  linkActiveEditable.dispatchEvent(new Event('input'));
  closeLinkPopover();
});

// ---------- Bild-Editor ----------

function buildImageEditor(content, container, block) {
  const preview = document.createElement('img');
  preview.className = 'block-image-preview';
  preview.style.display = content.src ? 'block' : 'none';
  if (content.src) preview.src = content.src;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp,image/gif';
  fileInput.className = 'form-input';

  const status = document.createElement('p');
  status.className = 'upload-status';
  status.textContent = content.src ? 'Bild vorhanden.' : 'Noch kein Bild hochgeladen.';

  let currentSrc = content.src || '';

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    status.textContent = 'Lade hoch und wandle in WebP um...';

    try {
      const formData = new FormData();
      formData.append('image', file);
      const data = await api('upload.php', { method: 'POST', body: formData, isForm: true });
      currentSrc = data.url;
      preview.src = data.url;
      preview.style.display = 'block';
      status.textContent = `Hochgeladen: ${data.url}`;
      block.content = { ...block.content, src: currentSrc };
      renderPreview();
    } catch (err) {
      status.textContent = 'Fehler: ' + err.message;
    }
  });

  const altInput = document.createElement('input');
  altInput.className = 'form-input';
  altInput.placeholder = 'Alt-Text (Beschreibung fürs Bild)';
  altInput.value = content.alt || '';
  altInput.addEventListener('input', renderPreviewLive);

  const alignSelect = document.createElement('select');
  alignSelect.className = 'form-select';
  [['left', 'Links'], ['center', 'Zentriert'], ['right', 'Rechts']].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if ((content.align || 'left') === val) opt.selected = true;
    alignSelect.appendChild(opt);
  });
  alignSelect.addEventListener('change', renderPreviewLive);

  const widthInput = document.createElement('input');
  widthInput.className = 'form-input';
  widthInput.placeholder = 'Breite (z.B. 100%, 400px)';
  widthInput.value = content.width || '100%';
  widthInput.addEventListener('input', renderPreviewLive);

  container.append(preview, fileInput, status, altInput, alignSelect, widthInput);

  function renderPreviewLive() {
    block.content = {
      src: currentSrc,
      alt: altInput.value,
      align: alignSelect.value,
      width: widthInput.value,
    };
    renderPreview();
  }

  return () => ({
    src: currentSrc,
    alt: altInput.value,
    align: alignSelect.value,
    width: widthInput.value,
  });
}

// ========== Neuen Block hinzufügen ==========

document.getElementById('addBlockBtn').addEventListener('click', async () => {
  if (!state.currentPage) return;
  const type = document.getElementById('newBlockType').value;
  const data = await api('blocks.php', {
    method: 'POST',
    body: { page_id: state.currentPage.id, type },
  });
  state.blocks.push({ id: data.id, type, content: {}, sort_order: state.blocks.length });
  renderBlockList();
  renderPreview();
});

// ========== Ankündigungen ("Schwarzes Brett") ==========

state.announcements = [];
state.showArchived = false;

async function loadAnnouncementsAdmin() {
  const data = await api(state.showArchived ? 'announcements.php?archived=1' : 'announcements.php?all=1');
  state.announcements = data.announcements;
  renderAnnouncementsAdmin();
  renderAnnouncementsPreview();
}

function renderAnnouncementsAdmin() {
  const list = document.getElementById('blockList');
  list.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex; gap:8px; margin-bottom:12px;';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn btn-secondary admin-btn-sm';
  toggleBtn.textContent = state.showArchived ? '← Zurück zu aktiven' : 'Archiv anzeigen';
  toggleBtn.addEventListener('click', async () => {
    state.showArchived = !state.showArchived;
    await loadAnnouncementsAdmin();
  });
  toolbar.appendChild(toggleBtn);

  if (!state.showArchived) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary admin-btn-sm';
    addBtn.textContent = '+ Neue Ankündigung';
    addBtn.addEventListener('click', async () => {
      if (state.announcements.length >= 20) {
        alert('Maximal 20 Ankündigungen gleichzeitig erlaubt. Bitte erst welche archivieren.');
        return;
      }
      const data = await api('announcements.php', { method: 'POST', body: { title: 'Neue Ankündigung' } });
      await loadAnnouncementsAdmin();
    });
    toolbar.appendChild(addBtn);
  }

  list.appendChild(toolbar);

  if (state.announcements.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'upload-status';
    empty.textContent = state.showArchived ? 'Archiv ist leer.' : 'Noch keine Ankündigungen.';
    list.appendChild(empty);
    return;
  }

  state.announcements.forEach((item) => {
    list.appendChild(state.showArchived ? buildArchivedCard(item) : buildAnnouncementCard(item));
  });
}

function buildArchivedCard(item) {
  const card = document.createElement('div');
  card.className = 'block-card';
  card.innerHTML = `
    <div class="block-card-header">
      <span class="block-card-type">${escapeHtml(item.title || '(ohne Titel)')}</span>
    </div>
  `;
  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'btn btn-secondary admin-btn-sm';
  restoreBtn.textContent = 'Wiederherstellen';
  restoreBtn.addEventListener('click', async () => {
    await api(`announcements.php?id=${item.id}&restore=1`, { method: 'PUT' });
    await loadAnnouncementsAdmin();
  });
  card.appendChild(restoreBtn);
  return card;
}

function buildAnnouncementCard(item) {
  const card = document.createElement('div');
  card.className = 'block-card';
  card.draggable = true;
  card.dataset.announcementId = item.id;

  const header = document.createElement('div');
  header.className = 'block-card-header';

  const activeLabel = document.createElement('label');
  activeLabel.style.cssText = 'display:flex; align-items:center; gap:6px; font-size:var(--text-xs); cursor:pointer;';
  const activeCheckbox = document.createElement('input');
  activeCheckbox.type = 'checkbox';
  activeCheckbox.checked = item.is_active;
  activeLabel.append(activeCheckbox, document.createTextNode('Aktiv'));

  const actions = document.createElement('span');
  actions.className = 'block-card-actions';

  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'icon-btn';
  archiveBtn.title = 'Archivieren';
  archiveBtn.textContent = '📦';
  archiveBtn.addEventListener('click', async () => {
    await api(`announcements.php?id=${item.id}`, { method: 'PUT', body: { is_archived: true } });
    await loadAnnouncementsAdmin();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn';
  deleteBtn.title = 'Endgültig löschen';
  deleteBtn.textContent = '🗑';
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('Diese Ankündigung wirklich endgültig löschen?')) return;
    await api(`announcements.php?id=${item.id}`, { method: 'DELETE' });
    await loadAnnouncementsAdmin();
  });

  actions.append(archiveBtn, deleteBtn);
  header.append(activeLabel, actions);
  card.appendChild(header);

  const titleInput = document.createElement('input');
  titleInput.className = 'form-input';
  titleInput.placeholder = 'Titel';
  titleInput.value = item.title || '';

  const bodyTextarea = document.createElement('textarea');
  bodyTextarea.className = 'form-textarea';
  bodyTextarea.placeholder = 'Text';
  bodyTextarea.value = item.body || '';
  bodyTextarea.rows = 3;

  const mediaTypeSelect = document.createElement('select');
  mediaTypeSelect.className = 'form-select';
  [['none', 'Kein Medium'], ['image', 'Bild'], ['video', 'Video (externer Link)']].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if ((item.media_type || 'none') === val) opt.selected = true;
    mediaTypeSelect.appendChild(opt);
  });

  const mediaUrlInput = document.createElement('input');
  mediaUrlInput.className = 'form-input';
  mediaUrlInput.placeholder = 'Video-URL (z.B. YouTube-Embed-Link)';
  mediaUrlInput.value = item.media_type === 'video' ? (item.media_url || '') : '';
  mediaUrlInput.style.display = item.media_type === 'video' ? 'block' : 'none';

  const imageUpload = document.createElement('input');
  imageUpload.type = 'file';
  imageUpload.accept = 'image/jpeg,image/png,image/webp,image/gif';
  imageUpload.className = 'form-input';
  imageUpload.style.display = item.media_type === 'image' ? 'block' : 'none';

  let currentMediaUrl = item.media_type === 'image' ? (item.media_url || '') : '';

  const imagePreview = document.createElement('img');
  imagePreview.className = 'block-image-preview';
  imagePreview.style.display = currentMediaUrl ? 'block' : 'none';
  if (currentMediaUrl) imagePreview.src = currentMediaUrl;

  mediaTypeSelect.addEventListener('change', () => {
    mediaUrlInput.style.display = mediaTypeSelect.value === 'video' ? 'block' : 'none';
    imageUpload.style.display = mediaTypeSelect.value === 'image' ? 'block' : 'none';
    imagePreview.style.display = mediaTypeSelect.value === 'image' && currentMediaUrl ? 'block' : 'none';
  });

  imageUpload.addEventListener('change', async () => {
    const file = imageUpload.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const data = await api('upload.php', { method: 'POST', body: formData, isForm: true });
      currentMediaUrl = data.url;
      imagePreview.src = data.url;
      imagePreview.style.display = 'block';
    } catch (err) {
      alert('Upload fehlgeschlagen: ' + err.message);
    }
  });

  const dateRow = document.createElement('div');
  dateRow.style.cssText = 'display:flex; gap:8px;';

  const startInput = document.createElement('input');
  startInput.type = 'datetime-local';
  startInput.className = 'form-input';
  startInput.value = toDatetimeLocal(item.start_at);
  startInput.title = 'Start (leer = sofort)';

  const endInput = document.createElement('input');
  endInput.type = 'datetime-local';
  endInput.className = 'form-input';
  endInput.value = toDatetimeLocal(item.end_at);
  endInput.title = 'Ende (leer = unbegrenzt)';

  dateRow.append(startInput, endInput);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary admin-btn-sm block-save-btn';
  saveBtn.textContent = 'Speichern';
  saveBtn.addEventListener('click', async () => {
    saveBtn.textContent = 'Speichere...';
    try {
      await api(`announcements.php?id=${item.id}`, {
        method: 'PUT',
        body: {
          title: titleInput.value,
          body: bodyTextarea.value,
          media_type: mediaTypeSelect.value,
          media_url: mediaTypeSelect.value === 'video' ? mediaUrlInput.value : (mediaTypeSelect.value === 'image' ? currentMediaUrl : ''),
          is_active: activeCheckbox.checked,
          start_at: fromDatetimeLocal(startInput.value),
          end_at: fromDatetimeLocal(endInput.value),
        },
      });
      Object.assign(item, {
        title: titleInput.value,
        body: bodyTextarea.value,
        media_type: mediaTypeSelect.value,
        media_url: mediaTypeSelect.value === 'video' ? mediaUrlInput.value : currentMediaUrl,
        is_active: activeCheckbox.checked,
        start_at: fromDatetimeLocal(startInput.value),
        end_at: fromDatetimeLocal(endInput.value),
      });
      renderAnnouncementsPreview();
      saveBtn.textContent = 'Gespeichert ✓';
      setTimeout(() => { saveBtn.textContent = 'Speichern'; }, 1500);
    } catch (err) {
      alert('Fehler: ' + err.message);
      saveBtn.textContent = 'Speichern';
    }
  });

  card.append(titleInput, bodyTextarea, mediaTypeSelect, mediaUrlInput, imageUpload, imagePreview, dateRow, saveBtn);

  card.addEventListener('dragstart', () => card.classList.add('dragging'));
  card.addEventListener('dragend', async () => {
    card.classList.remove('dragging');
    const ids = [...document.querySelectorAll('#blockList .block-card[data-announcement-id]')]
      .map((c) => Number(c.dataset.announcementId));
    state.announcements.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    renderAnnouncementsPreview();
    await api('announcements.php?reorder=1', { method: 'PUT', body: { order: ids } });
  });

  return card;
}

function toDatetimeLocal(sqlDatetime) {
  if (!sqlDatetime) return '';
  return sqlDatetime.replace(' ', 'T').slice(0, 16);
}

function fromDatetimeLocal(value) {
  if (!value) return null;
  return value.replace('T', ' ') + ':00';
}

function isAnnouncementCurrentlyActive(item) {
  if (!item.is_active) return false;
  const now = new Date();
  if (item.start_at && new Date(item.start_at) > now) return false;
  if (item.end_at && new Date(item.end_at) < now) return false;
  return true;
}

function renderAnnouncementsPreview() {
  const el = document.getElementById('previewContent');
  const activeItems = state.announcements.filter(isAnnouncementCurrentlyActive);

  if (activeItems.length === 0) {
    el.innerHTML = '<div class="announcements-empty"><h2>Coming Soon</h2><p>Hier erscheinen in Kürze aktuelle Ankündigungen.</p></div>';
    return;
  }

  el.innerHTML = activeItems.map((item) => `
    <article class="glass-card announcement-card">
      ${item.media_type === 'image' && item.media_url ? `<img class="announcement-media" src="${escapeAttr(item.media_url)}" alt="">` : ''}
      <div class="announcement-card-body">
        ${item.title ? `<h2 class="announcement-title">${escapeHtml(item.title)}</h2>` : ''}
        ${item.body ? `<p class="announcement-text">${escapeHtml(item.body)}</p>` : ''}
      </div>
    </article>
  `).join('');
}

// ========== Team-Verwaltung (nur Owner) ==========

const ROLE_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Beobachter' };

async function loadTeamAdmin() {
  document.getElementById('previewContent').innerHTML = `
    <div class="preview-empty">
      <p>Team-Verwaltung – Zugänge anlegen, Rollen vergeben, Passwörter zurücksetzen.</p>
      <p style="margin-top:8px;">Nur für dich als Owner sichtbar.</p>
    </div>
  `;

  const data = await api('users.php');
  renderTeamList(data.users);
}

function renderTeamList(users) {
  const list = document.getElementById('blockList');
  list.innerHTML = '';

  const addSection = document.createElement('div');
  addSection.className = 'block-card';
  addSection.innerHTML = '<div class="block-card-header"><span class="block-card-type">Neuen Zugang einladen</span></div>';

  const emailInput = document.createElement('input');
  emailInput.className = 'form-input';
  emailInput.type = 'email';
  emailInput.placeholder = 'E-Mail-Adresse';

  const roleSelect = document.createElement('select');
  roleSelect.className = 'form-select';
  [['editor', 'Editor (z.B. Stefan)'], ['viewer', 'Beobachter (nur lesen)'], ['owner', 'Owner (voller Zugriff)']]
    .forEach(([val, label]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      roleSelect.appendChild(opt);
    });

  const inviteBtn = document.createElement('button');
  inviteBtn.className = 'btn btn-primary admin-btn-sm block-save-btn';
  inviteBtn.textContent = 'Einladen';

  const resultBox = document.createElement('p');
  resultBox.className = 'upload-status';

  inviteBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) { emailInput.focus(); return; }

    inviteBtn.textContent = 'Sende Einladung...';
    try {
      const data = await api('users.php', { method: 'POST', body: { email, role: roleSelect.value } });
      resultBox.innerHTML = data.mail_sent
        ? `✓ Einladung per E-Mail an ${escapeHtml(email)} gesendet.`
        : `⚠ E-Mail konnte nicht versendet werden (Resend evtl. noch nicht konfiguriert). Link manuell teilen:<br><code style="word-break:break-all;">${escapeHtml(data.invite_link)}</code>`;
      emailInput.value = '';
      // Nur die Karten-Liste neu laden, nicht das ganze Panel - sonst wuerde die
      // obige Erfolgsmeldung/der Link sofort wieder verschwinden.
      const fresh = await api('users.php');
      state.teamCardsContainer.innerHTML = '';
      fresh.users.forEach((u) => state.teamCardsContainer.appendChild(buildUserCard(u)));
    } catch (err) {
      resultBox.textContent = 'Fehler: ' + err.message;
    } finally {
      inviteBtn.textContent = 'Einladen';
    }
  });

  addSection.append(emailInput, roleSelect, inviteBtn, resultBox);
  list.appendChild(addSection);

  const cardsContainer = document.createElement('div');
  users.forEach((u) => cardsContainer.appendChild(buildUserCard(u)));
  list.appendChild(cardsContainer);
  state.teamCardsContainer = cardsContainer;
}

function buildUserCard(u) {
  const card = document.createElement('div');
  card.className = 'block-card';

  const statusLabel = u.status === 'active' ? 'Aktiv' : u.status === 'pending' ? 'Einladung offen' : 'Deaktiviert';

  const header = document.createElement('div');
  header.className = 'block-card-header';
  header.innerHTML = `
    <span class="block-card-type">${escapeHtml(u.email)}</span>
    <span class="block-card-type">${ROLE_LABELS[u.role] || u.role} · ${statusLabel}</span>
  `;
  card.appendChild(header);

  const resultBox = document.createElement('p');
  resultBox.className = 'upload-status';

  const actionsRow = document.createElement('div');
  actionsRow.style.cssText = 'display:flex; gap:8px; margin-top:8px;';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary admin-btn-sm';
  resetBtn.textContent = 'Passwort zurücksetzen';
  resetBtn.addEventListener('click', async () => {
    resetBtn.textContent = 'Sende...';
    try {
      const data = await api(`users.php?id=${u.id}&action=reset`, { method: 'PUT' });
      resultBox.innerHTML = data.mail_sent
        ? '✓ Reset-Link per E-Mail gesendet.'
        : `⚠ E-Mail nicht versendet. Link manuell teilen:<br><code style="word-break:break-all;">${escapeHtml(data.reset_link)}</code>`;
    } catch (err) {
      resultBox.textContent = 'Fehler: ' + err.message;
    } finally {
      resetBtn.textContent = 'Passwort zurücksetzen';
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-secondary admin-btn-sm';
  deleteBtn.textContent = 'Entfernen';
  deleteBtn.addEventListener('click', async () => {
    if (u.id === state.user.id) {
      alert('Der eigene Zugang kann nicht selbst entfernt werden.');
      return;
    }
    if (!confirm(`Zugang von ${u.email} wirklich endgültig entfernen? Das kann nicht rückgängig gemacht werden.`)) return;
    await api(`users.php?id=${u.id}`, { method: 'DELETE' });
    await loadTeamAdmin();
  });

  actionsRow.append(resetBtn, deleteBtn);
  card.append(actionsRow, resultBox);

  return card;
}

// ========== Start ==========

checkAuth().catch((err) => {
  console.error(err);
  showLogin();
});
