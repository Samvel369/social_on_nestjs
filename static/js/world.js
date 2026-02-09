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

// ---------- ежедневные действия (каждая отметка живёт 1 мин с момента постановки) ----------
function updateDailyCounters(counts) {
  if (!counts || typeof counts !== 'object') return;
  Object.entries(counts).forEach(([id, cnt]) => {
    const el = document.getElementById(`daily-counter-${id}`);
    if (el) el.textContent = cnt;
  });
}
window.updateDailyCounters = updateDailyCounters;

function refreshDailyActions() {
  fetch('/api/world/daily-actions', withCreds())
    .then((r) => r.json())
    .then((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((a) => {
        const el = document.getElementById(`daily-counter-${a.id}`);
        if (el) el.textContent = a.count;
      });
    })
    .catch(() => {});
}
window.refreshDailyActions = refreshDailyActions;

function showCooldownModal(msg, remainingSeconds) {
  let secondsLeft = Math.max(0, Math.ceil(remainingSeconds));
  let timerId = null;

  const overlay = document.createElement('div');
  overlay.id = 'daily-mark-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText = 'background:var(--bg-card,#fff);padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);text-align:center;min-width:260px;';
  box.innerHTML = `
    <p style="margin:0 0 12px;font-weight:600;font-size:18px;color:var(--accent-moment,#e74c3c);">Подождите</p>
    <p style="margin:0 0 8px;font-size:14px;color:var(--text-secondary,#666);">${msg}</p>
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:var(--accent-pulse,#f39c12);"><span id="daily-mark-remaining">0:00</span></p>
    <button type="button" id="daily-mark-modal-ok" style="padding:10px 24px;font-size:14px;cursor:pointer;background:var(--accent-primary,#8b6f47);color:#fff;border:none;border-radius:8px;">Ок</button>
  `;

  const remainingEl = box.querySelector('#daily-mark-remaining');
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function tick() {
    remainingEl.textContent = formatTime(secondsLeft);
    if (secondsLeft <= 0) {
      clearInterval(timerId);
      return;
    }
    secondsLeft--;
  }

  tick();
  if (secondsLeft > 0) timerId = setInterval(tick, 1000);

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function close() {
    if (timerId) clearInterval(timerId);
    overlay.remove();
  }

  box.querySelector('#daily-mark-modal-ok').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function markDailyAction(dailyActionId) {
  fetch(`/api/world/daily-mark/${dailyActionId}`, withCreds({ method: 'POST' }))
    .then((r) => r.json())
    .then((data) => {
      if (data?.success) {
        if (data.counts) updateDailyCounters(data.counts);
        const list = document.getElementById('daily-actions-list');
        const item = list?.querySelector(`[data-daily-id="${dailyActionId}"]`);
        if (list && item) {
          item.remove();
          list.insertBefore(item, list.firstChild);
        }
        refreshDailyActions();
      } else if (data?.error) {
        if (typeof data.remaining === 'number' && data.remaining > 0) {
          showCooldownModal('Подождите 10 минут перед следующей отметкой на это действие', data.remaining);
        } else {
          notify(data.error, 'error');
        }
      }
    })
    .catch(() => notify('Ошибка сети', 'error'));
}
window.markDailyAction = markDailyAction;

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
  const dailyMarkBtn = e.target.closest('.daily-mark-btn');
  if (dailyMarkBtn) {
    const id = dailyMarkBtn.getAttribute('data-daily-id');
    if (id) markDailyAction(Number(id));
    return;
  }
  const publishedMarkBtn = e.target.closest('.published-mark-btn');
  if (publishedMarkBtn) {
    const id = publishedMarkBtn.getAttribute('data-action-id');
    if (id) markAction(Number(id));
  }
});

// ---------- поиск ежедневных действий ----------
document.addEventListener('input', (e) => {
  const search = document.getElementById('daily-actions-search');
  if (e.target !== search) return;
  const q = (search?.value || '').trim().toLowerCase();
  const list = document.getElementById('daily-actions-list');
  if (!list) return;
  list.querySelectorAll('.daily-action-row').forEach((li) => {
    const textEl = li.querySelector('span');
    const text = (textEl?.textContent || '').toLowerCase();
    li.style.display = q === '' || text.includes(q) ? '' : 'none';
  });
});

// ---------- автообновление ----------
refreshPublished();
updateCounters();
refreshDailyActions();
setInterval(refreshPublished, 1000);
setInterval(updateCounters, 1000);
setInterval(refreshDailyActions, 5000); // Каждая отметка живёт 1 мин — опрос каждые 5 сек для обновления
// ---------- /static/js/world.js ----------
