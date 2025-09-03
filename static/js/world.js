// ---------- static/js/world.js ----------
const withCreds = (init = {}) => ({ credentials: 'include', ...init });

// Отметиться в действии
function markAction(actionId) {
  fetch(`/api/actions/mark_action/${actionId}`, withCreds({ method: 'POST' }))
    .then((r) => r.json())
    .then((data) => {
      if (data?.success) {
        updateCounters();
      } else if (data?.error === 'wait') {
        showCooldown(actionId, data.remaining);
      } else if (data?.message) {
        notify(data.message, 'error');
      }
    })
    .catch(() => notify('Ошибка сети', 'error'));
}

function showCooldown(actionId, seconds) {
  const span = document.getElementById(`cooldown-${actionId}`);
  if (!span) return;
  span.style.display = 'inline';
  let remain = Number(seconds) || 0;
  const t = setInterval(() => {
    const mm = Math.floor(remain / 60);
    const ss = String(remain % 60).padStart(2, '0');
    span.textContent = `Подождите ${mm}:${ss}`;
    if (--remain <= 0) {
      clearInterval(t);
      span.textContent = '';
      span.style.display = 'none';
    }
  }, 1000);
}

// Счётчики отметок
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

// Опубликованные (живые)
function refreshPublished() {
  fetch('/api/actions/get_published_actions', withCreds())
    .then((r) => r.json())
    .then((list) => {
      const ul = document.getElementById('published-actions');
      if (!ul || !Array.isArray(list)) return;

      const currentLis = Array.from(ul.children);
      const existingIds = new Set(currentLis.map((li) => String(li.getAttribute('data-id'))));
      const incomingIds = new Set(list.map((a) => String(a.id)));

      currentLis.forEach((li) => {
        const id = String(li.getAttribute('data-id'));
        if (!incomingIds.has(id)) li.remove();
      });

      list.forEach((a) => {
        const id = String(a.id);
        if (existingIds.has(id)) return;
        const li = document.createElement('li');
        li.setAttribute('data-id', id);
        li.innerHTML = `
          <a href="/api/actions/action_card/${id}" target="_blank">${a.text}</a> —
          <span id="counter-${id}">0</span> чел.
          <button type="button" onclick="markAction(${id})">Отметиться</button>
          <div id="message-${id}" class="msg"></div>
          <span id="cooldown-${id}" style="display:none;"></span>
        `;
        ul.prepend(li);
      });
    })
    .catch(() => {});
}

// Уведомления (простой helper)
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
  setTimeout(() => box.remove(), 4000);
}

// Перехватываем формы на странице, чтобы не уходить на белый JSON
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.matches('#world-create-form') || f.matches('form.world-publish')) {
    e.preventDefault();
  }
});

// Создание черновика (JSON!)
document.addEventListener('click', async (e) => {
  if (e.target.id === 'world-create-btn') {
    const form = document.getElementById('world-create-form');
    const input = form.querySelector('input[name="text"]');
    const text = (input?.value || '').toString().trim();
    if (!text) return notify('Введите текст действия', 'error');

    try {
      const res = await fetch(form.action, withCreds({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        return notify(data?.message || 'Ошибка при создании', 'error');
      }
      notify('Действие создано', 'success');
      input.value = '';
      document.dispatchEvent(new CustomEvent('world:refresh-drafts'));
    } catch {
      notify('Ошибка сети', 'error');
    }
  }
});

// Публикация драфта (JSON!)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.publish-btn');
  if (!btn) return;
  const form = btn.closest('form.world-publish');
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
    document.dispatchEvent(new CustomEvent('world:refresh-published'));
    document.dispatchEvent(new CustomEvent('world:refresh-drafts'));
  } catch {
    notify('Ошибка сети', 'error');
  }
});

// Запасные события
document.addEventListener('world:refresh-drafts', () => location.reload());
document.addEventListener('world:refresh-published', () => {
  refreshPublished();
  updateCounters();
});

// Первичная подкачка и интервалы
refreshPublished();
updateCounters();
setInterval(refreshPublished, 1000);
setInterval(updateCounters, 1000);
// ---------- /static/js/world.js ----------
