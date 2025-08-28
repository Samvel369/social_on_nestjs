// ---------- app/static/js/world.js ----------
const CSRF = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

function markAction(actionId) {
  fetch(`/api/actions/mark_action/${actionId}`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': CSRF
    }
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        updateCounters();               // сразу обновим счётчики
      } else if (data.error === 'wait') {
        showCooldown(actionId, data.remaining);
      }
    })
    .catch(console.error);
}

function showCooldown(actionId, seconds) {
  const span = document.getElementById(`cooldown-${actionId}`);
  if (!span) return;
  span.style.display = 'inline';
  let remain = seconds;

  const timer = setInterval(() => {
    const mm = Math.floor(remain / 60);
    const ss = String(remain % 60).padStart(2, '0');
    span.textContent = `Подождите ${mm}:${ss}`;
    remain -= 1;
    if (remain <= 0) {
      clearInterval(timer);
      span.textContent = '';
      span.style.display = 'none';
    }
  }, 1000);
}

function updateCounters() {
  fetch('/api/actions/get_mark_counts')
    .then(r => r.json())
    .then(map => {
      Object.entries(map).forEach(([id, cnt]) => {
        const el = document.getElementById(`counter-${id}`);
        if (el) el.textContent = cnt;
      });
    })
    .catch(console.error);
}

// список опубликованных (только живые)
function refreshPublished() {
  fetch('/api/actions/get_published_actions')
    .then(r => r.json())
    .then(list => {
      const ul = document.getElementById('published-actions');
      if (!ul) return;

      // текущее состояние DOM
      const currentLis = Array.from(ul.children);
      const existing = new Set(currentLis.map(li => String(li.getAttribute('data-id'))));

      // набор пришедших id
      const incoming = new Set(list.map(a => String(a.id)));

      // удалить то, чего нет на сервере (удалили/истёк срок)
      currentLis.forEach(li => {
        const id = String(li.getAttribute('data-id'));
        if (!incoming.has(id)) li.remove();
      });

      // добавить новые
      list.forEach(a => {
        const id = String(a.id);
        if (existing.has(id)) return;

        const li = document.createElement('li');
        li.setAttribute('data-id', id);
        li.innerHTML = `
          <a href="/action/${id}" target="_blank">${a.text}</a> —
          <span id="counter-${id}">0</span> чел.
          <button onclick="markAction(${id})">Отметиться</button>
          <div id="message-${id}" style="color:red;"></div>
          <span id="cooldown-${id}" style="color:red; display:none;"></span>
        `;
        ul.prepend(li);
      });
    })
    .catch(console.error);
}

// первичная подкачка и интервал
refreshPublished();
updateCounters();
setInterval(refreshPublished, 1000);
setInterval(updateCounters, 1000);

// Гасим нативную отправку «наших» форм (чтобы не было белого JSON)
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.matches('#world-create-form') || f.matches('form.world-publish')) {
    e.preventDefault();
  }
});

// Создание действия
document.addEventListener('click', async (e) => {
  if (e.target.id === 'world-create-btn') {
    const form = document.getElementById('world-create-form');
    const fd = new FormData(form);

    try {
      const res = await fetch(form.action, { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok || data.ok === false) {
        window.showNotification?.(data.message || 'Ошибка при создании');
        return;
      }

      // обновляем секцию драфтов (и/или всю страницу мира)
      // если у вас есть специальная функция перерисовки — вызовите её;
      // ниже пример через кастомное событие, как мы делали ранее:
      document.dispatchEvent(new CustomEvent('world:refresh-drafts'));
      form.reset();
      window.showNotification?.('Действие создано', 'success');
    } catch (err) {
      console.error(err);
      window.showNotification?.('Ошибка сети');
    }
  }
});

// Публикация драфта
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.publish-btn');
  if (!btn) return;

  const form = btn.closest('form.world-publish');
  const fd = new FormData(form);

  try {
    const res = await fetch(form.action, { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok || data.ok === false) {
      window.showNotification?.(data.message || 'Ошибка публикации');
      return;
    }

    // обновляем драфты и опубликованные
    document.dispatchEvent(new CustomEvent('world:refresh-drafts'));
    document.dispatchEvent(new CustomEvent('world:refresh-published'));
    window.showNotification?.('Опубликовано', 'success');
  } catch (err) {
    console.error(err);
    window.showNotification?.('Ошибка сети');
  }
});
