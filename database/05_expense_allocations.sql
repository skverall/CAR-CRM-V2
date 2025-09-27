-- =====================================================
-- EXPENSE ALLOCATIONS TABLE
-- Holds per-car allocations for overhead/personal expenses
-- =====================================================

CREATE TABLE IF NOT EXISTS au_expense_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES au_expenses(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES au_cars(id) ON DELETE CASCADE,
  allocation_method TEXT NOT NULL CHECK (allocation_method IN ('per_car','per_day_on_lot','per_value_share')),
  allocation_ratio DECIMAL(10,4) NOT NULL,
  allocated_amount_fils INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, car_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_allocations_org_id ON au_expense_allocations(org_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocations_expense_id ON au_expense_allocations(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocations_car_id ON au_expense_allocations(car_id);

