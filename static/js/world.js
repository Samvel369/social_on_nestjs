// ---------- static/js/world.js ----------
const withCreds = (init = {}) => ({ credentials: 'include', ...init });

// ---------- уведомления ----------
function notify(msg, type = 'info') {
  let c = document.getElementById('notification-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'notification-container';
    c.className = 'notification-container';
    document.body.appendChild(c);
  }
  const box = document.createElement('div');
  box.className = `notification ${type}`;
  box.textContent = Array.isArray(msg) ? msg.join('\n') : String(msg || 'Ошибка');
  c.appendChild(box);
  setTimeout(() => box.remove(), 3500);
}

// небольшой «пинг», чтобы вкладка «Мои действия» могла обновиться
function pingMyActions() {
  try { localStorage.setItem('MYA_PING', String(Date.now())); } catch {}
}

// ---------- опубликованные: отметки/счётчики ----------
function markAction(actionId) {
  fetch(`/api/actions/mark_action/${actionId}`, withCreds({ method: 'POST' }))
    .then((r) => r.json())
    .then((data) => {
      if (data?.success) updateCounters();
      else if (data?.message) notify(data.message, 'error');
    })
    .catch(() => notify('Ошибка сети', 'error'));
}
window.markAction = markAction;

function updateCounters() {
  fetch('/api/actions/get_mark_counts', withCreds())
    .then((r) => r.json())
    .then((map) => {
      if (!map || typeof map !== 'object') return;
      Object.entries(map).forEach(([id, cnt]) => {
        const el = document.getElementById(`counter-${id}`);
        if (el) el.textContent = cnt;
      });
    })
    .catch(() => {});
}

function refreshPublished() {
  fetch('/api/actions/get_published_actions', withCreds())
    .then((r) => r.json())
    .then((list) => {
      const ul = document.getElementById('published-actions');
      if (!ul || !Array.isArray(list)) return;

      const currentLis = Array.from(ul.children);
      const existingIds = new Set(currentLis.map((li) => String(li.dataset.id)));
      const incomingIds = new Set(list.map((a) => String(a.id)));

      // удалить исчезнувшие
      currentLis.forEach((li) => {
        if (!incomingIds.has(String(li.dataset.id))) li.remove();
      });

      // добавить новые
      list.forEach((a) => {
        const id = String(a.id);
        if (existingIds.has(id)) return;
        const li = document.createElement('li');
        li.dataset.id = id;
        li.innerHTML = `
          <a href="/api/actions/action_card/${id}" target="_blank">${a.text}</a> —
          <span id="counter-${id}">0</span> чел.
          <button type="button" onclick="markAction(${id})">Отметиться</button>
          <div id="message-${id}" class="msg"></div>
        `;
        ul.prepend(li);
      });
    })
    .catch(() => {});
}

// ---------- 3-я колонка (созданные/черновики) ----------
function normalizeCreated(data) {
  if (!data) return null;
  let obj = data;
  const tryKeys = ['draft', 'action', 'created', 'item', 'data', 'result'];
  for (const k of tryKeys) {
    if (obj && obj.id) break;
    if (obj && typeof obj === 'object' && obj[k]) obj = obj[k];
  }
  if (obj && obj.id) {
    const text = obj.text ?? obj.title ?? obj.name ?? '';
    if (String(text).trim()) return { id: obj.id, text: String(text) };
  }
  return null;
}

function ensureDraftsContainer() {
  const form = document.getElementById('world-create-form');
  if (!form) return null;

  let col = form.closest('.column') || form.parentElement;
  if (!col) col = form;

  let boxTitle = col.querySelector('#created-actions-title');
  let box = col.querySelector('#created-actions');

  if (!boxTitle) {
    boxTitle = document.createElement('h4');
    boxTitle.id = 'created-actions-title';
    boxTitle.textContent = 'Созданные действия';
    form.insertAdjacentElement('afterend', boxTitle);
  }
  if (!box) {
    box = document.createElement('div');
    box.id = 'created-actions';
    box.className = 'created-actions';
    boxTitle.insertAdjacentElement('afterend', box);
  }
  return box;
}

function draftCardHTML(a) {
  const id = a.id;
  const text = a.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <div class="draft-action" data-id="${id}" style="margin-top:10px; padding:10px; background:#fff9c4; border:1px dashed #aaa; border-radius:6px;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <p style="margin:0;">
          <a href="/api/actions/action_card/${id}" target="_blank">${text}</a>
        </p>
        <form class="world-delete" method="post" action="/api/my-actions/delete/${id}">
          <button type="submit" title="Удалить">✘</button>
        </form>
      </div>

      <form class="world-publish" method="post" action="/api/my-actions/publish" style="margin-top:8px;">
        <input type="hidden" name="id" value="${id}">
        <select name="duration" id="duration-${id}">
          <option value="10">10 мин</option>
          <option value="30">30 мин</option>
          <option value="60">1 час</option>
        </select>
        <button type="button" class="publish-btn" data-id="${id}">Опубликовать</button>
      </form>
    </div>
  `;
}

function appendDraftCard(a) {
  const box = ensureDraftsContainer();
  if (!box) return;
  if (box.querySelector(`[data-id="${a.id}"]`)) return; // дедуп
  const wrap = document.createElement('div');
  wrap.innerHTML = draftCardHTML(a);
  box.prepend(wrap.firstElementChild);
}

// ---------- общие обработчики ----------
async function createFromForm(form) {
  const input = form.querySelector('input[name="text"]');
  const text = (input?.value || '').toString().trim();
  if (!text) return notify('Введите текст действия', 'error');

  try {
    const res = await fetch(form.action, withCreds({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }));
    const raw = await res.json().catch(() => ({}));
    if (!res.ok || raw?.ok === false) {
      return notify(raw?.message || 'Ошибка при создании', 'error');
    }
    notify('Действие создано', 'success');
    input.value = '';

    const created = normalizeCreated(raw) || { id: raw.id, text: raw.text };
    if (created?.id && created?.text) appendDraftCard(created);

    pingMyActions();
  } catch {
    notify('Ошибка сети', 'error');
  }
}

async function publishFromForm(form) {
  const id = Number(form.querySelector('input[name="id"]').value);
  const duration = Number(form.querySelector('select[name="duration"]').value || 0);

  try {
    const res = await fetch(form.action, withCreds({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, duration }),
    }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return notify(data?.message || 'Ошибка публикации', 'error');
    }

    notify('Опубликовано', 'success');

    // убрать карточку драфта
    const card = form.closest('.draft-action');
    if (card) card.remove();

    refreshPublished();
    updateCounters();
    pingMyActions();
  } catch {
    notify('Ошибка сети', 'error');
  }
}

async function deleteFromForm(form) {
  try {
    const res = await fetch(form.action, withCreds({ method: 'POST' }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return notify(data?.message || 'Не удалось удалить', 'error');
    }
    // удалить карточку с экрана
    const card = form.closest('.draft-action');
    if (card) card.remove();

    notify('Черновик удалён', 'success');
    pingMyActions();
  } catch {
    notify('Ошибка сети', 'error');
  }
}

// сабмиты (Enter)
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.matches('#world-create-form')) {
    e.preventDefault();
    createFromForm(f);
  } else if (f.matches('form.world-publish')) {
    e.preventDefault();
    publishFromForm(f);
  } else if (f.matches('form.world-delete')) {
    e.preventDefault();
    deleteFromForm(f);     // <-- перехватываем удаление
  }
});

// клики по кнопкам
document.addEventListener('click', (e) => {
  if (e.target.id === 'world-create-btn') {
    const form = document.getElementById('world-create-form');
    if (form) createFromForm(form);
    return;
  }
  const publishBtn = e.target.closest('.publish-btn');
  if (publishBtn) {
    const form = publishBtn.closest('form.world-publish');
    if (form) publishFromForm(form);
  }
});

// ---------- автообновление опубликованных ----------
refreshPublished();
updateCounters();
setInterval(refreshPublished, 1000);
setInterval(updateCounters, 1000);
// ---------- /static/js/world.js ----------
