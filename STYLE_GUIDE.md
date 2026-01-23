# 🎨 Руководство по стилям - "Наш Мир"

## 📖 Как использовать новые стили

### 1. Кнопки

#### Основная кнопка (синяя)
```html
<button style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; border: none; padding: 12px 20px; border-radius: 14px;">
  Действие
</button>
```

#### Кнопка успеха (зелёная)
```html
<button style="background: linear-gradient(135deg, #55efc4 0%, #00b894 100%); color: white;">
  Опубликовать
</button>
```

#### Кнопка удаления (красная)
```html
<button onclick="return confirm('Удалить?')">Удалить</button>
<!-- Автоматически получит красный градиент -->
```

#### Кнопка акцента (золотая)
```html
<button style="background: linear-gradient(135deg, #d0b896 0%, #b38a63 100%); color: white;">
  Отметиться
</button>
```

---

### 2. Карточки

#### Базовая карточка
```html
<div style="background: var(--color-bg-card); padding: 20px; border-radius: var(--radius-large); box-shadow: var(--shadow-soft); border: 1px solid var(--color-border);">
  Содержимое карточки
</div>
```

#### Карточка с градиентом
```html
<div style="background: linear-gradient(135deg, #fffaf5 0%, #fef8f0 100%); padding: 20px; border-radius: 20px;">
  Содержимое
</div>
```

---

### 3. Заголовки с иконками

```html
<h2>
  <i class="fa-solid fa-earth-americas" style="color: #0984e3;"></i>
  Наш Мир
</h2>

<h3>
  <i class="fa-solid fa-fire" style="color: #ff6b6b;"></i>
  Популярное сейчас
</h3>
```

---

### 4. Счётчики людей

#### В списке действий
```html
<span id="counter-123">5</span> чел.
<!-- Автоматически получит стили с эмодзи 👥 -->
```

#### Кастомный счётчик
```html
<span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border-radius: 20px; font-weight: 700;">
  👥 15
</span>
```

---

### 5. Формы

#### Инпут
```html
<input type="text" placeholder="Введите текст" style="width: 100%; padding: 12px 16px; border: 2px solid var(--color-border); border-radius: 14px;">
```

#### Textarea
```html
<textarea placeholder="Ваше сообщение" style="width: 100%; min-height: 80px; padding: 12px 16px; border: 2px solid var(--color-border); border-radius: 14px;"></textarea>
```

#### Select
```html
<select style="padding: 10px 14px; border: 2px solid var(--color-border); border-radius: 14px;">
  <option>Вариант 1</option>
  <option>Вариант 2</option>
</select>
```

---

### 6. Анимации

#### Появление снизу вверх
```html
<div style="animation: fadeInUp 0.4s ease-out;">
  Контент
</div>
```

#### Появление слева
```html
<div style="animation: slideInFromLeft 0.4s ease-out;">
  Контент
</div>
```

#### Пульсация
```html
<div style="animation: pulse 2s ease-in-out infinite;">
  Пульсирующий элемент
</div>
```

---

### 7. Специальные элементы

#### Пульс мира (главная страница)
```html
<div class="world-pulse">
  <div class="pulse-ring"></div>
  <div class="pulse-ring"></div>
  <div class="pulse-ring"></div>
  <div class="pulse-core">
    <i class="fa-solid fa-earth-americas"></i>
  </div>
</div>
```

#### Бейдж уведомлений
```html
<span class="menu-badge">3</span>
```

#### Онлайн индикатор (с пульсацией)
```html
<i class="fa-solid fa-circle" style="color:#28a745; font-size:10px;"></i>
```

---

### 8. Цветовые схемы для разных типов действий

#### Ежедневные действия
- Иконка: `<i class="fa-solid fa-clock" style="color: #fdcb6e;"></i>`
- Цвет: Жёлтый/Золотой

#### Активные действия
- Иконка: `<i class="fa-solid fa-fire" style="color: #ff6b6b;"></i>`
- Цвет: Красный/Оранжевый

#### Создание
- Иконка: `<i class="fa-solid fa-plus-circle" style="color: #00b894;"></i>`
- Цвет: Зелёный

#### Друзья
- Иконка: `<i class="fa-solid fa-user-group" style="color: #0984e3;"></i>`
- Цвет: Синий

#### Сообщения
- Иконка: `<i class="fa-solid fa-comment-dots" style="color: #a29bfe;"></i>`
- Цвет: Фиолетовый

---

### 9. Градиенты

#### Синий (основной)
```css
background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
```

#### Зелёный (успех)
```css
background: linear-gradient(135deg, #55efc4 0%, #00b894 100%);
```

#### Красный (опасность)
```css
background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
```

#### Золотой (акцент)
```css
background: linear-gradient(135deg, #d0b896 0%, #b38a63 100%);
```

#### Жёлтый (счётчики)
```css
background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
```

#### Тёплый фон
```css
background: linear-gradient(135deg, #fffaf5 0%, #fef8f0 100%);
```

---

### 10. Тени

#### Мягкая тень
```css
box-shadow: 0 4px 12px rgba(60, 45, 32, 0.06);
```

#### Средняя тень
```css
box-shadow: 0 8px 24px rgba(60, 45, 32, 0.08);
```

#### Тень при hover
```css
box-shadow: 0 12px 32px rgba(60, 45, 32, 0.15);
```

---

### 11. Эффекты при наведении

#### Подъём
```css
transform: translateY(-2px);
```

#### Увеличение
```css
transform: scale(1.05);
```

#### Сдвиг вправо
```css
transform: translateX(4px);
```

#### Комбинированный
```css
transform: translateX(6px) scale(1.02);
```

---

## 🎨 CSS переменные

Используйте переменные для консистентности:

```css
var(--color-bg-main)        /* Основной фон */
var(--color-bg-light)       /* Светлый фон */
var(--color-bg-card)        /* Фон карточек */
var(--color-text-primary)   /* Основной текст */
var(--color-text-secondary) /* Вторичный текст */
var(--color-accent)         /* Акцентный цвет */
var(--color-accent-hover)   /* Акцент при hover */
var(--color-border)         /* Границы */
var(--color-pulse)          /* Пульсация */
var(--color-success)        /* Успех */
var(--shadow-soft)          /* Мягкая тень */
var(--shadow-medium)        /* Средняя тень */
var(--radius-small)         /* 10px */
var(--radius-medium)        /* 14px */
var(--radius-large)         /* 20px */
```

---

## 💡 Советы

1. **Используйте градиенты** для кнопок и важных элементов
2. **Добавляйте анимации** для живости интерфейса
3. **Применяйте тени** для создания глубины
4. **Используйте иконки** для визуальной коммуникации
5. **Добавляйте hover эффекты** для интерактивности
6. **Соблюдайте отступы** - используйте кратные 4px (8, 12, 16, 20, 24)
7. **Применяйте border-radius** для мягкости форм

---

## 🎯 Философия дизайна

> "Каждый элемент должен дышать и жить, как и моменты, которые переживают люди"

- **Тепло** - цвета природы, уюта
- **Движение** - анимации, пульсация
- **Связь** - градиенты, переходы
- **Простота** - минимализм, фокус на действиях

---

*Обновлено: 23 января 2026*
