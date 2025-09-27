-- =====================================================
-- COST AND PROFIT CALCULATION VIEWS
-- These serve as the single source of truth for all UI
-- =====================================================

-- =====================================================
-- 1. CAR COST VIEW - Single source of truth for costs
-- =====================================================

CREATE OR REPLACE VIEW car_cost_view AS
WITH car_base AS (
    SELECT 
        c.id,
        c.org_id,
        c.vin,
        c.make,
        c.model,
        c.status,
        c.purchase_date,
        COALESCE(c.purchase_price_aed, ROUND(c.purchase_price * c.purchase_rate_to_aed * 100)::INTEGER) as purchase_price_aed_fils
    FROM au_cars c
),
direct_expenses AS (
    SELECT 
        e.car_id,
        COALESCE(SUM(e.amount_aed_fils), COALESCE(SUM(ROUND(e.amount * e.rate_to_aed * 100)::INTEGER), 0)) as total_fils
    FROM au_expenses e
    WHERE e.scope = 'car' AND e.car_id IS NOT NULL
    GROUP BY e.car_id
),
allocated_overhead AS (
    SELECT 
        e.car_id,
        COALESCE(SUM(
            CASE 
                WHEN e.allocation_method = 'per_car' THEN 
                    COALESCE(e.amount_aed_fils, ROUND(e.amount * e.rate_to_aed * 100)::INTEGER) * COALESCE(e.allocation_ratio, 1.0)
                WHEN e.allocation_method = 'per_day_on_lot' THEN
                    COALESCE(e.amount_aed_fils, ROUND(e.amount * e.rate_to_aed * 100)::INTEGER) * COALESCE(e.allocation_ratio, 1.0)
                WHEN e.allocation_method = 'per_value_share' THEN
                    COALESCE(e.amount_aed_fils, ROUND(e.amount * e.rate_to_aed * 100)::INTEGER) * COALESCE(e.allocation_ratio, 1.0)
                ELSE 0
            END
        ), 0) as total_fils
    FROM au_expenses e
    WHERE e.scope IN ('overhead', 'personal') AND e.car_id IS NOT NULL
    GROUP BY e.car_id
)
SELECT 
    cb.id,
    cb.org_id,
    cb.vin,
    cb.make,
    cb.model,
    cb.status,
    cb.purchase_date,
    -- Cost components in fils
    cb.purchase_price_aed_fils as purchase_component_fils,
    COALESCE(de.total_fils, 0) as car_expenses_component_fils,
    COALESCE(ao.total_fils, 0) as overhead_component_fils,
    -- Total cost in fils
    cb.purchase_price_aed_fils + COALESCE(de.total_fils, 0) + COALESCE(ao.total_fils, 0) as total_cost_fils,
    -- Cost components in AED (for display)
    ROUND(cb.purchase_price_aed_fils / 100.0, 2) as purchase_component_aed,
    ROUND(COALESCE(de.total_fils, 0) / 100.0, 2) as car_expenses_component_aed,
    ROUND(COALESCE(ao.total_fils, 0) / 100.0, 2) as overhead_component_aed,
    ROUND((cb.purchase_price_aed_fils + COALESCE(de.total_fils, 0) + COALESCE(ao.total_fils, 0)) / 100.0, 2) as total_cost_aed
FROM car_base cb
LEFT JOIN direct_expenses de ON cb.id = de.car_id
LEFT JOIN allocated_overhead ao ON cb.id = ao.car_id;

-- =====================================================
-- 2. CAR PROFIT VIEW - For sold cars only
-- =====================================================

CREATE OR REPLACE VIEW car_profit_view AS
WITH sold_cars AS (
    SELECT 
        c.id,
        c.org_id,
        c.vin,
        c.make,
        c.model,
        c.sold_date,
        c.purchase_date,
        COALESCE(c.sold_price_aed, 0) as sold_price_aed_fils,
        COALESCE(c.commission_aed, 0) as commission_aed_fils,
        -- Calculate days on lot
        CASE 
            WHEN c.sold_date IS NOT NULL AND c.purchase_date IS NOT NULL 
            THEN c.sold_date - c.purchase_date
            ELSE NULL
        END as days_on_lot
    FROM au_cars c
    WHERE c.status = 'sold' AND c.sold_date IS NOT NULL
),
car_costs AS (
    SELECT 
        id,
        total_cost_fils,
        total_cost_aed
    FROM car_cost_view
)
SELECT 
    sc.id,
    sc.org_id,
    sc.vin,
    sc.make,
    sc.model,
    sc.sold_date,
    sc.purchase_date,
    sc.days_on_lot,
    -- Revenue and costs in fils
    sc.sold_price_aed_fils,
    sc.commission_aed_fils,
    cc.total_cost_fils,
    -- Profit calculation in fils
    (sc.sold_price_aed_fils - cc.total_cost_fils - sc.commission_aed_fils) as profit_fils,
    -- Display values in AED
    ROUND(sc.sold_price_aed_fils / 100.0, 2) as sold_price_aed,
    ROUND(sc.commission_aed_fils / 100.0, 2) as commission_aed,
    cc.total_cost_aed,
    ROUND((sc.sold_price_aed_fils - cc.total_cost_fils - sc.commission_aed_fils) / 100.0, 2) as profit_aed,
    -- Margin and ROI calculations
    CASE 
        WHEN sc.sold_price_aed_fils > 0 THEN
            ROUND(((sc.sold_price_aed_fils - cc.total_cost_fils - sc.commission_aed_fils) * 100.0 / sc.sold_price_aed_fils), 2)
        ELSE 0
    END as margin_pct,
    CASE 
        WHEN cc.total_cost_fils > 0 THEN
            ROUND(((sc.sold_price_aed_fils - cc.total_cost_fils - sc.commission_aed_fils) * 100.0 / cc.total_cost_fils), 2)
        ELSE 0
    END as roi_pct
FROM sold_cars sc
JOIN car_costs cc ON sc.id = cc.id;

-- =====================================================
-- 3. INVENTORY VIEW - Current status and aging
-- =====================================================

CREATE OR REPLACE VIEW inventory_view AS
WITH car_status AS (
    SELECT 
        c.id,
        c.org_id,
        c.vin,
        c.make,
        c.model,
        c.status,
        c.purchase_date,
        c.sold_date,
        c.decision_tag,
        -- Days calculations
        CASE 
            WHEN c.status = 'sold' AND c.sold_date IS NOT NULL THEN
                c.sold_date - c.purchase_date
            WHEN c.status != 'sold' THEN
                CURRENT_DATE - c.purchase_date
            ELSE NULL
        END as days_in_inventory,
        CURRENT_DATE - c.purchase_date as age_days
    FROM au_cars c
),
car_costs AS (
    SELECT 
        id,
        total_cost_aed
    FROM car_cost_view
)
SELECT 
    cs.id,
    cs.org_id,
    cs.vin,
    cs.make,
    cs.model,
    cs.status,
    cs.purchase_date,
    cs.sold_date,
    cs.decision_tag,
    cs.days_in_inventory,
    cs.age_days,
    cc.total_cost_aed,
    -- Status categorization
    CASE 
        WHEN cs.status IN ('in_transit', 'for_sale') AND cs.age_days > 30 THEN 'stale'
        WHEN cs.status IN ('in_transit', 'for_sale') AND cs.age_days > 60 THEN 'very_stale'
        WHEN cs.status = 'sold' THEN 'sold'
        WHEN cs.status = 'archived' THEN 'archived'
        ELSE 'active'
    END as inventory_status
FROM car_status cs
JOIN car_costs cc ON cs.id = cc.id;

-- =====================================================
-- 4. UPDATED PROFIT CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION au_car_profit_aed_v2(p_car_id UUID)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT profit_aed
    FROM car_profit_view
    WHERE id = p_car_id;
$$;

-- =====================================================
-- 5. COST CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION au_car_cost_aed(p_car_id UUID)
RETURNS DECIMAL(12,2)
LANGUAGE SQL
STABLE
AS $$
    SELECT total_cost_aed
    FROM car_cost_view
    WHERE id = p_car_id;
$$;
