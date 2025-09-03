// Небольшой ajax-хелпер для кнопок на страницах профиля/превью
document.addEventListener('submit', async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  // обрабатываем только формы с атрибутом data-ajax
  if (!form.hasAttribute('data-ajax')) return;

  e.preventDefault();

  const btn = form.querySelector('[type="submit"]');
  if (form.dataset.busy === '1') return;
  form.dataset.busy = '1';
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(form.action || location.href, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'include',            // <-- Важно!
    });
    const data = await res.json().catch(() => ({}));

    if (window.showNotification) {
      showNotification(data.message || (res.ok ? 'Готово' : 'Ошибка'), res.ok ? 'success' : 'error');
    }
    if (res.ok && data.redirect) {
      location.assign(data.redirect);
    } else if (res.ok && !data.redirect) {
      // по умолчанию можно просто обновить страницу
      // location.reload();
    }
  } catch (err) {
    console.error(err);
    if (window.showNotification) showNotification('Ошибка', 'error');
  } finally {
    form.dataset.busy = '0';
    if (btn) btn.disabled = false;
  }
});
