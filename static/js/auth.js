document.addEventListener('DOMContentLoaded', () => {
  const notify = (msg, type = 'info') => {
    let c = document.getElementById('notification-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'notification-container';
      c.className = 'notification-container';
      document.body.appendChild(c);
    }
    const box = document.createElement('div');
    box.className = `notification ${type}`;
    box.textContent = Array.isArray(msg) ? msg.join('\n') : String(msg || 'Ошибка');
    c.appendChild(box);
    setTimeout(() => box.remove(), 4000);
  };

  const extractNestError = (err) => {
    if (!err) return 'Неизвестная ошибка';
    if (Array.isArray(err.message)) return err.message;
    if (typeof err.message === 'string') return err.message;
    return JSON.stringify(err);
  };

  // Регистрация
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      const payload = {
        username: (fd.get('username') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        password: (fd.get('password') || '').toString(),
        confirmPassword:
          (fd.get('confirmPassword') || fd.get('confirm_password') || '').toString(),
      };
      if (payload.password.length < 6 || payload.confirmPassword.length < 6) {
        return notify('Пароль и подтверждение должны быть не короче 6 символов', 'error');
      }
      if (payload.password !== payload.confirmPassword) {
        return notify('Пароли не совпадают', 'error');
      }
      try {
        const r = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return notify(extractNestError(data), 'error');
        notify('Регистрация успешна, сейчас перейдём на вход…', 'success');
        setTimeout(() => (location.href = '/api/auth/login'), 700);
      } catch {
        notify('Сеть недоступна', 'error');
      }
    });
  }

  // Вход
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const payload = {
        username: (fd.get('username') || '').toString().trim(),
        password: (fd.get('password') || '').toString(),
      };
      if (!payload.username || !payload.password) {
        return notify('Заполните имя и пароль', 'error');
      }
      try {
        const r = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include', // критично для куки
        });
        let data = {};
        try { data = await r.json(); } catch {}
        if (!r.ok) return notify(extractNestError(data), 'error');
        // Если сервис вернул access_token дополнительно — сохраним
        if (data && data.access_token) localStorage.setItem('access_token', data.access_token);
        location.href = '/api/world/view';
      } catch {
        notify('Сеть недоступна', 'error');
      }
    });
  }
});
