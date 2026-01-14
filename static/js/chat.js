(function() {
    let currentReceiverId = null;
    let socket = null;
    
    // Таймеры для "печатает..." (ключ = senderId, значение = timerId)
    const typingTimeouts = {}; 
    let lastTypingSent = 0; // Чтобы не спамить серверу каждые 10мс

    const initInterval = setInterval(() => {
        if (window.socket) {
            socket = window.socket;
            clearInterval(initInterval);
            startChatLogic();
        }
    }, 100);

    function startChatLogic() {
        // 1. СЛУШАЕМ НОВЫЕ СООБЩЕНИЯ
        socket.on('chat:new_message', (msg) => {
            // Если пришло сообщение - немедленно убираем "печатает"
            hideTyping(msg.senderId);

            if (currentReceiverId && msg.senderId === currentReceiverId) {
                appendMessage(msg, false);
                scrollToBottom();
                markAsRead(currentReceiverId);
            } else {
                updateContactBadge(msg.senderId);
            }
        });

        // 2. СЛУШАЕМ "КТО-ТО ПЕЧАТАЕТ"
        socket.on('chat:typing', ({ senderId }) => {
            // Показываем индикатор
            showTyping(senderId);

            // Сбрасываем старый таймер (если был)
            if (typingTimeouts[senderId]) {
                clearTimeout(typingTimeouts[senderId]);
            }

            // Ставим новый таймер на 10 секунд (как ты просил)
            typingTimeouts[senderId] = setTimeout(() => {
                hideTyping(senderId);
            }, 10000);
        });
    }

    // --- ЛОГИКА ОТПРАВКИ "Я ПЕЧАТАЮ" ---
    const input = document.getElementById('msg-input');
    input.addEventListener('input', () => {
        if (!socket || !currentReceiverId) return;

        const now = Date.now();
        // Отправляем сигнал не чаще, чем раз в 2 секунды
        if (now - lastTypingSent > 2000) {
            socket.emit('chat:typing', { receiverId: currentReceiverId });
            lastTypingSent = now;
        }
    });

    // --- ХЕЛПЕРЫ ВИЗУАЛА ---

    function showTyping(userId) {
        // 1. В списке контактов (слева)
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'block';

        // 2. В шапке (справа), если мы сейчас в чате с этим юзером
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'block';
        }
    }

    function hideTyping(userId) {
        // Скрываем везде
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'none';

        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'none';
        }
    }

    function updateContactBadge(senderId) {
        const badge = document.getElementById(`badge-${senderId}`);
        if (badge) {
            const current = parseInt(badge.innerText) || 0;
            badge.innerText = current + 1;
            badge.style.display = 'inline-block';
        }
    }

    function clearContactBadge(friendId) {
        const badge = document.getElementById(`badge-${friendId}`);
        if (badge) {
            badge.innerText = '0';
            badge.style.display = 'none';
        }
    }

    // --- ВЫБОР ЧАТА ---
    window.selectChat = async function(friendId, username, avatarUrl) {
        currentReceiverId = friendId;
        window.ACTIVE_CHAT_USER_ID = friendId;

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.contact-item[data-id="${friendId}"]`);
        if (activeItem) activeItem.classList.add('active');

        clearContactBadge(friendId);

        // UI
        document.getElementById('chat-header').style.display = 'flex';
        document.getElementById('chat-form').style.display = 'flex';
        document.getElementById('header-username').innerText = username;
        document.getElementById('header-avatar').src = avatarUrl;
        
        // Скрываем индикатор печати при переключении (вдруг там висел старый)
        const headerTyping = document.getElementById('typing-header');
        if (headerTyping) headerTyping.style.display = 'none';

        // Проверяем, не печатает ли этот друг прямо сейчас (вдруг таймер еще тикает)
        // Если тикает - показываем индикатор сразу
        const listIndicator = document.getElementById(`typing-list-${friendId}`);
        if (listIndicator && listIndicator.style.display === 'block') {
             if (headerTyping) headerTyping.style.display = 'block';
        }
        
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
            
            await markAsRead(friendId);
        } catch (e) {
            area.innerHTML = '<div style="color:red; text-align:center;">Ошибка загрузки</div>';
        }
    };

    // --- ОТПРАВКА ---
    const form = document.getElementById('chat-form');

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