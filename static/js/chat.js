(function() {
    let currentReceiverId = null;
    let socket = null;

    // 🔥 ФИКС РЕАЛ-ТАЙМА: Ждем, пока base.html загрузит сокет
    const initInterval = setInterval(() => {
        if (window.socket) {
            socket = window.socket;
            clearInterval(initInterval);
            startChatLogic();
        }
    }, 100);

    function startChatLogic() {
        // 1. СЛУШАЕМ СООБЩЕНИЯ
        socket.on('chat:new_message', (msg) => {
            // А. Если сообщение от того, с кем переписываемся ПРЯМО СЕЙЧАС
            if (currentReceiverId && msg.senderId === currentReceiverId) {
                appendMessage(msg, false);
                scrollToBottom();
                markAsRead(currentReceiverId);
            } 
            // Б. Если сообщение от другого друга (мы в чате, но с другим)
            else {
                updateContactBadge(msg.senderId);
            }
        });
    }

    // Хелпер: Увеличить цифру на контакте
    function updateContactBadge(senderId) {
        const badge = document.getElementById(`badge-${senderId}`);
        if (badge) {
            const current = parseInt(badge.innerText) || 0;
            badge.innerText = current + 1;
            badge.style.display = 'inline-block';
        }
    }

    // Хелпер: Сбросить цифру (когда открыли чат)
    function clearContactBadge(friendId) {
        const badge = document.getElementById(`badge-${friendId}`);
        if (badge) {
            badge.innerText = '0';
            badge.style.display = 'none';
        }
    }

    // 2. ВЫБОР ЧАТА
    window.selectChat = async function(friendId, username, avatarUrl) {
        currentReceiverId = friendId;
        window.ACTIVE_CHAT_USER_ID = friendId;

        // UI: Подсветка контакта
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.contact-item[data-id="${friendId}"]`);
        if (activeItem) activeItem.classList.add('active');

        // 🔥 СБРАСЫВАЕМ ЦИФРУ У ЭТОГО КОНТАКТА
        clearContactBadge(friendId);

        // UI: Открываем окно
        document.getElementById('chat-header').style.display = 'flex';
        document.getElementById('chat-form').style.display = 'flex';
        document.getElementById('header-username').innerText = username;
        document.getElementById('header-avatar').src = avatarUrl;
        
        const area = document.getElementById('messages-area');
        area.innerHTML = '<div style="padding:20px; color:#999; text-align:center;">Загрузка истории...</div>';

        try {
            const res = await fetch(`/api/chat/history/${friendId}`);
            if(!res.ok) throw new Error('Ошибка');
            const messages = await res.json();
            
            area.innerHTML = ''; 
            messages.forEach(msg => {
                const isMine = (msg.senderId === window.CURRENT_USER_ID);
                appendMessage(msg, isMine);
            });
            scrollToBottom();
            
            // Помечаем прочитанным и обновляем ГЛОБАЛЬНЫЙ бейдж в меню
            await markAsRead(friendId);

        } catch (e) {
            area.innerHTML = '<div style="color:red; text-align:center;">Ошибка загрузки</div>';
        }
    };

    // 3. ОТПРАВКА СООБЩЕНИЯ
    const form = document.getElementById('chat-form');
    const input = document.getElementById('msg-input');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !currentReceiverId) return;

        input.value = '';

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: currentReceiverId, content: text })
            });
            const savedMsg = await res.json();
            
            if (savedMsg && !savedMsg.error) {
                appendMessage(savedMsg, true);
                scrollToBottom();
            }
        } catch (e) {
            alert('Не удалось отправить');
        }
    });

    async function markAsRead(friendId) {
        try {
            await fetch(`/api/chat/mark-read/${friendId}`, { method: 'POST' });
            if (window.updateGlobalBadge) window.updateGlobalBadge();
        } catch(e) {}
    }

    function appendMessage(msg, isMine) {
        const area = document.getElementById('messages-area');
        const div = document.createElement('div');
        div.className = `msg ${isMine ? 'mine' : 'theirs'}`;
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        div.innerHTML = `${escapeHtml(msg.content)}<span class="msg-time">${time}</span>`;
        area.appendChild(div);
    }

    function scrollToBottom() {
        const area = document.getElementById('messages-area');
        area.scrollTop = area.scrollHeight;
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    window.addEventListener('beforeunload', () => {
        window.ACTIVE_CHAT_USER_ID = null;
    });
})();