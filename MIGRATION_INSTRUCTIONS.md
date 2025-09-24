# Инструкции по миграции базы данных

## Способ 1: Через SQL Editor в Supabase Dashboard (Рекомендуется)

1. Перейдите в ваш проект Supabase: https://xixjtczhnyggwotkvbhh.supabase.co
2. Откройте **SQL Editor** в левом меню
3. Выполните файлы миграций **по порядку**:

### Шаг 1: Основная схема
Скопируйте и выполните содержимое файла `supabase/migrations/001_initial_schema.sql`

### Шаг 2: Триггеры и функции  
Скопируйте и выполните содержимое файла `supabase/migrations/002_triggers_and_functions.sql`

### Шаг 3: Политики безопасности
Скопируйте и выполните содержимое файла `supabase/migrations/003_rls_policies.sql`

### Шаг 4: Представления и аналитика
Скопируйте и выполните содержимое файла `supabase/migrations/004_views_and_analytics.sql`

### Шаг 5: Базовые данные
Выполните следующий SQL для добавления курсов валют:

```sql
INSERT INTO exchange_rates (currency, rate_to_usd, date) VALUES
('EUR', 1.08, CURRENT_DATE),
('GBP', 1.25, CURRENT_DATE),
('RUB', 0.011, CURRENT_DATE),
('UZS', 0.000081, CURRENT_DATE),
('KZT', 0.0021, CURRENT_DATE)
ON CONFLICT (currency, date) DO UPDATE SET
rate_to_usd = EXCLUDED.rate_to_usd;
```

## Способ 2: Через Node.js скрипт

1. Получите ваши ключи API:
   - Перейдите в Settings → API
   - Скопируйте **anon** ключ и **service_role** ключ

2. Обновите файл `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xixjtczhnyggwotkvbhh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_ключ
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
```

3. Выполните миграцию:
```bash
npm install
node migrate-supabase.js
```

## Проверка успешной миграции

После выполнения миграций проверьте, что созданы следующие таблицы:
- `users`
- `cars` 
- `transactions`
- `exchange_rates`
- `audit_log`

И представления:
- `dashboard_stats`
- `monthly_summary`
- `category_analysis`
- `car_profitability`

## Получение API ключей

1. Откройте ваш проект: https://xixjtczhnyggwotkvbhh.supabase.co
2. Перейдите в **Settings** → **API**
3. Скопируйте:
   - **Project URL**: `https://xixjtczhnyggwotkvbhh.supabase.co`
   - **anon public**: для NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **service_role**: для SUPABASE_SERVICE_ROLE_KEY (⚠️ Держите в секрете!)

## Следующие шаги

После успешной миграции:
1. Обновите `.env.local` с правильными ключами
2. Запустите приложение: `npm run dev`
3. Зарегистрируйте первого пользователя (он автоматически получит роль 'owner')
4. Начните добавлять автомобили и транзакции!
