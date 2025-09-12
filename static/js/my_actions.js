// static/js/my_actions.js
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const draftsBox = $('#drafts-list');
  const publishedBox = $('#published-list');
  const form = $('#create-action-form');
  const input = $('#new-action-text');

  const notify = (msg, type = 'success') => {
    if (window.showNotification) return window.showNotification(msg, type);
    console[type === 'error' ? 'error' : 'log'](msg);
  };

  async function post(url, body) {
    const opts = {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    };
    const res = await fetch(url, opts);
    if (!res.ok) {
      notify(`Ошибка: ${res.status} ${res.statusText}`, 'error');
      throw new Error('Request failed');
    }
    try { return await res.json(); } catch { return {}; }
  }

  async function refresh() {
    const res = await fetch('/api/my-actions', { credentials: 'include' });
    const data = await res.json();
    renderDrafts(data.drafts || []);
    renderPublished(data.published || []);
    updateCountdowns(); // после рендера — посчитать таймеры и состояние кнопок
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]
    ));
  }

  function renderDrafts(list) {
    if (!draftsBox) return;
    draftsBox.innerHTML = '';
    if (!list.length) {
      draftsBox.innerHTML = '<p id="no-drafts">Нет черновиков</p>';
      return;
    }
    for (const d of list) {
      const el = document.createElement('div');
      el.className = 'action-item';
      el.dataset.id = d.id;
      el.innerHTML = `
        <a href="/api/actions/action_card/${d.id}">${escapeHtml(d.text)}</a>
        <button type="button" class="delete-btn">Удалить</button>
        <select class="duration">
          <option value="10">10 мин</option>
          <option value="30">30 мин</option>
          <option value="60">1 час</option>
        </select>
        <button type="button" class="publish-btn">Опубликовать</button>
      `;
      draftsBox.appendChild(el);
    }
  }

  function renderPublished(list) {
    if (!publishedBox) return;
    publishedBox.innerHTML = '';
    if (!list.length) {
      publishedBox.innerHTML = '<p id="no-published">Нет опубликованных действий</p>';
      return;
    }
    for (const a of list) {
      const el = document.createElement('div');
      el.className = 'action-item';
      el.dataset.id = a.id;
      const expires = a.expiresAt || '';

      el.innerHTML = `
        <a href="/api/actions/action_card/${a.id}">${escapeHtml(a.text)}</a>
        <small>
          Действует до: <span class="expires-iso">${expires || '—'}</span>
          ${expires ? `(осталось: <span class="expires-left" data-expires="${expires}"></span>)` : ''}
        </small>

        <select class="republish-duration">
          <option value="10">+10 мин</option>
          <option value="30">+30 мин</option>
          <option value="60">+1 час</option>
        </select>
        <button type="button" class="republish-btn" disabled>Опубликовать снова</button>

        <button type="button" class="delete-btn">Удалить</button>
      `;
      publishedBox.appendChild(el);
    }
  }

  // формат оставшегося времени
  function fmtLeft(ms) {
    if (ms <= 0) return 'истекло';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${ss}`;
    return `${m}:${ss}`;
  }

  function updateCountdowns() {
    const now = Date.now();
    document.querySelectorAll('.expires-left[data-expires]').forEach(span => {
      const iso = span.getAttribute('data-expires');
      if (!iso) { span.textContent = ''; return; }
      const left = Date.parse(iso) - now;
      span.textContent = fmtLeft(left);

      // включаем/выключаем кнопку «Опубликовать снова»
      const item = span.closest('.action-item');
      const btn = item?.querySelector('.republish-btn');
      if (btn) btn.disabled = left > 0;
    });
  }

  // тикаем каждую секунду
  let timerStarted = false;
  function ensureTimer() {
    if (timerStarted) return;
    timerStarted = true;
    setInterval(updateCountdowns, 1000);
  }

  // создание (submit ловит и Enter)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    try {
      const data = await post('/api/my-actions/new', { text });
      if (data?.message) notify(data.message, data.ok ? 'success' : 'error');
      else notify('Действие создано');
      input.value = '';
      await refresh();
    } catch {}
  });

  // делегирование кликов в блоке черновиков
  draftsBox?.addEventListener('click', async (e) => {
    const item = e.target.closest('.action-item');
    if (!item) return;
    const id = Number(item.dataset.id);

    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('Удалить действие?')) return;
      try {
        await post(`/api/my-actions/delete/${id}`);
        await refresh();
      } catch {}
    }

    if (e.target.classList.contains('publish-btn')) {
      const sel = item.querySelector('.duration');
      const duration = Number(sel?.value || 10);
      try {
        await post('/api/my-actions/publish', { id, duration });
        notify('Опубликовано');
        try { localStorage.setItem('MYA_PING', String(Date.now())); } catch {}
        await refresh();
      } catch {}
    }
  });

  // делегирование кликов в опубликованных
  publishedBox?.addEventListener('click', async (e) => {
    const item = e.target.closest('.action-item');
    if (!item) return;
    const id = Number(item.dataset.id);

    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('Удалить действие?')) return;
      try {
        await post(`/api/my-actions/delete/${id}`);
        await refresh();
      } catch {}
    }

    if (e.target.classList.contains('republish-btn')) {
      // защита: если ещё активно — предупреждаем и не шлём запрос
      const leftSpan = item.querySelector('.expires-left[data-expires]');
      let left = 0;
      if (leftSpan) left = Date.parse(leftSpan.getAttribute('data-expires')) - Date.now();
      if (left > 0) {
        notify(`Действие ещё активно. Подождите ${fmtLeft(left)} и попробуйте снова.`, 'info');
        return;
      }

      const sel = item.querySelector('.republish-duration');
      const duration = Number(sel?.value || 10);
      e.target.disabled = true;
      try {
        // Используем тот же эндпоинт, что и публикация — чтобы «Наш мир» получил новое активное действие
        await post('/api/my-actions/publish', { id, duration });
        notify('Опубликовано снова');
        try { localStorage.setItem('MYA_PING', String(Date.now())); } catch {}
        await refresh();
      } catch {
        notify('Не удалось переопубликовать', 'error');
      } finally {
        e.target.disabled = false;
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // realtime
    if (window.socket) {
      window.socket.off('my-actions:changed');
      window.socket.on('my-actions:changed', refresh);
    }
    // cross-tab ping (world.js дергает MYA_PING)
    window.addEventListener('storage', (e) => {
      if (e.key === 'MYA_PING') refresh();
    });
    ensureTimer();
    refresh();
  });
})();
