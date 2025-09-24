-- View for car profitability analysis
CREATE OR REPLACE VIEW car_profitability AS
SELECT 
    c.id,
    c.vin,
    c.brand,
    c.model,
    c.year,
    c.status,
    c.purchase_price,
    c.purchase_date,
    c.sale_price,
    c.sale_date,
    COALESCE(income.total_income, 0) as total_income,
    COALESCE(expenses.total_expenses, 0) as total_expenses,
    COALESCE(income.total_income, 0) - COALESCE(expenses.total_expenses, 0) as net_profit,
    CASE 
        WHEN c.status = 'sold' AND c.sale_price IS NOT NULL AND c.purchase_price IS NOT NULL 
        THEN c.sale_price - c.purchase_price
        ELSE NULL
    END as sale_profit,
    COALESCE(transactions.transaction_count, 0) as transaction_count
FROM public.cars c
LEFT JOIN (
    SELECT 
        car_id,
        SUM(amount_usd) as total_income
    FROM public.transactions 
    WHERE type = 'income' AND car_id IS NOT NULL
    GROUP BY car_id
) income ON c.id = income.car_id
LEFT JOIN (
    SELECT 
        car_id,
        SUM(amount_usd) as total_expenses
    FROM public.transactions 
    WHERE type = 'expense' AND car_id IS NOT NULL
    GROUP BY car_id
) expenses ON c.id = expenses.car_id
LEFT JOIN (
    SELECT 
        car_id,
        COUNT(*) as transaction_count
    FROM public.transactions 
    WHERE car_id IS NOT NULL
    GROUP BY car_id
) transactions ON c.id = transactions.car_id;

-- View for monthly financial summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'income' AND is_personal = FALSE THEN amount_usd ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' AND is_personal = FALSE THEN amount_usd ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' AND is_personal = FALSE THEN amount_usd ELSE 0 END) - 
    SUM(CASE WHEN type = 'expense' AND is_personal = FALSE THEN amount_usd ELSE 0 END) as net_profit,
    SUM(CASE WHEN type = 'expense' AND is_personal = TRUE THEN amount_usd ELSE 0 END) as personal_expenses,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT car_id) as cars_involved
FROM public.transactions
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- View for transaction categories analysis
CREATE OR REPLACE VIEW category_analysis AS
SELECT 
    type,
    category,
    COUNT(*) as transaction_count,
    SUM(amount_usd) as total_amount,
    AVG(amount_usd) as average_amount,
    MIN(amount_usd) as min_amount,
    MAX(amount_usd) as max_amount,
    DATE_TRUNC('month', MIN(date)) as first_transaction,
    DATE_TRUNC('month', MAX(date)) as last_transaction
FROM public.transactions
GROUP BY type, category
ORDER BY type, total_amount DESC;

-- View for user activity summary
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.type = 'income' THEN t.amount_usd ELSE 0 END) as total_income_added,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount_usd ELSE 0 END) as total_expenses_added,
    MIN(t.date) as first_transaction_date,
    MAX(t.date) as last_transaction_date,
    COUNT(DISTINCT t.car_id) as cars_worked_with
FROM public.users u
LEFT JOIN public.transactions t ON u.id = t.user_id
GROUP BY u.id, u.email, u.full_name, u.role
ORDER BY total_transactions DESC;

-- View for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.cars) as total_cars,
    (SELECT COUNT(*) FROM public.cars WHERE status = 'active') as active_cars,
    (SELECT COUNT(*) FROM public.cars WHERE status = 'sold') as sold_cars,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'income' AND is_personal = FALSE) as total_income,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'expense' AND is_personal = FALSE) as total_expenses,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'income' AND is_personal = FALSE) - 
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'expense' AND is_personal = FALSE) as total_profit,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'income' AND is_personal = FALSE AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_income,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'expense' AND is_personal = FALSE AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_expenses,
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'income' AND is_personal = FALSE AND date >= DATE_TRUNC('month', CURRENT_DATE)) - 
    (SELECT COALESCE(SUM(amount_usd), 0) FROM public.transactions WHERE type = 'expense' AND is_personal = FALSE AND date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_profit,
    (SELECT COUNT(*) FROM public.transactions) as total_transactions,
    (SELECT COUNT(DISTINCT user_id) FROM public.transactions) as active_users;

-- Function to get car transactions with details
CREATE OR REPLACE FUNCTION get_car_transactions(car_uuid UUID)
RETURNS TABLE (
    id UUID,
    type transaction_type,
    category TEXT,
    amount DECIMAL(12,2),
    currency TEXT,
    amount_usd DECIMAL(12,2),
    description TEXT,
    date DATE,
    user_email TEXT,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.type,
        t.category,
        t.amount,
        t.currency,
        t.amount_usd,
        t.description,
        t.date,
        u.email,
        u.full_name,
        t.created_at
    FROM public.transactions t
    JOIN public.users u ON t.user_id = u.id
    WHERE t.car_id = car_uuid
    ORDER BY t.date DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get profit distribution
CREATE OR REPLACE FUNCTION get_profit_distribution()
RETURNS TABLE (
    total_profit DECIMAL(15,2),
    investor_share DECIMAL(15,2),
    owner_share DECIMAL(15,2),
    assistant_share DECIMAL(15,2),
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.total_capital,
        c.investor_share,
        c.owner_share,
        c.assistant_share,
        c.updated_at
    FROM public.capital c
    ORDER BY c.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on views and functions
GRANT SELECT ON car_profitability TO authenticated;
GRANT SELECT ON monthly_summary TO authenticated;
GRANT SELECT ON category_analysis TO authenticated;
GRANT SELECT ON user_activity TO authenticated;
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_car_transactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profit_distribution() TO authenticated;
