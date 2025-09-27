-- =====================================================
-- OVERHEAD DISTRIBUTION SYSTEM
-- Handles allocation of overhead/personal expenses to cars
-- =====================================================

-- =====================================================
-- 1. OVERHEAD ALLOCATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION allocate_overhead_expenses(
    p_org_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    expense_id UUID,
    car_id UUID,
    allocation_ratio DECIMAL(10,4),
    allocated_amount_fils INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rule RECORD;
    v_expense RECORD;
    v_total_cars INTEGER;
    v_total_days INTEGER;
    v_total_value BIGINT;
    v_car RECORD;
    v_car_days INTEGER;
    v_car_ratio DECIMAL(10,4);
BEGIN
    -- Set default date range if not provided
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    -- Get active overhead rule for the organization
    SELECT * INTO v_rule
    FROM overhead_rules r
    WHERE r.org_id = p_org_id
      AND r.active_from <= p_end_date
      AND (r.active_to IS NULL OR r.active_to >= p_start_date)
    ORDER BY r.active_from DESC
    LIMIT 1;

    IF NOT FOUND THEN
        -- Default to per_car method if no rule exists
        v_rule.method := 'per_car';
        v_rule.default_ratio := 1.0;
    END IF;

    -- Process each overhead/personal expense in the date range
    FOR v_expense IN
        SELECT e.id, e.car_id, e.occurred_at, 
               COALESCE(e.amount_aed_fils, ROUND(e.amount * e.rate_to_aed * 100)::INTEGER) as amount_fils
        FROM au_expenses e
        WHERE e.org_id = p_org_id
          AND e.scope IN ('overhead', 'personal')
          AND e.occurred_at BETWEEN p_start_date AND p_end_date
          AND (e.allocation_method IS NULL OR e.allocation_method = 'none')
    LOOP
        -- Calculate allocation based on method
        CASE v_rule.method
            WHEN 'per_car' THEN
                -- Equal distribution among active cars
                SELECT COUNT(*) INTO v_total_cars
                FROM au_cars c
                WHERE c.org_id = p_org_id
                  AND c.status NOT IN ('sold', 'archived')
                  AND c.purchase_date <= v_expense.occurred_at;

                IF v_total_cars > 0 THEN
                    FOR v_car IN
                        SELECT c.id
                        FROM au_cars c
                        WHERE c.org_id = p_org_id
                          AND c.status NOT IN ('sold', 'archived')
                          AND c.purchase_date <= v_expense.occurred_at
                    LOOP
                        v_car_ratio := 1.0 / v_total_cars;
                        
                        RETURN QUERY SELECT 
                            v_expense.id,
                            v_car.id,
                            v_car_ratio,
                            ROUND(v_expense.amount_fils * v_car_ratio)::INTEGER;
                    END LOOP;
                END IF;

            WHEN 'per_day_on_lot' THEN
                -- Distribution based on days each car was in inventory
                SELECT SUM(
                    CASE 
                        WHEN c.sold_date IS NOT NULL AND c.sold_date < v_expense.occurred_at THEN 0
                        WHEN c.purchase_date > v_expense.occurred_at THEN 0
                        ELSE LEAST(v_expense.occurred_at - c.purchase_date + 1, 
                                  COALESCE(c.sold_date, v_expense.occurred_at) - c.purchase_date + 1)
                    END
                ) INTO v_total_days
                FROM au_cars c
                WHERE c.org_id = p_org_id
                  AND c.purchase_date <= v_expense.occurred_at;

                IF v_total_days > 0 THEN
                    FOR v_car IN
                        SELECT c.id,
                               CASE 
                                   WHEN c.sold_date IS NOT NULL AND c.sold_date < v_expense.occurred_at THEN 0
                                   WHEN c.purchase_date > v_expense.occurred_at THEN 0
                                   ELSE LEAST(v_expense.occurred_at - c.purchase_date + 1, 
                                             COALESCE(c.sold_date, v_expense.occurred_at) - c.purchase_date + 1)
                               END as car_days
                        FROM au_cars c
                        WHERE c.org_id = p_org_id
                          AND c.purchase_date <= v_expense.occurred_at
                    LOOP
                        IF v_car.car_days > 0 THEN
                            v_car_ratio := v_car.car_days::DECIMAL / v_total_days;
                            
                            RETURN QUERY SELECT 
                                v_expense.id,
                                v_car.id,
                                v_car_ratio,
                                ROUND(v_expense.amount_fils * v_car_ratio)::INTEGER;
                        END IF;
                    END LOOP;
                END IF;

            WHEN 'per_value_share' THEN
                -- Distribution based on purchase value of cars
                SELECT SUM(COALESCE(c.purchase_price_aed, ROUND(c.purchase_price * c.purchase_rate_to_aed * 100)::INTEGER)) 
                INTO v_total_value
                FROM au_cars c
                WHERE c.org_id = p_org_id
                  AND c.purchase_date <= v_expense.occurred_at
                  AND (c.sold_date IS NULL OR c.sold_date >= v_expense.occurred_at);

                IF v_total_value > 0 THEN
                    FOR v_car IN
                        SELECT c.id,
                               COALESCE(c.purchase_price_aed, ROUND(c.purchase_price * c.purchase_rate_to_aed * 100)::INTEGER) as car_value
                        FROM au_cars c
                        WHERE c.org_id = p_org_id
                          AND c.purchase_date <= v_expense.occurred_at
                          AND (c.sold_date IS NULL OR c.sold_date >= v_expense.occurred_at)
                    LOOP
                        v_car_ratio := v_car.car_value::DECIMAL / v_total_value;
                        
                        RETURN QUERY SELECT 
                            v_expense.id,
                            v_car.id,
                            v_car_ratio,
                            ROUND(v_expense.amount_fils * v_car_ratio)::INTEGER;
                    END LOOP;
                END IF;
        END CASE;
    END LOOP;
END;
$$;

-- =====================================================
-- 2. APPLY OVERHEAD ALLOCATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION apply_overhead_allocation(
    p_org_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_allocation RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    -- Apply allocations calculated by the allocation function
    FOR v_allocation IN
        SELECT * FROM allocate_overhead_expenses(p_org_id, p_start_date, p_end_date)
    LOOP
        -- Update the expense with allocation details
        UPDATE au_expenses
        SET 
            car_id = v_allocation.car_id,
            allocation_method = (
                SELECT method 
                FROM overhead_rules r
                WHERE r.org_id = p_org_id
                  AND r.active_from <= CURRENT_DATE
                  AND (r.active_to IS NULL OR r.active_to >= CURRENT_DATE)
                ORDER BY r.active_from DESC
                LIMIT 1
            ),
            allocation_ratio = v_allocation.allocation_ratio,
            updated_at = NOW()
        WHERE id = v_allocation.expense_id;

        v_updated_count := v_updated_count + 1;
    END LOOP;

    RETURN v_updated_count;
END;
$$;

-- =====================================================
-- 3. TRIGGER FOR AUTOMATIC ALLOCATION
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_allocate_overhead()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only process overhead/personal expenses
    IF NEW.scope IN ('overhead', 'personal') AND NEW.org_id IS NOT NULL THEN
        -- Apply allocation for this specific expense
        PERFORM apply_overhead_allocation(NEW.org_id, NEW.occurred_at, NEW.occurred_at);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_allocate_overhead ON au_expenses;
CREATE TRIGGER trg_auto_allocate_overhead
    AFTER INSERT ON au_expenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_allocate_overhead();

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Get current allocation rule for organization
CREATE OR REPLACE FUNCTION get_current_overhead_rule(p_org_id UUID)
RETURNS TABLE (
    method TEXT,
    default_ratio DECIMAL(10,4),
    active_from DATE,
    active_to DATE
)
LANGUAGE SQL
STABLE
AS $$
    SELECT r.method, r.default_ratio, r.active_from, r.active_to
    FROM overhead_rules r
    WHERE r.org_id = p_org_id
      AND r.active_from <= CURRENT_DATE
      AND (r.active_to IS NULL OR r.active_to >= CURRENT_DATE)
    ORDER BY r.active_from DESC
    LIMIT 1;
$$;

-- Preview allocation without applying
CREATE OR REPLACE FUNCTION preview_overhead_allocation(
    p_org_id UUID,
    p_expense_amount_aed DECIMAL(12,2),
    p_expense_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    car_vin TEXT,
    car_make TEXT,
    car_model TEXT,
    allocation_ratio DECIMAL(10,4),
    allocated_amount_aed DECIMAL(12,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_amount_fils INTEGER;
BEGIN
    v_amount_fils := ROUND(p_expense_amount_aed * 100)::INTEGER;

    RETURN QUERY
    WITH temp_expense AS (
        SELECT
            gen_random_uuid() as id,
            p_expense_date as occurred_at,
            v_amount_fils as amount_fils
    ),
    allocations AS (
        SELECT
            a.car_id,
            a.allocation_ratio,
            a.allocated_amount_fils
        FROM temp_expense te,
             LATERAL allocate_overhead_expenses(p_org_id, p_expense_date, p_expense_date) a
    )
    SELECT
        c.vin,
        c.make,
        c.model,
        a.allocation_ratio,
        ROUND(a.allocated_amount_fils / 100.0, 2)
    FROM allocations a
    JOIN au_cars c ON a.car_id = c.id
    ORDER BY a.allocation_ratio DESC;
END;
$$;

-- =====================================================
-- 5. BATCH PROCESSING FOR EXISTING DATA
-- =====================================================

-- Reprocess all unallocated overhead expenses
CREATE OR REPLACE FUNCTION reprocess_all_overhead_allocations(p_org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_updated INTEGER := 0;
    v_month_start DATE;
    v_month_end DATE;
BEGIN
    -- Reset existing allocations
    UPDATE au_expenses
    SET
        car_id = NULL,
        allocation_method = 'none',
        allocation_ratio = NULL
    WHERE org_id = p_org_id
      AND scope IN ('overhead', 'personal');

    -- Process month by month to avoid memory issues
    FOR v_month_start IN
        SELECT DISTINCT DATE_TRUNC('month', occurred_at)::DATE
        FROM au_expenses
        WHERE org_id = p_org_id AND scope IN ('overhead', 'personal')
        ORDER BY 1
    LOOP
        v_month_end := (v_month_start + INTERVAL '1 month - 1 day')::DATE;

        v_total_updated := v_total_updated +
            apply_overhead_allocation(p_org_id, v_month_start, v_month_end);
    END LOOP;

    RETURN v_total_updated;
END;
$$;
