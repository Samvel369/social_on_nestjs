# 📝 Changelog

## 2026-02-13

### Навигация и Статистика
- **Сайдбар:** Убрана вкладка "Главная", изменен порядок (Наш мир, Мои действия, Статистика, Чат...).
- **Статистика:** Новая страница `/statistics` с показателями активности пользователя.
- **Вкладки "Наш мир":** Добавлена вкладка "Топ 10" (по умолчанию), переименованы "Ежедневные" -> "Сейчас происходит", "Сейчас происходит" -> "Создать событие".

### Исправления
- **Prisma:** Обновлен Prisma Client для корректной работы с таблицами `DailyAction`.
- **Роутинг:** Исправлен конфликт маршрутов `/profile/stats` и `/profile/:id`.

## 2026-02-09

### Ежедневные действия — антиспам
- **Защита:** не чаще 1 отметки на действие раз в 10 минут
- **Модалка:** при повторной попытке — всплывающее окно с обратным отсчётом и кнопкой «Ок»
- **Без уведомлений:** при успешной отметке — тихо, только обновление счётчиков

### Ежедневные действия — поиск и порядок
- **Поиск:** строка поиска над списком, фильтрация при вводе (по подстроке, без учёта регистра)
- **Персональный порядок:** отмеченные действия поднимаются вверх для пользователя
- **Скролл:** список ограничен по высоте (~10 видимых), остальное — прокрутка

### Ежедневные действия — расширенный список
- **Миграции:** добавлено ~150 действий (еда, напитки, программирование, эмоции, здоровье, спорт, транспорт)
- **Категории:** эмоции (грущу, веселюсь…), здоровье (заболел, простудился…), спорт, виды транспорта

### Ежедневные действия — UI
- **Кнопка:** «Я тоже» → «Отметиться», ширина по содержимому
- **Расположение:** название — счётчик — кнопка (слева направо), убрано «чел.»

### Шаблоны
- **Fix:** `onclick="markAction({{ action.id }})"` вызывал ошибку — заменён на `data-action-id` и делегирование событий

### Бейдж чата — моргание
- **Issue:** при переключении вкладок бейдж мелькал с «0»
- **Fix:** бейдж скрыт по умолчанию (`display: none`), показывается только после ответа API при `count > 0`
- **Files:** `base.html`

## 2026-01-27

### Mobile App - Login Fix
- **Issue:** Mobile app couldn't connect to backend, "Network Error"
- **Root cause:** Docker port mapping `5433:3000` → mobile tried `:3000`, but host exposed `:5433`
- **Fix:** Changed `docker-compose.yml` ports to `3000:3000` for consistent access
- **Files:** `infra/docker-compose.yml`

### Backend - Mobile API Support
- **Added:** `access_token` in JSON response for `/api/auth/login` and `/api/auth/register`
- **Before:** Only set HttpOnly cookie (for web), mobile had no token
- **After:** Returns `{ ok: true, access_token, user }` for both web + mobile
- **Added:** Detailed logging in `auth.controller.ts` (login attempts, success/fail)
- **TypeScript fix:** Added `error: any` type in catch block
- **Files:** `auth.controller.ts`, `auth.service.ts`

### Mobile App - Debug Logging
- **Added:** Comprehensive console logging in auth flow
- **Logs:** API URL, request/response data, error details (network/server/unknown)
- **UI:** Better error messages in alerts (network vs server errors)
- **Files:** `src/services/auth.ts`, `src/screens/LoginScreen.tsx` (mobile project)

### Network Access
- **Setup:** Backend listens on `0.0.0.0:3000` (all interfaces)
- **Access:** `http://localhost:3000` (web), `http://10.128.105.4:3000` (mobile)
- **Note:** May require Windows Firewall rule for port 3000 incoming connections

## 2026-01-24

### Sidebar Redesign
- **Left/Right:** `#faf8f5` bg (was gradient)
- **Left avatar:** 60px (was 80px)
- **Right stats:** horizontal layout (text left, number right, 20px font)
- **Issue:** inline styles in `base.html` overrode `style.css` → removed inline
- **Files:** `style.css`, `base.html` (CSS v12)

### Button Fix (My Actions)
- **Active action:** `[+]` icon only, disabled, opacity 0.5
- **Expired action:** `[↻] Опубликовать`, enabled, opacity 1
- **Logic:** `updateCountdowns()` checks `left > 0` → sets disabled state
- **Files:** `my_actions.js`

### Blink Fix (Main Page)
- **Issue:** "Нет активных действий" rerendered every 1s
- **Fix:** check `textContent.trim()` before `innerHTML =`
- **Files:** `main.html`, `index.html`

### World Badge (prev)
- **Logic:** shows count of NEW actions since `lastViewedWorldAt`
- **Updates:** realtime via `world:actions:refresh` event → fetch `/unseen-actions-count`
- **Check:** every 5s + on page load
- **Mark viewed:** `POST /mark-viewed` on world page open
- **Arch:** server-side count (single source of truth), not client +1

### UI Theme (prev)
- **Colors:** beige/cream with brown accents
- **Vars:** `--bg-primary: #f5f3f0`, `--accent-primary: #8b6f47`
- **Tabs:** world page (daily/happening), friends page (tabs for requests/friends/subs)
- **Compact:** my_actions cards (1 line, "Действует до" below)

### Tech Stack
- **Backend:** NestJS + Prisma + PostgreSQL + Socket.IO
- **Frontend:** Vanilla JS + Nunjucks + CSS vars
- **Auth:** JWT + Passport
- **Deploy:** Docker

### Key Files
- `style.css` - theme, sidebar, cards
- `my_actions.js` - dynamic render, button logic
- `socket.js` - WS client, badge updates
- `base.html` - layout, sidebar HTML
- `world.service.ts` - badge count logic
- `realtime.gateway.ts` - WS server

### Notes
- Sidebar collapsed state: `localStorage`
- CSS versioning: `?v=12` for cache bust
- Media query: right sidebar hidden <1000px (was 1200px)
