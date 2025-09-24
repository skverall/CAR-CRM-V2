-- Enhanced profit distribution functions and views

-- Function to get profit distribution for a specific period
CREATE OR REPLACE FUNCTION get_profit_distribution_by_period(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_income DECIMAL(15,2),
    total_business_expenses DECIMAL(15,2),
    total_personal_expenses DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    investor_share DECIMAL(15,2),
    owner_share DECIMAL(15,2),
    assistant_share DECIMAL(15,2),
    transaction_count INTEGER
) AS $$
DECLARE
    income DECIMAL(15,2);
    business_expenses DECIMAL(15,2);
    personal_expenses DECIMAL(15,2);
    profit DECIMAL(15,2);
    tx_count INTEGER;
BEGIN
    -- Build the query with optional date filters
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' AND NOT is_personal THEN amount_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' AND is_personal THEN amount_usd ELSE 0 END), 0),
        COUNT(*)
    INTO income, business_expenses, personal_expenses, tx_count
    FROM public.transactions
    WHERE (start_date IS NULL OR date >= start_date)
      AND (end_date IS NULL OR date <= end_date);
    
    -- Calculate net profit
    profit = income - business_expenses;
    
    -- Return the results
    RETURN QUERY SELECT 
        income,
        business_expenses,
        personal_expenses,
        profit,
        CASE WHEN profit > 0 THEN ROUND(profit * 0.5, 2) ELSE 0 END,
        CASE WHEN profit > 0 THEN ROUND(profit * 0.25, 2) ELSE 0 END,
        CASE WHEN profit > 0 THEN ROUND(profit * 0.25, 2) ELSE 0 END,
        tx_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly profit distribution summary
CREATE OR REPLACE FUNCTION get_monthly_profit_summary(
    months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
    month TEXT,
    total_income DECIMAL(15,2),
    total_business_expenses DECIMAL(15,2),
    total_personal_expenses DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    investor_share DECIMAL(15,2),
    owner_share DECIMAL(15,2),
    assistant_share DECIMAL(15,2),
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(t.date, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' AND NOT t.is_personal THEN t.amount_usd ELSE 0 END), 0) as total_business_expenses,
        COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.is_personal THEN t.amount_usd ELSE 0 END), 0) as total_personal_expenses,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) as net_profit,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.5, 2)
            ELSE 0 
        END as investor_share,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.25, 2)
            ELSE 0 
        END as owner_share,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.25, 2)
            ELSE 0 
        END as assistant_share,
        COUNT(*)::INTEGER as transaction_count
    FROM public.transactions t
    WHERE t.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' * months_back
    GROUP BY TO_CHAR(t.date, 'YYYY-MM')
    ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get profit distribution by car
CREATE OR REPLACE FUNCTION get_car_profit_distribution()
RETURNS TABLE (
    car_id UUID,
    car_vin TEXT,
    car_brand TEXT,
    car_model TEXT,
    car_year INTEGER,
    total_income DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    investor_share DECIMAL(15,2),
    owner_share DECIMAL(15,2),
    assistant_share DECIMAL(15,2),
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as car_id,
        c.vin as car_vin,
        c.brand as car_brand,
        c.model as car_model,
        c.year as car_year,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' AND NOT t.is_personal THEN t.amount_usd ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) as net_profit,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.5, 2)
            ELSE 0 
        END as investor_share,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.25, 2)
            ELSE 0 
        END as owner_share,
        CASE 
            WHEN COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) > 0 
            THEN ROUND(COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount_usd WHEN t.type = 'expense' AND NOT t.is_personal THEN -t.amount_usd ELSE 0 END), 0) * 0.25, 2)
            ELSE 0 
        END as assistant_share,
        COUNT(t.id)::INTEGER as transaction_count
    FROM public.cars c
    LEFT JOIN public.transactions t ON c.id = t.car_id
    GROUP BY c.id, c.vin, c.brand, c.model, c.year
    HAVING COUNT(t.id) > 0
    ORDER BY net_profit DESC;
END;
$$ LANGUAGE plpgsql;

-- Enhanced view for capital history tracking
CREATE OR REPLACE VIEW capital_history AS
SELECT 
    al.id,
    al.user_id,
    al.action,
    al.created_at,
    al.old_values,
    al.new_values,
    u.email as user_email,
    u.full_name as user_name,
    u.role as user_role,
    (al.new_values->>'total_capital')::DECIMAL(15,2) as new_total_capital,
    (al.new_values->>'investor_share')::DECIMAL(15,2) as new_investor_share,
    (al.new_values->>'owner_share')::DECIMAL(15,2) as new_owner_share,
    (al.new_values->>'assistant_share')::DECIMAL(15,2) as new_assistant_share,
    (al.old_values->>'total_capital')::DECIMAL(15,2) as old_total_capital,
    (al.old_values->>'investor_share')::DECIMAL(15,2) as old_investor_share,
    (al.old_values->>'owner_share')::DECIMAL(15,2) as old_owner_share,
    (al.old_values->>'assistant_share')::DECIMAL(15,2) as old_assistant_share
FROM public.audit_log al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.table_name = 'capital'
ORDER BY al.created_at DESC;

-- Grant permissions on new functions and views
GRANT EXECUTE ON FUNCTION get_profit_distribution_by_period(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_profit_summary(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_car_profit_distribution() TO authenticated;
GRANT SELECT ON capital_history TO authenticated;

-- Create indexes for better performance on audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_created_at ON public.audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON public.transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_transactions_car_date ON public.transactions(car_id, date) WHERE car_id IS NOT NULL;
