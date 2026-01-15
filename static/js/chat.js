(function() {
    let currentReceiverId = null;
    let socket = null;
    let editingMessageId = null; 
    
    // Таймеры
    const typingTimeouts = {}; 
    let lastTypingSent = 0;  // Объявляем переменную ОДИН раз здесь

    // Элементы контекстного меню
    const ctxMenu = document.getElementById('context-menu');
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxDelete = document.getElementById('ctx-delete');
    let ctxTargetId = null; // ID сообщения, для которого открыто меню

    const initInterval = setInterval(() => {
        if (window.socket) {
            socket = window.socket;
            clearInterval(initInterval);
            startChatLogic();
        }
    }, 100);

    function startChatLogic() {
        socket.on('chat:new_message', (msg) => {
            hideTyping(msg.senderId);
            if (currentReceiverId && msg.senderId === currentReceiverId) {
                appendMessage(msg, false);
                scrollToBottom();
                markAsRead(currentReceiverId);
            } else {
                updateContactBadge(msg.senderId);
            }
        });

        socket.on('chat:typing', ({ senderId }) => {
            showTyping(senderId);
            if (typingTimeouts[senderId]) clearTimeout(typingTimeouts[senderId]);
            typingTimeouts[senderId] = setTimeout(() => hideTyping(senderId), 10000);
        });

        socket.on('chat:message_updated', (data) => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                // Обновляем текст
                const contentSpan = msgEl.querySelector('.msg-content-text');
                if(contentSpan) contentSpan.innerHTML = escapeHtml(data.content);
                
                // Обновляем пометку (изм.)
                if (!msgEl.querySelector('.msg-edited')) {
                    const timeEl = msgEl.querySelector('.msg-time');
                    const editMark = document.createElement('span');
                    editMark.className = 'msg-edited';
                    editMark.innerText = '(изм.)';
                    if (timeEl) msgEl.insertBefore(editMark, timeEl);
                }
            }
        });

        socket.on('chat:message_deleted', (data) => {
            // Удаляем весь контейнер сообщения
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                const container = msgEl.closest('.msg-container');
                if (container) container.remove();
            }
        });

        // 🔥 ОБНОВЛЕНИЕ РЕАКЦИЙ
        socket.on('chat:reaction_updated', (data) => {
            renderReactions(data.id, data.reactions);
        });
    }

    // --- ФУНКЦИИ РЕАКЦИЙ ---

    // Вызывается из HTML (onclick)
    window.sendReaction = async function(emoji) {
        if (!ctxTargetId) return;
        ctxMenu.style.display = 'none'; // Закрыть меню
        try {
            await fetch(`/api/chat/${ctxTargetId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji })
            });
        } catch(e) { console.error(e); }
    };

    function renderReactions(msgId, reactions) {
        // Ищем контейнер сообщения
        const msgEl = document.querySelector(`.msg[data-msg-id="${msgId}"]`);
        if (!msgEl) return;
        const container = msgEl.closest('.msg-container');
        if (!container) return;

        // Ищем или создаем ряд реакций
        let row = container.querySelector('.reactions-row');
        if (!row) {
            row = document.createElement('div');
            row.className = 'reactions-row';
            container.appendChild(row);
        }

        row.innerHTML = ''; // Очищаем

        if (!reactions || reactions.length === 0) return;

        // Группируем реакции: { "❤️": [userId, userId], "😂": [userId] }
        const groups = {};
        reactions.forEach(r => {
            if (!groups[r.emoji]) groups[r.emoji] = [];
            groups[r.emoji].push(r.userId);
        });

        // Рисуем пузырьки
        for (const [emoji, userIds] of Object.entries(groups)) {
            const pill = document.createElement('div');
            pill.className = 'reaction-pill';
            const count = userIds.length;
            const isMine = userIds.includes(window.CURRENT_USER_ID);
            
            if (isMine) pill.classList.add('my-reaction');
            
            pill.innerHTML = `${emoji} ${count}`;
            
            // Клик по пузырьку = тоже Toggle (лайкнуть/анлайкнуть)
            pill.onclick = () => {
                ctxTargetId = msgId; // Хак, чтобы функция знала ID
                window.sendReaction(emoji);
            };

            row.appendChild(pill);
        }
    }

    // --- МЕНЮ (ОТКРЫТИЕ) ---
    // Используем делегирование, чтобы ловить клик по "три точки"
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-menu-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation(); // Чтобы не сработало закрытие меню

            const msgEl = btn.closest('.msg');
            ctxTargetId = parseInt(msgEl.dataset.msgId);
            const isMine = msgEl.classList.contains('mine');

            // Настройка пунктов меню
            ctxEdit.style.display = isMine ? 'flex' : 'none'; // Редактировать только свои
            
            // Позиционируем меню рядом с кнопкой
            const rect = btn.getBoundingClientRect();
            ctxMenu.style.top = `${rect.top + window.scrollY + 20}px`;
            // Пытаемся выровнять, чтобы не вылезло за экран
            if (rect.left > window.innerWidth - 200) {
                 ctxMenu.style.left = `${rect.left - 150}px`;
            } else {
                 ctxMenu.style.left = `${rect.left}px`;
            }
            
            ctxMenu.style.display = 'block';
            return;
        }

        // Если клик мимо меню - закрываем
        if (!e.target.closest('#context-menu')) {
            ctxMenu.style.display = 'none';
        }
    });


    // --- ЛОГИКА INPUT / FORM ---
    const input = document.getElementById('msg-input');
    const form = document.getElementById('chat-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const sendBtn = document.getElementById('send-btn');
    // ЗДЕСЬ БЫЛА ОШИБКА: повторное let lastTypingSent = 0; — Я УДАЛИЛ ЭТУ СТРОКУ

    input.addEventListener('input', () => {
        if (!socket || !currentReceiverId) return;
        const now = Date.now();
        if (now - lastTypingSent > 2000) {
            socket.emit('chat:typing', { receiverId: currentReceiverId });
            lastTypingSent = now;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        if (editingMessageId) {
            await submitEdit(text);
        } else {
            if (!currentReceiverId) return;
            await submitNewMessage(text);
        }
    });

    cancelEditBtn.addEventListener('click', exitEditMode);

    async function submitNewMessage(text) {
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
        } catch (e) { alert('Ошибка отправки'); }
    }

    async function submitEdit(text) {
        const msgId = editingMessageId;
        exitEditMode(); 
        try {
            await fetch(`/api/chat/${msgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text })
            });
        } catch (e) { alert('Ошибка редактирования'); }
    }

    function enterEditMode(msgId, currentText) {
        editingMessageId = msgId;
        input.value = currentText;
        input.focus();
        sendBtn.innerText = 'Save';
        cancelEditBtn.style.display = 'block';
        input.style.border = '2px solid #007bff';
        ctxMenu.style.display = 'none'; // Закрыть меню если открыто
    }

    function exitEditMode() {
        editingMessageId = null;
        input.value = '';
        sendBtn.innerText = 'Send';
        cancelEditBtn.style.display = 'none';
        input.style.border = '1px solid #ccc';
    }

    // --- КЛИКИ ПО МЕНЮ ---
    ctxEdit.addEventListener('click', () => {
        if (!ctxTargetId) return;
        const msgEl = document.querySelector(`.msg[data-msg-id="${ctxTargetId}"]`);
        if (msgEl) {
             const contentSpan = msgEl.querySelector('.msg-content-text');
             const text = contentSpan ? contentSpan.innerText : '';
             enterEditMode(ctxTargetId, text);
        }
    });

    ctxDelete.addEventListener('click', async () => {
        if (!ctxTargetId) return;
        ctxMenu.style.display = 'none';
        try { await fetch(`/api/chat/${ctxTargetId}`, { method: 'DELETE' }); } catch(e) {}
    });


    // --- РЕНДЕРИНГ ---

    // Обновленный рендер: теперь создаем структуру msg-container -> msg -> menu + reactions
    function appendMessage(msg, isMine) {
        const area = document.getElementById('messages-area');
        
        // Контейнер (чтобы реакции были снаружи пузыря)
        const container = document.createElement('div');
        container.className = `msg-container ${isMine ? 'mine' : 'theirs'}`;

        const div = document.createElement('div');
        div.className = `msg ${isMine ? 'mine' : 'theirs'}`;
        div.dataset.msgId = msg.id; 
        
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const editedMark = msg.isEdited ? '<span class="msg-edited">(изм.)</span>' : '';

        div.innerHTML = `
            <span class="msg-content-text">${escapeHtml(msg.content)}</span>
            ${editedMark}
            <span class="msg-time">${time}</span>
            <div class="msg-menu-btn">⋮</div> 
        `; // ⋮ - символ вертикального троеточия

        container.appendChild(div);
        
        // Место для реакций (сразу рендерим, если есть в истории)
        if (msg.reactions && msg.reactions.length > 0) {
            const row = document.createElement('div');
            row.className = 'reactions-row';
            container.appendChild(row);
        }

        area.appendChild(container);

        // Если были реакции при загрузке (history)
        if (msg.reactions && msg.reactions.length > 0) {
            renderReactions(msg.id, msg.reactions);
        }
    }

    // ... (Helpers: scrollToBottom, escapeHtml, etc. без изменений) ...
    window.selectChat = async function(friendId, username, avatarUrl) {
        currentReceiverId = friendId;
        window.ACTIVE_CHAT_USER_ID = friendId;
        exitEditMode(); 

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.contact-item[data-id="${friendId}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        // Сброс бейджа
        const badge = document.getElementById(`badge-${friendId}`);
        if(badge) { badge.innerText='0'; badge.style.display='none'; }

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
            await markAsRead(friendId);
        } catch (e) {
            area.innerHTML = '<div style="color:red; text-align:center;">Ошибка загрузки</div>';
        }
    };
    
    async function markAsRead(friendId) {
        try {
            await fetch(`/api/chat/mark-read/${friendId}`, { method: 'POST' });
            if (window.updateGlobalBadge) window.updateGlobalBadge();
        } catch(e) {}
    }
    function updateContactBadge(senderId) {
        const badge = document.getElementById(`badge-${senderId}`);
        if (badge) {
            const current = parseInt(badge.innerText) || 0;
            badge.innerText = current + 1;
            badge.style.display = 'inline-block';
        }
    }
    function hideTyping(userId) {
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'none';
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'none';
        }
    }
    function showTyping(userId) {
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'block';
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'block';
        }
    }
    function scrollToBottom() {
        const area = document.getElementById('messages-area');
        area.scrollTop = area.scrollHeight;
    }
    function escapeHtml(text) {
        if (!text) return text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    window.addEventListener('beforeunload', () => { window.ACTIVE_CHAT_USER_ID = null; });
})();