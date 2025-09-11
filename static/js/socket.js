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
  }

  document.addEventListener('DOMContentLoaded', initSocket);
})();
