-- Add rate_locked to deal_snapshots to explicitly freeze FX and totals on closing a sale
ALTER TABLE deal_snapshots
  ADD COLUMN IF NOT EXISTS rate_locked BOOLEAN NOT NULL DEFAULT false;

-- Optional: ensure quick lookup by car
CREATE INDEX IF NOT EXISTS idx_deal_snapshots_car_id ON deal_snapshots(car_id);

