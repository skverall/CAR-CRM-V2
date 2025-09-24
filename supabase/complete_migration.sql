-- =====================================================
-- CAR EXPENSE TRACKER - ПОЛНАЯ МИГРАЦИЯ БАЗЫ ДАННЫХ
-- =====================================================
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта
-- https://xixjtczhnyggwotkvbhh.supabase.co

-- Удаляем существующие объекты если они есть (для чистой установки)
DROP VIEW IF EXISTS car_profitability CASCADE;
DROP VIEW IF EXISTS category_analysis CASCADE;
DROP VIEW IF EXISTS monthly_summary CASCADE;
DROP VIEW IF EXISTS dashboard_stats CASCADE;

DROP FUNCTION IF EXISTS get_profit_distribution() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS car_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- СОЗДАНИЕ ТИПОВ И ТАБЛИЦ
-- =====================================================

-- Создание enum типов
CREATE TYPE user_role AS ENUM ('owner', 'investor', 'assistant');
CREATE TYPE car_status AS ENUM ('active', 'sold');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'assistant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица автомобилей
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    status car_status NOT NULL DEFAULT 'active',
    purchase_price DECIMAL(12,2),
    purchase_date DATE,
    sale_price DECIMAL(12,2),
    sale_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_year CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
    CONSTRAINT valid_vin CHECK (LENGTH(vin) = 17),
    CONSTRAINT sale_logic CHECK (
        (status = 'active' AND sale_price IS NULL AND sale_date IS NULL) OR
        (status = 'sold' AND sale_price IS NOT NULL AND sale_date IS NOT NULL)
    )
);

-- Таблица курсов валют
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency TEXT NOT NULL,
    rate_to_usd DECIMAL(10,6) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(currency, date)
);

-- Таблица транзакций
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1.0,
    amount_usd DECIMAL(12,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_personal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT positive_rate CHECK (exchange_rate > 0)
);

-- Таблица аудита
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- СОЗДАНИЕ ИНДЕКСОВ
-- =====================================================

CREATE INDEX idx_cars_vin ON cars(vin);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_car_id ON transactions(car_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_exchange_rates_currency_date ON exchange_rates(currency, date);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- =====================================================
-- СОЗДАНИЕ ФУНКЦИЙ И ТРИГГЕРОВ
-- =====================================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция аудита
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), 
                CASE WHEN TG_TABLE_NAME = 'users' THEN OLD.id ELSE OLD.user_id END);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), 
                CASE WHEN TG_TABLE_NAME = 'users' THEN NEW.id ELSE NEW.user_id END);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), 
                CASE WHEN TG_TABLE_NAME = 'users' THEN NEW.id ELSE NEW.user_id END);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггеры аудита
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_cars_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cars
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Функция расчета прибыли
CREATE OR REPLACE FUNCTION get_profit_distribution()
RETURNS TABLE (
    total_profit DECIMAL(12,2),
    investor_share DECIMAL(12,2),
    owner_share DECIMAL(12,2),
    assistant_share DECIMAL(12,2)
) AS $$
DECLARE
    profit DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN t.type = 'income' THEN t.amount_usd
            WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd
            ELSE 0
        END
    ), 0) INTO profit
    FROM transactions t;
    
    RETURN QUERY SELECT 
        profit,
        ROUND(profit * 0.5, 2),
        ROUND(profit * 0.25, 2),
        ROUND(profit * 0.25, 2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- НАСТРОЙКА ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Политики для cars
CREATE POLICY "Everyone can view cars" ON cars FOR SELECT USING (true);
CREATE POLICY "Owner and assistant can manage cars" ON cars FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('owner', 'assistant')
    )
);

-- Политики для transactions
CREATE POLICY "Everyone can view transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Owner can manage all transactions" ON transactions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
);
CREATE POLICY "Assistant can manage own transactions" ON transactions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (role = 'owner' OR (role = 'assistant' AND user_id = auth.uid()))
    )
);

-- Политики для exchange_rates
CREATE POLICY "Everyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Owner can manage exchange rates" ON exchange_rates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
);

-- Политики для audit_log
CREATE POLICY "Owner can view audit log" ON audit_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'owner'
    )
);

-- =====================================================
-- СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ ДЛЯ АНАЛИТИКИ
-- =====================================================

-- Представление статистики дашборда
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM cars) as total_cars,
    (SELECT COUNT(*) FROM cars WHERE status = 'active') as active_cars,
    (SELECT COUNT(*) FROM cars WHERE status = 'sold') as sold_cars,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM transactions WHERE type = 'income') as total_income,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM transactions WHERE type = 'expense' AND NOT is_personal) as total_expenses,
    (SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount_usd WHEN type = 'expense' AND NOT is_personal THEN -amount_usd ELSE 0 END), 0) FROM transactions) as total_profit,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM transactions WHERE type = 'income' AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_income,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM transactions WHERE type = 'expense' AND NOT is_personal AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_expenses,
    (SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount_usd WHEN type = 'expense' AND NOT is_personal THEN -amount_usd ELSE 0 END), 0) FROM transactions WHERE date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_profit;

-- Представление месячной сводки
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    SUM(CASE WHEN type = 'income' THEN amount_usd ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' AND NOT is_personal THEN amount_usd ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'expense' AND is_personal THEN amount_usd ELSE 0 END) as personal_expenses,
    SUM(CASE WHEN type = 'income' THEN amount_usd WHEN type = 'expense' AND NOT is_personal THEN -amount_usd ELSE 0 END) as net_profit,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT car_id) as cars_involved
FROM transactions
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;

-- Представление анализа категорий
CREATE OR REPLACE VIEW category_analysis AS
SELECT 
    type,
    category,
    COUNT(*) as transaction_count,
    SUM(amount_usd) as total_amount,
    AVG(amount_usd) as average_amount,
    MIN(amount_usd) as min_amount,
    MAX(amount_usd) as max_amount,
    MIN(date) as first_transaction,
    MAX(date) as last_transaction
FROM transactions
GROUP BY type, category
ORDER BY total_amount DESC;

-- Представление прибыльности автомобилей
CREATE OR REPLACE VIEW car_profitability AS
SELECT 
    c.id,
    c.vin,
    c.brand,
    c.model,
    c.year,
    c.status,
    c.purchase_price,
    c.sale_price,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount_usd ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' THEN -t.amount_usd ELSE 0 END), 0) as net_profit,
    COUNT(t.id) as transaction_count
FROM cars c
LEFT JOIN transactions t ON c.id = t.car_id
GROUP BY c.id, c.vin, c.brand, c.model, c.year, c.status, c.purchase_price, c.sale_price
ORDER BY net_profit DESC;

-- =====================================================
-- ДОБАВЛЕНИЕ БАЗОВЫХ ДАННЫХ
-- =====================================================

-- Добавляем базовые курсы валют
INSERT INTO exchange_rates (currency, rate_to_usd, date) VALUES
('EUR', 1.08, CURRENT_DATE),
('GBP', 1.25, CURRENT_DATE),
('RUB', 0.011, CURRENT_DATE),
('UZS', 0.000081, CURRENT_DATE),
('KZT', 0.0021, CURRENT_DATE)
ON CONFLICT (currency, date) DO UPDATE SET
rate_to_usd = EXCLUDED.rate_to_usd;

-- =====================================================
-- ЗАВЕРШЕНИЕ МИГРАЦИИ
-- =====================================================

-- Проверяем созданные таблицы
SELECT 'Миграция завершена успешно!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
