# Car Expense Tracker - CRM V2

Sovremennoe veb-prilozhenie dlya uchyota raskhodov i dokhodov po avtomobilyam s avtomaticheskim raspredeleniem pribyli.

## Технологии

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Radix UI, Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query

## Быстрый старт

1. **Клонирование репозитория**
   ```bash
   git clone <repository-url>
   cd car-expense-tracker
   ```

2. **Установка зависимостей**
   ```bash
   npm install
   ```

3. **Настройка переменных окружения**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Заполните переменные в .env.local:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL вашего проекта Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Публичный ключ Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Сервисный ключ Supabase

4. **Настройка базы данных**
   Откройте file `supabase/complete_migration.sql` в SQL Editor Supabase и выполните его.

5. **Запуск приложения**
   ```bash
   npm run dev
   ```

## Структура проекта

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/            # Страницы аутентификации
│   ├── dashboard/         # Главная панель
│   ├── cars/             # Управление автомобилями
│   ├── transactions/     # Доходы и расходы
│   ├── reports/          # Отчёты и аналитика
│   └── api/              # API routes
├── components/           # Переиспользуемые компоненты
├── lib/                 # Утилиты и конфигурация
├── types/               # TypeScript типы
└── hooks/               # Пользовательские хуки
```

## Основные сущности

### Автомобили
- VIN-номер (уникальный идентификатор)
- Марка, модель, год выпуска
- Статус (активен/продан)
- Цена покупки и продажи

### Транзакции
- Тип (доход/расход)
- Категория
- Сумма в валюте
- Описание
- Дата и время
- Связь с автомобилем
- Признак личной транзакции

### Распределение прибыли
- Автоматическое распределение: 50% инвестору, 25% владельцу, 25% помощнику
- Расчёт на основе транзакций и исключение личных расходов
- Аудит изменений со ссылками на источники

### Мультивалютность
- Поддержка USD, EUR, RUB, UZS
- Автоматическая конвертация в USD
- Актуальные курсы валют

### Система ролей
- Овладелец (полный доступ)
- Инвестор (чтение и аналитика)
- Помощник (ограниченные права)

## Особенности

- Автоматическое распределение прибыли
- Реальное времонное обновление данных
- Интерактивные графики и диаграммы
- Адаптивный дизайн для всех устройств
- Богатая аналитика и отчёты
- Мультивалютная поддержка

## Деплоймент

Проект размещён на Vercel:
- **Production URL**: https://car-crm-v2-web-nepc-aydmaxxs-projects.vercel.app
- **Development**: http://localhost:3000

## Обновления UI

- **Современный интерфейс** с интерактивными компонентами
- **Интерактивные графики и диаграммы** для отображения данных
- **Адаптивный дизайн** для всех устройств
- **Богатая функциональность** и интеграции

## Технические особенности

- **Next.js 14** - современная framework для React
- **Supabase** - полноценная backend платформа
- **Tailwind CSS** - современная стилизация
- **Radix UI** - компоненты с поддержкой accessibility
- **Recharts** - интерактивные графики
- **TanStack Query** - управление состоянием и кэшированием

## Лицензия

MIT License - см LICENSE для подробностей.
