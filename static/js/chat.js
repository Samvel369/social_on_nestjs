(function() {
    let currentReceiverId = null;
    let socket = null;
    let editingMessageId = null; // ID сообщения, которое сейчас редактируем
    
    // Таймеры
    const typingTimeouts = {}; 
    let lastTypingSent = 0; 

    // Элементы контекстного меню
    const ctxMenu = document.getElementById('context-menu');
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxDelete = document.getElementById('ctx-delete');
    let ctxTargetId = null; // ID сообщения под курсором

    const initInterval = setInterval(() => {
        if (window.socket) {
            socket = window.socket;
            clearInterval(initInterval);
            startChatLogic();
        }
    }, 100);

    function startChatLogic() {
        // --- 1. СЛУШАЕМ СОБЫТИЯ ---

        socket.on('chat:new_message', (msg) => {
            hideTyping(msg.senderId);
            if (currentReceiverId && msg.senderId === currentReceiverId) {
                appendMessage(msg, false); // Чужое сообщение
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

        // 🔥 ОБНОВЛЕНИЕ СООБЩЕНИЯ (EDIT)
        socket.on('chat:message_updated', (data) => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                // Ищем внутри div текста (он первый node или в span)
                // Для надежности перерисуем контент, сохраняя время
                const timeEl = msgEl.querySelector('.msg-time');
                const timeHtml = timeEl ? timeEl.outerHTML : '';
                
                msgEl.innerHTML = `${escapeHtml(data.content)} <span class="msg-edited">(изм.)</span> ${timeHtml}`;
            }
        });

        // 🔥 УДАЛЕНИЕ СООБЩЕНИЯ (DELETE)
        socket.on('chat:message_deleted', (data) => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                msgEl.remove();
            }
        });
    }

    // --- ЛОГИКА INPUT (Печать + Отправка) ---
    const input = document.getElementById('msg-input');
    input.addEventListener('input', () => {
        if (!socket || !currentReceiverId) return;
        const now = Date.now();
        if (now - lastTypingSent > 2000) {
            socket.emit('chat:typing', { receiverId: currentReceiverId });
            lastTypingSent = now;
        }
    });

    // --- ФОРМА ОТПРАВКИ ---
    const form = document.getElementById('chat-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const sendBtn = document.getElementById('send-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        if (editingMessageId) {
            // РЕЖИМ РЕДАКТИРОВАНИЯ
            await submitEdit(text);
        } else {
            // РЕЖИМ ОТПРАВКИ
            if (!currentReceiverId) return;
            await submitNewMessage(text);
        }
    });

    // Отмена редактирования
    cancelEditBtn.addEventListener('click', () => {
        exitEditMode();
    });

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
        exitEditMode(); // Сначала выходим из режима UI
        
        try {
            await fetch(`/api/chat/${msgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text })
            });
            // Сокет сам обновит UI, нам тут ничего делать не надо, 
            // но для мгновенного отклика можно было бы обновить DOM вручную.
        } catch (e) { alert('Ошибка редактирования'); }
    }

    function enterEditMode(msgId, currentText) {
        editingMessageId = msgId;
        input.value = currentText;
        input.focus();
        sendBtn.innerText = 'Save';
        cancelEditBtn.style.display = 'block';
        input.style.border = '2px solid #007bff';
    }

    function exitEditMode() {
        editingMessageId = null;
        input.value = '';
        sendBtn.innerText = 'Send';
        cancelEditBtn.style.display = 'none';
        input.style.border = '1px solid #ccc';
    }


    // --- КОНТЕКСТНОЕ МЕНЮ (ПКМ) ---
    document.addEventListener('contextmenu', (e) => {
        const msgEl = e.target.closest('.msg');
        if (msgEl) {
            e.preventDefault(); // Блокируем стандартное меню
            ctxTargetId = parseInt(msgEl.dataset.msgId);
            const isMine = msgEl.classList.contains('mine');

            // Показываем/скрываем кнопку редактирования (только для своих)
            if (isMine) {
                ctxEdit.style.display = 'block';
            } else {
                ctxEdit.style.display = 'none';
            }

            // Позиционируем меню
            ctxMenu.style.top = `${e.pageY}px`;
            ctxMenu.style.left = `${e.pageX}px`;
            ctxMenu.style.display = 'block';
        } else {
            ctxMenu.style.display = 'none';
        }
    });

    // Скрываем меню при клике в любом месте
    document.addEventListener('click', () => ctxMenu.style.display = 'none');

    // Клик по "Редактировать"
    ctxEdit.addEventListener('click', () => {
        if (!ctxTargetId) return;
        // Достаем текст из DOM (без времени и пометки изм)
        const msgEl = document.querySelector(`.msg[data-msg-id="${ctxTargetId}"]`);
        if (msgEl) {
            // Грязный хак, чтобы взять только текст: клонируем и удаляем детей
            const clone = msgEl.cloneNode(true);
            clone.querySelectorAll('span').forEach(el => el.remove());
            const text = clone.innerText.trim();
            enterEditMode(ctxTargetId, text);
        }
    });

    // Клик по "Удалить"
    ctxDelete.addEventListener('click', async () => {
        if (!ctxTargetId) return;
        try {
            await fetch(`/api/chat/${ctxTargetId}`, { method: 'DELETE' });
            // Сокет сам удалит элемент из DOM
        } catch(e) { alert('Ошибка удаления'); }
    });


    // --- ОСТАЛЬНЫЕ ХЕЛПЕРЫ (Выбор чата, рендер) ---
    // ... (Функции markAsRead, showTyping, hideTyping, updateContactBadge копируем из прошлого файла или оставляем) ...
    // ВАЖНО: Обновленный appendMessage с data-msg-id

    function showTyping(userId) {
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'block';
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'block';
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

    window.selectChat = async function(friendId, username, avatarUrl) {
        currentReceiverId = friendId;
        window.ACTIVE_CHAT_USER_ID = friendId;
        exitEditMode(); // Сброс при смене чата

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.contact-item[data-id="${friendId}"]`);
        if (activeItem) activeItem.classList.add('active');
        clearContactBadge(friendId);

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

    function appendMessage(msg, isMine) {
        const area = document.getElementById('messages-area');
        const div = document.createElement('div');
        div.className = `msg ${isMine ? 'mine' : 'theirs'}`;
        // 🔥 ВАЖНО: Добавляем ID для поиска
        div.dataset.msgId = msg.id; 
        
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const editedMark = msg.isEdited ? '<span class="msg-edited">(изм.)</span>' : '';

        div.innerHTML = `${escapeHtml(msg.content)} ${editedMark} <span class="msg-time">${time}</span>`;
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