// static/js/socket.js
// Единое соединение в namespace '/world' + join в комнату user_<id>
(function () {
  function initSocket() {
    const uid = window.CURRENT_USER_ID;
    if (!uid) return;

    if (window.socket && window.socket.connected && window.socket.nsp === '/world') {
      return;
    }

    const socket = io('/world', {
      withCredentials: true,
      auth: { userId: uid },
    });

    window.socket = socket;
    window.__friendsSocket = socket;

    const joinRoom = () => {
      try { socket.emit('join', { room: `user_${uid}` }); } catch {}
      try { socket.emit('stats:request'); } catch {}   // ← запросим текущие цифры
    };

    socket.on('connect', joinRoom);
    socket.io.on('reconnect', joinRoom);

    // Нормальное событие "друзей"
    socket.off('friends:lists:refresh');
    socket.on('friends:lists:refresh', () => {
      if (typeof window.refreshFriendsLists === 'function') {
        window.refreshFriendsLists();
      }
    });

    // Legacy-событие из старого world.service.ts
    socket.off('update_possible_friends');
    socket.on('update_possible_friends', () => {
      if (typeof window.refreshFriendsLists === 'function') {
        window.refreshFriendsLists();
      }
    });

    // Прочие старые (просто на всякий случай)
    socket.on('friend_accepted', function (data) {
      console.log('Новый друг (legacy event):', data);
    });
    socket.on('new_request', function (data) {
      console.log('Новая заявка (legacy event):', data);
    });

     // === обновление счётчиков ===
    socket.off('stats:online');
    socket.on('stats:online', (data) => {
      const onlineEl = document.getElementById('online-users');
      if (onlineEl) onlineEl.textContent = String((data && data.online) || 0);

      const totalEl = document.getElementById('total-users');
      if (totalEl && data && typeof data.total === 'number') {
        totalEl.textContent = String(data.total);
      }
    });
    // 🔥 НОВОЕ: Слушаем общее количество пользователей
    socket.off('stats:total');
    socket.on('stats:total', (data) => {
      const totalEl = document.getElementById('total-users');
      if (totalEl) {
        // Добавляем красивый эффект мигания при изменении
        totalEl.style.transition = 'color 0.3s';
        totalEl.style.color = '#ff9800'; // Оранжевая вспышка
        totalEl.textContent = String((data && data.total) || 0);
        setTimeout(() => totalEl.style.color = '', 500);
      }
    });

    // 🔥 НОВОЕ: Слушаем обновление действий мира (для бейджа "Наш мир")
    socket.off('world:actions:refresh');
    socket.on('world:actions:refresh', () => {
      // Вызываем функцию обновления бейджа, если она определена в base.html
      if (typeof window.updateWorldBadge === 'function') {
        window.updateWorldBadge();
      }
    });

    // Ежедневные действия: обновление счётчиков в реальном времени
    socket.off('daily:counts_update');
    socket.on('daily:counts_update', (data) => {
      if (typeof window.updateDailyCounters === 'function' && data && data.counts) {
        window.updateDailyCounters(data.counts);
      }
    });
  }
  document.addEventListener('DOMContentLoaded', initSocket);
})();
