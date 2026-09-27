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
  await loadPages();
}

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

// ========== Start ==========

checkAuth().catch((err) => {
  console.error(err);
  showLogin();
});
