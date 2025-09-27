-- Comprehensive Car CRM Database Schema Migration
-- This extends the existing au_* tables to meet the full requirements

-- =====================================================
-- 1. ORGANIZATIONS AND USERS
-- =====================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User organizations (many-to-many)
CREATE TABLE IF NOT EXISTS user_orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

-- =====================================================
-- 2. ENHANCED CARS TABLE
-- =====================================================

-- Add missing fields to existing au_cars table
ALTER TABLE au_cars 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES orgs(id),
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS sold_price_aed INTEGER, -- in fils
ADD COLUMN IF NOT EXISTS sold_date DATE,
ADD COLUMN IF NOT EXISTS commission_aed INTEGER DEFAULT 0, -- in fils
ADD COLUMN IF NOT EXISTS decision_tag TEXT CHECK (decision_tag IN ('take', 'skip')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update status enum to match requirements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'car_status_new') THEN
        CREATE TYPE car_status_new AS ENUM ('in_transit', 'for_sale', 'reserved', 'sold', 'archived');
    END IF;
END $$;

-- Convert purchase_price to fils (integer)
ALTER TABLE au_cars 
ADD COLUMN IF NOT EXISTS purchase_price_aed INTEGER; -- in fils

-- Update existing data to fils
UPDATE au_cars 
SET purchase_price_aed = ROUND(purchase_price * purchase_rate_to_aed * 100)::INTEGER
WHERE purchase_price_aed IS NULL;

-- =====================================================
-- 3. ENHANCED EXPENSES TABLE  
-- =====================================================

-- Add new fields to au_expenses
ALTER TABLE au_expenses
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES orgs(id),
ADD COLUMN IF NOT EXISTS scope TEXT CHECK (scope IN ('car', 'overhead', 'personal')),
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('purchase', 'transport', 'repair', 'detailing', 'ads', 'fees', 'fuel', 'parking', 'rent', 'salary', 'other')),
ADD COLUMN IF NOT EXISTS attachment_id UUID,
ADD COLUMN IF NOT EXISTS allocation_method TEXT CHECK (allocation_method IN ('none', 'per_car', 'per_day_on_lot', 'per_value_share')),
ADD COLUMN IF NOT EXISTS allocation_ratio DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Convert amount to fils
ALTER TABLE au_expenses
ADD COLUMN IF NOT EXISTS amount_aed_fils INTEGER; -- in fils

UPDATE au_expenses 
SET amount_aed_fils = ROUND(amount * rate_to_aed * 100)::INTEGER
WHERE amount_aed_fils IS NULL;

-- Migrate existing data to new structure
UPDATE au_expenses 
SET scope = CASE 
    WHEN car_id IS NOT NULL THEN 'car'
    WHEN is_personal_or_general = true THEN 'overhead'
    ELSE 'car'
END,
category = CASE 
    WHEN expense_type = 'shipping' THEN 'transport'
    WHEN expense_type = 'repair' THEN 'repair'
    WHEN expense_type = 'office' THEN 'rent'
    ELSE 'other'
END
WHERE scope IS NULL;

-- =====================================================
-- 4. DEALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id),
    car_id UUID NOT NULL REFERENCES au_cars(id),
    buyer_name TEXT,
    channel TEXT,
    sold_price_aed INTEGER NOT NULL, -- in fils
    sold_date DATE NOT NULL,
    commission_aed INTEGER DEFAULT 0, -- in fils
    agent_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. OVERHEAD ALLOCATION RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS overhead_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id),
    method TEXT NOT NULL CHECK (method IN ('per_car', 'per_day_on_lot', 'per_value_share')),
    default_ratio DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    active_from DATE NOT NULL,
    active_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (active_to IS NULL OR active_to > active_from)
);

-- =====================================================
-- 6. DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id),
    car_id UUID REFERENCES au_cars(id),
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER,
    original_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INVESTORS AND SHARES (if needed)
-- =====================================================

CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id),
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES investors(id),
    car_id UUID NOT NULL REFERENCES au_cars(id),
    share_pct DECIMAL(5,2) NOT NULL CHECK (share_pct > 0 AND share_pct <= 100),
    payouts_total_aed INTEGER DEFAULT 0, -- in fils
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(investor_id, car_id)
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Cars indexes
CREATE INDEX IF NOT EXISTS idx_cars_vin ON au_cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_status ON au_cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_purchase_date ON au_cars(purchase_date);
CREATE INDEX IF NOT EXISTS idx_cars_sold_date ON au_cars(sold_date);
CREATE INDEX IF NOT EXISTS idx_cars_org_id ON au_cars(org_id);

-- Expenses indexes  
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON au_expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_car_id ON au_expenses(car_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON au_expenses(occurred_at);
CREATE INDEX IF NOT EXISTS idx_expenses_scope ON au_expenses(scope);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_car_id ON deals(car_id);
CREATE INDEX IF NOT EXISTS idx_deals_sold_date ON deals(sold_date);
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(org_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_car_id ON documents(car_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);

-- User orgs indexes
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_orgs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_orgs(org_id);
