# 🚗 Car CRM - Система управления автомобильным бизнесом

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e)](https://supabase.com/)

Современная CRM система для управления автомобильным бизнесом с расчетом прибыли, управлением расходами и аналитикой.

## ✨ Возможности

- 🚗 **Управление автомобилями** - Полный учет автомобилей с детальной информацией
- 💰 **Расчет прибыли** - Автоматический расчет прибыли с учетом всех расходов
- 📊 **Аналитика** - Детальная статистика и отчеты по продажам
- 💸 **Управление расходами** - Учет прямых и накладных расходов
- 🌐 **Мультиязычность** - Поддержка узбекского и русского языков
- 📱 **Адаптивный дизайн** - Отлично работает на всех устройствах
- 🎨 **Современный UI** - Красивый интерфейс с плавными анимациями

## 🎉 Что нового в версии 2.0?

- ✅ Полностью обновленный дизайн с современной дизайн-системой
- ✅ Новые UI компоненты (Badge, Tooltip, Spinner, Alert)
- ✅ Улучшенная навигация с мобильным меню
- ✅ Редизайн дашборда с анимациями
- ✅ Расширенная локализация

📖 **Подробнее:** [README_IMPROVEMENTS.md](./README_IMPROVEMENTS.md)

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- npm или yarn
- Аккаунт Supabase

### Установка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd car-crm-v2

# Установите зависимости
npm install

# Настройте переменные окружения
cp .env.example .env.local
# Отредактируйте .env.local и добавьте ваши ключи Supabase

# Запустите dev сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📚 Документация

- 📖 [Сводка улучшений](./IMPROVEMENTS_SUMMARY.md) - Полный список всех улучшений
- 🚀 [Следующие шаги](./NEXT_STEPS.md) - План дальнейшего развития
- 📊 [Отчет об обновлении](./UPGRADE_REPORT.md) - Детальный отчет о версии 2.0
- 📝 [История изменений](./CHANGELOG.md) - Changelog проекта
- 💡 [Быстрый старт](./README_IMPROVEMENTS.md) - Руководство по новым возможностям

## 🛠 Технологии

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 4, Custom CSS Variables
- **Backend:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **i18n:** Custom implementation (UZ/RU)

## 📦 Структура проекта

```
src/app/
├── components/
│   ├── ui/              # UI компоненты (Badge, Tooltip, Spinner, Alert)
│   ├── Nav.tsx          # Навигация
│   └── Text.tsx         # Компонент локализации
├── i18n/                # Система переводов
├── cars/                # Страницы автомобилей
├── expenses/            # Страницы расходов
├── page.tsx             # Главная страница (дашборд)
└── globals.css          # Глобальные стили и дизайн-система

database/
├── 01_schema.sql        # Схема БД
└── 02_calculation_views.sql  # Views для расчетов
```

## 🎨 Новые UI компоненты

### Badge
```tsx
<Badge variant="success" size="md">Активен</Badge>
```

### Tooltip
```tsx
<Tooltip content="Подсказка" position="top">
  <button>Наведи</button>
</Tooltip>
```

### Spinner
```tsx
<Spinner size="lg" color="primary" />
```

### Alert
```tsx
<Alert variant="success" title="Успех!">
  Операция выполнена
</Alert>
```

## 🌐 Локализация

Проект поддерживает два языка:
- 🇺🇿 Узбекский (uz)
- 🇷🇺 Русский (ru)

Переключение языка доступно в навигационном меню.

## 📱 Адаптивность

Все компоненты полностью адаптивны и отлично работают на:
- 💻 Desktop (1920px+)
- 💻 Laptop (1024px+)
- 📱 Tablet (768px+)
- 📱 Mobile (320px+)


## Setup (Supabase + Local)

1. Create a Supabase project (already provisioned in this repo). Set env vars:

```
NEXT_PUBLIC_SUPABASE_URL=...      # public URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # anon key
SUPABASE_SERVICE_ROLE=...         # service key (server only)
```

2. Apply DB schema (done automatically by our migration step via Augment). If needed, re-apply using Supabase SQL editor with scripts in this repo history.

3. Seed demo data:

```
npm run seed
```

4. Start dev server:

```
npm run dev
```

Open /debug-check to verify tables exist, and /debug-seed to generate a demo flow.
