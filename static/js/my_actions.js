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
    const opts = { method: 'POST' };
    if (body instanceof FormData) {
      opts.body = body;
    } else if (body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
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
      el.innerHTML = `
        <a href="/api/actions/action_card/${a.id}">${escapeHtml(a.text)}</a>
        <small>Действует до: ${a.expiresAt ?? '—'}</small>
        <button type="button" class="delete-btn">Удалить</button>
      `;
      publishedBox.appendChild(el);
    }
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
  });

  document.addEventListener('DOMContentLoaded', () => {
    // 1) обновляемся по сокету (если он есть и уже поднят в socket.js)
    if (window.socket) {
      window.socket.off('my-actions:changed');
      window.socket.on('my-actions:changed', refresh);
    }

    // 2) и ещё обновляемся по «пингу» из другой вкладки (world.js ставит MYA_PING)
    window.addEventListener('storage', (e) => {
      if (e.key === 'MYA_PING') refresh();
    });

    refresh();
  });
})();
