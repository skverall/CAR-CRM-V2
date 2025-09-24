-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'investor', 'assistant');
CREATE TYPE car_status AS ENUM ('active', 'sold');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'assistant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cars table
CREATE TABLE public.cars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vin TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
    status car_status NOT NULL DEFAULT 'active',
    purchase_price DECIMAL(12,2),
    purchase_date DATE,
    sale_price DECIMAL(12,2),
    sale_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_vin_length CHECK (LENGTH(vin) = 17),
    CONSTRAINT valid_sale_data CHECK (
        (status = 'sold' AND sale_price IS NOT NULL AND sale_date IS NOT NULL) OR
        (status = 'active' AND sale_price IS NULL AND sale_date IS NULL)
    )
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1.0,
    amount_usd DECIMAL(12,2) NOT NULL CHECK (amount_usd > 0),
    description TEXT,
    date DATE NOT NULL,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_personal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Capital tracking table
CREATE TABLE public.capital (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    total_capital DECIMAL(15,2) NOT NULL DEFAULT 0,
    investor_share DECIMAL(15,2) NOT NULL DEFAULT 0,
    owner_share DECIMAL(15,2) NOT NULL DEFAULT 0,
    assistant_share DECIMAL(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange rates table
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    currency TEXT NOT NULL,
    rate_to_usd DECIMAL(10,6) NOT NULL CHECK (rate_to_usd > 0),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for currency and date
    UNIQUE(currency, date)
);

-- Audit log table
CREATE TABLE public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial capital record
INSERT INTO public.capital (total_capital, investor_share, owner_share, assistant_share)
VALUES (0, 0, 0, 0);

-- Insert common exchange rates
INSERT INTO public.exchange_rates (currency, rate_to_usd, date) VALUES
('USD', 1.0, CURRENT_DATE),
('EUR', 0.85, CURRENT_DATE),
('RUB', 0.011, CURRENT_DATE),
('UZS', 0.000081, CURRENT_DATE);

-- Create indexes for better performance
CREATE INDEX idx_cars_vin ON public.cars(vin);
CREATE INDEX idx_cars_status ON public.cars(status);
CREATE INDEX idx_transactions_car_id ON public.transactions(car_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_exchange_rates_currency_date ON public.exchange_rates(currency, date);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
