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

    // Пытаемся прочитать JSON-ответ (там может быть текст ошибки)
    let data = {};
    try { data = await res.json(); } catch { }

    if (!res.ok) {
      // ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ:
      // Если сервер прислал сообщение (message), показываем его.
      // Если нет — показываем стандартный статус (Bad Request).
      const errorMsg = data.message || `${res.status} ${res.statusText}`;

      notify(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    return data;
  }

  async function refresh() {
    const res = await fetch('/api/events', { credentials: 'include' });
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
      draftsBox.innerHTML = '<p id="no-drafts" style="text-align: center; color: var(--text-muted); padding: 40px;">Нет черновиков</p>';
      return;
    }
    for (const d of list) {
      const el = document.createElement('div');
      el.className = 'action-item draft-action';
      el.dataset.id = d.id;
      el.style.cssText = 'background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 2px solid var(--border-color); margin-bottom: 10px; box-shadow: var(--shadow-sm);';
      el.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: center;">
          <a href="/api/actions/action_card/${d.id}" style="flex: 1; font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(d.text)}</a>
          
          <select class="duration" style="width: 95px; font-size: 12px; padding: 6px;">
            <option value="10">10 мин</option>
            <option value="30">30 мин</option>
            <option value="60">1 час</option>
          </select>
          
          <button type="button" class="publish-btn btn-success" style="font-size: 11px; padding: 6px 12px; white-space: nowrap;">
            <i class="fa-solid fa-rocket"></i> Опубликовать
          </button>
          
          <button type="button" class="delete-btn btn-danger" style="padding: 6px 10px; font-size: 11px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
      draftsBox.appendChild(el);
    }
  }

  function renderPublished(list) {
    if (!publishedBox) return;
    publishedBox.innerHTML = '';
    if (!list.length) {
      publishedBox.innerHTML = '<p id="no-published" style="text-align: center; color: var(--text-muted); padding: 40px;">Нет опубликованных действий</p>';
      return;
    }
    for (const a of list) {
      const el = document.createElement('div');
      el.className = 'action-item';
      el.dataset.id = a.id;
      el.style.cssText = 'background: var(--bg-card); padding: 12px; border-radius: var(--radius-md); border: 2px solid var(--border-color); margin-bottom: 10px; box-shadow: var(--shadow-sm);';
      const expires = a.expiresAt || '';

      el.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
          <a href="/api/actions/action_card/${a.id}" style="flex: 1; font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(a.text)}</a>
          
          <select class="republish-duration" style="width: 95px; font-size: 12px; padding: 6px;">
            <option value="10">+10м</option>
            <option value="30">+30м</option>
            <option value="60">+1ч</option>
          </select>
          
          <button type="button" class="republish-btn btn-success" style="font-size: 11px; padding: 6px 12px; white-space: nowrap;">
            <i class="fa-solid fa-plus"></i>
          </button>
          
          <button type="button" class="delete-btn btn-danger" style="padding: 6px 10px; font-size: 11px;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        
        <small style="color: var(--text-secondary); display: block; font-size: 10px; padding-left: 2px;">
          <i class="fa-solid fa-clock"></i> Действует до: <span class="expires-iso">${expires || '—'}</span>
          ${expires ? `(осталось: <span class="expires-left" data-expires="${expires}"></span>)` : ''}
        </small>
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

      // Меняем состояние кнопки в зависимости от времени
      const item = span.closest('.action-item');
      const btn = item?.querySelector('.republish-btn');
      if (btn) {
        if (left > 0) {
          // Действие активно - кнопка НЕАКТИВНА
          btn.disabled = true;
          btn.style.opacity = '0.5';
          btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        } else {
          // Действие истекло - кнопка АКТИВНА (опубликовать заново)
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Опубликовать';
        }
      }
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
      const data = await post('/api/events/new', { text });
      if (data?.message) notify(data.message, data.ok ? 'success' : 'error');
      else notify('Действие создано');
      input.value = '';
      await refresh();
    } catch { }
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
      } catch { }
    }

    if (e.target.classList.contains('publish-btn')) {
      const sel = item.querySelector('.duration');
      const duration = Number(sel?.value || 10);
      try {
        await post('/api/events/publish', { id, duration });
        notify('Опубликовано');
        try { localStorage.setItem('EVENTS_PING', String(Date.now())); } catch { }
        await refresh();
      } catch { }
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
      } catch { }
    }

    if (e.target.classList.contains('republish-btn')) {
      // Проверяем, не заблокирована ли кнопка
      if (e.target.disabled) return;

      const leftSpan = item.querySelector('.expires-left[data-expires]');
      let left = 0;
      if (leftSpan) left = Date.parse(leftSpan.getAttribute('data-expires')) - Date.now();

      const sel = item.querySelector('.republish-duration');
      const duration = Number(sel?.value || 10);
      const originalDisabled = e.target.disabled;
      e.target.disabled = true;
      try {
        await post('/api/events/publish', { id, duration });
        notify('Опубликовано снова');
        try { localStorage.setItem('EVENTS_PING', String(Date.now())); } catch { }
        await refresh();
      } catch {
        notify('Не удалось опубликовать', 'error');
        e.target.disabled = originalDisabled;
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // realtime
    if (window.socket) {
      window.socket.off('events:changed');
      window.socket.on('events:changed', refresh);
    }
    // cross-tab ping (world.js дергает EVENTS_PING)
    window.addEventListener('storage', (e) => {
      if (e.key === 'EVENTS_PING') refresh();
    });
    ensureTimer();
    refresh();
  });
})();
