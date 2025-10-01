-- Performance indexes for frequent filters

-- Cars by status and purchase_date
CREATE INDEX IF NOT EXISTS idx_au_cars_status_purchase_date ON au_cars(status, purchase_date);

-- Sold cars by sold_date (partial index)
CREATE INDEX IF NOT EXISTS idx_au_cars_sold_date_sold ON au_cars(sold_date) WHERE status = 'sold';

-- Expenses lookup by car and date
CREATE INDEX IF NOT EXISTS idx_au_expenses_car_date ON au_expenses(car_id, occurred_at);

-- Incomes lookup by car and date
CREATE INDEX IF NOT EXISTS idx_au_incomes_car_date ON au_incomes(car_id, occurred_at);

