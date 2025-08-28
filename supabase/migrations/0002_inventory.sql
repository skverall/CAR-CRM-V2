-- Inventory table to track purchased items (cars, parts, etc.)
-- Read-only for public via RLS; inserts should be done via server (service role)

create table if not exists public.inventory (
  id bigserial primary key,
  vin text,
  model text,
  purchase_date date not null default current_date,
  purchase_price numeric(12,2),
  status text not null default 'in_stock', -- in_stock | sold | scrapped
  investor text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_purchase_date on public.inventory(purchase_date);
create index if not exists idx_inventory_status on public.inventory(status);
create index if not exists idx_inventory_vin_trgm on public.inventory using gin (vin gin_trgm_ops);
create index if not exists idx_inventory_model_trgm on public.inventory using gin (model gin_trgm_ops);

alter table public.inventory enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory' and policyname = 'Allow read to all'
  ) then
    create policy "Allow read to all" on public.inventory for select using (true);
  end if;
end $$;

