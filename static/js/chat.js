(function() {
    let currentReceiverId = null;
    let socket = null;
    let editingMessageId = null;
    let lastTypingSent = 0;
    const typingTimeouts = {};

    let selectionMode = false;
    let selectedMsgIds = new Set();
    let replyingToIds = [];

    const ctxMenu = document.getElementById('context-menu');
    const ctxTargetIdVal = { current: null }; 

    const selectionBar = document.getElementById('selection-bar');
    const selCountSpan = document.getElementById('sel-count');
    const replyPreviewBar = document.getElementById('reply-preview-bar');
    const replyPreviewContent = document.getElementById('reply-preview-content');
    
    const btnReplyMulti = document.getElementById('btn-reply-multi');
    const btnDeleteMulti = document.getElementById('btn-delete-multi');
    const btnCancelSel = document.getElementById('btn-cancel-sel');
    const closeReplyBtn = document.getElementById('close-reply-btn');
    const sendBtn = document.getElementById('send-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const input = document.getElementById('msg-input');
    const form = document.getElementById('chat-form');

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
            const contactId = (msg.senderId === window.CURRENT_USER_ID) ? msg.receiverId : msg.senderId;
            updateContactPreview(contactId, msg.content);
        });

        socket.on('chat:message_updated', (data) => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                const contentSpan = msgEl.querySelector('.msg-content-text');
                if(contentSpan) contentSpan.innerHTML = escapeHtml(data.content);
                if (data.isEdited && !msgEl.querySelector('.msg-edited')) {
                    const timeEl = msgEl.querySelector('.msg-time');
                    const editMark = document.createElement('span');
                    editMark.className = 'msg-edited';
                    editMark.innerText = '(изм.)';
                    if (timeEl) msgEl.insertBefore(editMark, timeEl);
                }
            }
        });

        socket.on('chat:message_deleted', (data) => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${data.id}"]`);
            if (msgEl) {
                const container = msgEl.closest('.msg-container');
                if (container) container.remove();
                if (selectedMsgIds.has(data.id)) {
                    selectedMsgIds.delete(data.id);
                    updateSelectionUI();
                }
            }
        });

        socket.on('chat:reaction_updated', (data) => renderReactions(data.id, data.reactions));
        
        socket.on('chat:typing', ({ senderId }) => {
            showTyping(senderId);
            // Сбрасываем таймер скрытия
            if (typingTimeouts[senderId]) clearTimeout(typingTimeouts[senderId]);
            // Ставим новый на 3 секунды
            typingTimeouts[senderId] = setTimeout(() => hideTyping(senderId), 3000);
        });
    }

    function updateContactPreview(friendId, text) {
        const previewEl = document.getElementById(`last-msg-${friendId}`);
        if (previewEl) previewEl.innerText = text;
        const item = document.getElementById(`contact-${friendId}`);
        const list = document.getElementById('contact-list');
        if (item && list) list.prepend(item);
    }

    async function markAsRead(friendId) {
        const badge = document.getElementById(`badge-${friendId}`);
        if (badge) {
            badge.innerText = '0';
            badge.style.display = 'none';
        }
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

    // --- ЛОГИКА ОТОБРАЖЕНИЯ СТАТУСА ПЕЧАТИ ---
    function hideTyping(userId) {
        // 1. В списке контактов
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'none';
        
        // 2. В заголовке (если открыт этот чат)
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'none';
        }
    }
    
    function showTyping(userId) {
        // 1. В списке контактов
        const listIndicator = document.getElementById(`typing-list-${userId}`);
        if (listIndicator) listIndicator.style.display = 'block'; 
        
        // 2. В заголовке (если открыт этот чат)
        if (currentReceiverId === userId) {
            const headerIndicator = document.getElementById('typing-header');
            if (headerIndicator) headerIndicator.style.display = 'block';
        }
    }
    // ------------------------------------------

    function toggleSelectionMode(msgId) {
        if (!selectionMode) { selectionMode = true; selectionBar.style.display = 'flex'; }
        if (selectedMsgIds.has(msgId)) selectedMsgIds.delete(msgId);
        else selectedMsgIds.add(msgId);
        const msgEl = document.querySelector(`.msg[data-msg-id="${msgId}"]`);
        if (msgEl) msgEl.closest('.msg-container').classList.toggle('selected', selectedMsgIds.has(msgId));
        if (selectedMsgIds.size === 0) exitSelectionMode();
        else selCountSpan.innerText = `${selectedMsgIds.size} выбрано`;
    }

    function exitSelectionMode() {
        selectionMode = false;
        selectedMsgIds.forEach(id => {
            const msgEl = document.querySelector(`.msg[data-msg-id="${id}"]`);
            if (msgEl) msgEl.closest('.msg-container').classList.remove('selected');
        });
        selectedMsgIds.clear();
        selectionBar.style.display = 'none';
    }

    document.addEventListener('click', (e) => {
        if (selectionMode) {
            const msgEl = e.target.closest('.msg');
            if (msgEl && !e.target.closest('.msg-menu-btn')) {
                toggleSelectionMode(parseInt(msgEl.dataset.msgId));
                e.preventDefault(); e.stopPropagation();
            }
        }
    });

    btnCancelSel.onclick = exitSelectionMode;
    btnReplyMulti.onclick = () => { replyingToIds = Array.from(selectedMsgIds); exitSelectionMode(); showReplyPreview(); input.focus(); };
    btnDeleteMulti.onclick = async () => {
        if (!confirm(`Удалить ${selectedMsgIds.size} сообщений?`)) return;
        const ids = Array.from(selectedMsgIds);
        exitSelectionMode();
        try { await fetch('/api/chat/delete-bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); } catch(e) {}
    };

    function showReplyPreview() {
        replyPreviewBar.style.display = 'flex';
        if (replyingToIds.length === 1) {
            const el = document.querySelector(`.msg[data-msg-id="${replyingToIds[0]}"] .msg-content-text`);
            replyPreviewContent.innerText = el ? el.innerText.substring(0, 30) + '...' : 'сообщение';
        } else {
            replyPreviewContent.innerText = `${replyingToIds.length} сообщений`;
        }
    }
    function clearReplyMode() { replyingToIds = []; replyPreviewBar.style.display = 'none'; }
    closeReplyBtn.onclick = clearReplyMode;

    const ctxReply = document.getElementById('ctx-reply');
    const ctxSelect = document.getElementById('ctx-select');
    ctxReply.onclick = () => { if (!ctxTargetIdVal.current) return; replyingToIds = [ctxTargetIdVal.current]; ctxMenu.style.display = 'none'; showReplyPreview(); input.focus(); };
    ctxSelect.onclick = () => { if (!ctxTargetIdVal.current) return; ctxMenu.style.display = 'none'; toggleSelectionMode(ctxTargetIdVal.current); };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        if (editingMessageId) await submitEdit(text);
        else await submitNewMessage(text);
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exitEditMode();
        });
    }

    async function submitNewMessage(text) {
        input.value = '';
        const replyIds = [...replyingToIds];
        clearReplyMode();
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: currentReceiverId, content: text, replyToIds: replyIds.length > 0 ? replyIds : undefined })
            });
            const savedMsg = await res.json();
            if (savedMsg && !savedMsg.error) {
                appendMessage(savedMsg, true);
                scrollToBottom();
                updateContactPreview(currentReceiverId, text); 
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
        sendBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; 
        cancelEditBtn.style.display = 'block';
        document.getElementById('chat-form-wrapper').style.border = '2px solid #007bff';
        ctxMenu.style.display = 'none';
    }

    function exitEditMode() {
        editingMessageId = null;
        input.value = '';
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        cancelEditBtn.style.display = 'none';
        document.getElementById('chat-form-wrapper').style.border = 'none';
        document.getElementById('chat-form-wrapper').style.borderTop = '1px solid #ddd';
    }

    // Context Menu Helpers
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxDelete = document.getElementById('ctx-delete');
    
    ctxEdit.addEventListener('click', () => {
        if (!ctxTargetIdVal.current) return;
        const msgEl = document.querySelector(`.msg[data-msg-id="${ctxTargetIdVal.current}"]`);
        if (msgEl) {
             const contentSpan = msgEl.querySelector('.msg-content-text');
             enterEditMode(ctxTargetIdVal.current, contentSpan ? contentSpan.innerText : '');
        }
    });
    ctxDelete.addEventListener('click', async () => {
        if (!ctxTargetIdVal.current) return;
        ctxMenu.style.display = 'none';
        try { await fetch(`/api/chat/${ctxTargetIdVal.current}`, { method: 'DELETE' }); } catch(e) {}
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-menu-btn');
        if (btn) {
            e.preventDefault(); e.stopPropagation();
            const msgEl = btn.closest('.msg');
            ctxTargetIdVal.current = parseInt(msgEl.dataset.msgId);
            const isMine = msgEl.classList.contains('mine');
            ctxEdit.style.display = isMine ? 'flex' : 'none'; 
            const rect = btn.getBoundingClientRect();
            ctxMenu.style.top = `${rect.top + window.scrollY + 20}px`;
            ctxMenu.style.left = (rect.left > window.innerWidth - 200) ? `${rect.left - 150}px` : `${rect.left}px`;
            ctxMenu.style.display = 'block';
            return;
        }
        if (!e.target.closest('#context-menu')) ctxMenu.style.display = 'none';
    });
    
    window.selectChat = async function(friendId, username, avatarUrl) {
        exitSelectionMode();
        clearReplyMode();
        currentReceiverId = friendId;
        window.ACTIVE_CHAT_USER_ID = friendId;
        
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById(`contact-${friendId}`);
        if (activeItem) activeItem.classList.add('active');
        
        markAsRead(friendId); 

        document.getElementById('chat-header').style.display = 'flex';
        document.getElementById('chat-form-wrapper').style.display = 'flex';
        document.getElementById('header-username').innerText = username;
        document.getElementById('header-avatar').src = avatarUrl;
        
        const area = document.getElementById('messages-area');
        area.innerHTML = '<div style="padding:20px; color:#999; text-align:center;">Загрузка истории...</div>';

        try {
            const res = await fetch(`/api/chat/history/${friendId}`);
            const messages = await res.json();
            area.innerHTML = ''; 
            messages.forEach(msg => appendMessage(msg, msg.senderId === window.CURRENT_USER_ID));
            scrollToBottom();
        } catch (e) {
            area.innerHTML = '<div style="color:red; text-align:center;">Ошибка загрузки</div>';
        }
    };

    function appendMessage(msg, isMine) {
        const area = document.getElementById('messages-area');
        const container = document.createElement('div');
        container.className = `msg-container ${isMine ? 'mine' : 'theirs'}`;
        const div = document.createElement('div');
        div.className = `msg ${isMine ? 'mine' : 'theirs'}`;
        div.dataset.msgId = msg.id; 
        
        let replyHtml = '';
        if (msg.replyTo && msg.replyTo.length > 0) {
            const count = msg.replyTo.length;
            const first = msg.replyTo[0];
            const senderName = first.senderName || '...';
            const text = count > 1 ? `Ответ на ${count} сообщений` : first.content;
            replyHtml = `<div class="reply-quote-block" onclick="scrollToMsg(${first.id})"><span class="reply-quote-sender">${escapeHtml(senderName)}</span><span class="reply-quote-text">${escapeHtml(text)}</span></div>`;
        }

        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const editedMark = msg.isEdited ? '<span class="msg-edited">(изм.)</span>' : '';

        div.innerHTML = `${replyHtml}<span class="msg-content-text">${escapeHtml(msg.content)}</span>${editedMark}<span class="msg-time">${time}</span><div class="msg-menu-btn">⋮</div>`;
        container.appendChild(div);
        
        if (msg.reactions && msg.reactions.length > 0) {
            const row = document.createElement('div');
            row.className = 'reactions-row';
            container.appendChild(row);
        }
        area.appendChild(container);
        if (msg.reactions) renderReactions(msg.id, msg.reactions);
    }

    window.scrollToMsg = function(id) {
        const el = document.querySelector(`.msg[data-msg-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    function scrollToBottom() { const area = document.getElementById('messages-area'); area.scrollTop = area.scrollHeight; }
    function escapeHtml(text) { return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''; }
    
    window.sendReaction = async function(emoji) {
         if (!ctxTargetIdVal.current) return;
         ctxMenu.style.display = 'none';
         try { await fetch(`/api/chat/${ctxTargetIdVal.current}/react`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) }); } catch(e) {}
    };

    function renderReactions(msgId, reactions) {
        const msgEl = document.querySelector(`.msg[data-msg-id="${msgId}"]`);
        if (!msgEl) return;
        const container = msgEl.closest('.msg-container');
        let row = container.querySelector('.reactions-row');
        if (!row) { row = document.createElement('div'); row.className = 'reactions-row'; container.appendChild(row); }
        row.innerHTML = '';
        if (!reactions || !reactions.length) return;
        const groups = {};
        reactions.forEach(r => { if (!groups[r.emoji]) groups[r.emoji]=[]; groups[r.emoji].push(r.userId); });
        for (const [emoji, uids] of Object.entries(groups)) {
            const pill = document.createElement('div');
            pill.className = `reaction-pill ${uids.includes(window.CURRENT_USER_ID)?'my-reaction':''}`;
            pill.innerHTML = `${emoji} ${uids.length}`;
            pill.onclick = () => { ctxTargetIdVal.current = msgId; window.sendReaction(emoji); };
            row.appendChild(pill);
        }
    }
    
    // 🔥 ОТПРАВКА СОБЫТИЯ ПЕЧАТИ 🔥
    const inputEl = document.getElementById('msg-input');
    if(inputEl) inputEl.addEventListener('input', () => {
        // Проверяем, что сокет есть и чат выбран
        if (!socket || !currentReceiverId) return;
        
        const now = Date.now();
        // Троттлинг: шлем не чаще чем раз в 2 секунды
        if (now - lastTypingSent > 2000) {
            socket.emit('chat:typing', { receiverId: currentReceiverId });
            lastTypingSent = now;
        }
    });

})();