// static/js/friends.js
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  // Подключаемся к уже созданному в socket.js соединению
  function ensureSocket() {
    let socket = window.socket;
    try {
      if (!socket || socket.nsp !== '/world') {
        socket = io('/world', { withCredentials: true, auth: { userId: window.CURRENT_USER_ID } });
        window.socket = socket;
      }
      // На всякий случай — вступим в комнату, если не успели
      socket.emit('join', { room: `user_${window.CURRENT_USER_ID}` });

      // Не удаляем слушатели других скриптов (например, из base.html)
      // socket.off('friends:lists:refresh'); 
      socket.on('friends:lists:refresh', () => {
        refreshLists();
        if (window.updateFriendsBadge) window.updateFriendsBadge();
      });
    } catch (e) {
      console.warn('socket init failed', e);
    }
    return socket;
  }

  async function fetchPartial(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    return res.text();
  }

  async function updateBadges() {
    try {
      const keep = ($('#cleanup-time')?.value) || '10';
      const res = await fetch(`/api/friends/list?keep=${encodeURIComponent(keep)}`, { credentials: 'include' });
      if (!res.ok) return;

      const data = await res.json();
      const possibleCount = data.possible_friends?.length || 0;
      const incomingCount = data.incoming_requests?.length || 0;
      const outgoingCount = data.outgoing_requests?.length || 0;

      const updateTabBadge = (key, count) => {
        const badge = document.getElementById(`badge-${key}`);
        const tabBtn = document.querySelector(`.tab-button[data-tab="${key}"]`);
        const isActive = tabBtn && tabBtn.classList.contains('active');

        let lastSeen = parseInt(localStorage.getItem(`seen_${key}`) || '0');

        if (isActive) {
          if (lastSeen !== count) {
            localStorage.setItem(`seen_${key}`, count);
            lastSeen = count;
          }
        }

        if (badge) {
          badge.textContent = count;
          const show = count > 0 && count > lastSeen;
          badge.style.display = show ? 'inline-flex' : 'none';
          if (!show) badge.classList.add('hidden'); else badge.classList.remove('hidden');
          return show ? 1 : 0;
        }
        return 0;
      };

      let activeTabsCount = 0;
      activeTabsCount += updateTabBadge('possible', possibleCount);
      activeTabsCount += updateTabBadge('incoming', incomingCount);
      activeTabsCount += updateTabBadge('outgoing', outgoingCount);

      const menuBadge = document.getElementById('friends-badge');
      if (menuBadge) {
        menuBadge.textContent = activeTabsCount;
        menuBadge.style.display = activeTabsCount > 0 ? 'inline-flex' : 'none';
        if (activeTabsCount === 0) menuBadge.classList.add('hidden'); else menuBadge.classList.remove('hidden');
      }
    } catch (e) {
      console.error('Error updating badges:', e);
    }
  }

  async function refreshLists() {
    const keep = ($('#cleanup-time')?.value) || '10';
    const mapping = [
      ['possible-friends-list', `/api/friends/partials/possible?keep=${encodeURIComponent(keep)}`],
      ['incoming-requests', '/api/friends/partials/incoming'],
      ['outgoing-requests', '/api/friends/partials/outgoing'],
      ['friends-list', '/api/friends/partials/friends'],
      ['subscribers-list', '/api/friends/partials/subscribers'],
      ['subscriptions-list', '/api/friends/partials/subscriptions'],
    ];
    await Promise.all(mapping.map(async ([id, url]) => {
      const el = document.getElementById(id);
      if (!el) return;
      try { el.innerHTML = await fetchPartial(url); } catch (e) { console.error(url, e); }
    }));
    await updateBadges();
  }

  async function post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => ({}));
  }

  // Делегирование кликов с защитой от дабл-клика
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';

    const action = btn.dataset.action;
    try {
      if (action === 'request') await post(`/api/friends/request/${btn.dataset.userId}`);
      else if (action === 'accept') await post(`/api/friends/accept/${btn.dataset.requestId}`);
      else if (action === 'cancel') await post(`/api/friends/cancel/${btn.dataset.requestId}`);
      else if (action === 'leave-subscriber') await post(`/api/friends/leave-subscriber/${btn.dataset.requestId}`);
      else if (action === 'remove-friend') await post(`/api/friends/remove/${btn.dataset.userId}`);
      else if (action === 'subscribe') await post(`/api/friends/subscribe/${btn.dataset.userId}`);
      else if (action === 'unsubscribe') await post(`/api/friends/unsubscribe/${btn.dataset.userId}`);
      else if (action === 'dismiss') await post(`/api/friends/dismiss/${btn.dataset.userId}`);

      await refreshLists(); // локальный фоллбэк; сервер всё равно шлёт событие
    } catch (e) {
      console.error('action failed', action, e);
      if (window.showNotification) showNotification('Ошибка операции', 'error'); else alert('Ошибка операции');
    } finally {
      btn.dataset.busy = '0';
    }
  });

  document.addEventListener('change', async (ev) => {
    const sel = ev.target.closest('#cleanup-time');
    if (!sel) return;
    try {
      const el = document.getElementById('possible-friends-list');
      if (el) el.innerHTML = await fetchPartial(`/api/friends/partials/possible?keep=${encodeURIComponent(sel.value)}`);
    } catch (e) { console.error(e); }
  });

  document.addEventListener('DOMContentLoaded', () => {
    ensureSocket();
    // Дадим socket.js возможность дергать обновление глобально
    window.refreshFriendsLists = refreshLists;
    window.updateBadges = updateBadges;
    refreshLists();
  });
})();
