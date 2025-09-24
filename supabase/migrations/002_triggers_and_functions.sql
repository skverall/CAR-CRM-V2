-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate USD amount based on exchange rate
CREATE OR REPLACE FUNCTION calculate_usd_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- If currency is USD, amount_usd equals amount
    IF NEW.currency = 'USD' THEN
        NEW.amount_usd = NEW.amount;
        NEW.exchange_rate = 1.0;
    ELSE
        -- Get the latest exchange rate for the currency
        SELECT rate_to_usd INTO NEW.exchange_rate
        FROM public.exchange_rates
        WHERE currency = NEW.currency
        AND date <= NEW.date
        ORDER BY date DESC
        LIMIT 1;
        
        -- If no exchange rate found, default to 1.0
        IF NEW.exchange_rate IS NULL THEN
            NEW.exchange_rate = 1.0;
        END IF;
        
        NEW.amount_usd = NEW.amount * NEW.exchange_rate;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update capital after transaction changes
CREATE OR REPLACE FUNCTION update_capital()
RETURNS TRIGGER AS $$
DECLARE
    total_income DECIMAL(15,2);
    total_expenses DECIMAL(15,2);
    net_profit DECIMAL(15,2);
    investor_share DECIMAL(15,2);
    remaining_profit DECIMAL(15,2);
    owner_share DECIMAL(15,2);
    assistant_share DECIMAL(15,2);
BEGIN
    -- Calculate total income and expenses in USD
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_usd ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_usd ELSE 0 END), 0)
    INTO total_income, total_expenses
    FROM public.transactions
    WHERE is_personal = FALSE;
    
    -- Calculate net profit
    net_profit = total_income - total_expenses;
    
    -- Calculate profit distribution
    IF net_profit > 0 THEN
        investor_share = net_profit * 0.5;
        remaining_profit = net_profit - investor_share;
        owner_share = remaining_profit * 0.5;
        assistant_share = remaining_profit * 0.5;
    ELSE
        investor_share = 0;
        owner_share = 0;
        assistant_share = 0;
    END IF;
    
    -- Update capital table
    UPDATE public.capital SET
        total_capital = net_profit,
        investor_share = investor_share,
        owner_share = owner_share,
        assistant_share = assistant_share,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for USD amount calculation
CREATE TRIGGER calculate_transaction_usd_amount 
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION calculate_usd_amount();

-- Create triggers for capital updates
CREATE TRIGGER update_capital_on_transaction_insert
    AFTER INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_capital();

CREATE TRIGGER update_capital_on_transaction_update
    AFTER UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_capital();

CREATE TRIGGER update_capital_on_transaction_delete
    AFTER DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_capital();

-- Create audit triggers
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_cars AFTER INSERT OR UPDATE OR DELETE ON public.cars
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
