-- Enable required extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type vehicle_status as enum ('On Sale','Sold','Reserved','In Transit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cash_reference_type as enum ('expense','vehicle_purchase','vehicle_sale','extra_income','manual_adjustment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payout_type as enum ('returned_capital','profit_share','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attachment_kind as enum ('photo','invoice','insurance','rta','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('owner','manager','analyst','viewer');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists investors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  initial_investment numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  vin text unique,
  make text not null,
  model text not null,
  year int not null,
  trim text,
  spec text,
  color text,
  tire_year int,
  status vehicle_status not null default 'On Sale',
  date_purchased date not null,
  investor_id uuid not null references investors(id) on delete restrict,
  purchase_price numeric(12,2) not null,
  total_cost numeric(12,2) not null default 0,
  list_price numeric(12,2),
  sold_price numeric(12,2),
  date_sold date,
  market_avg numeric(12,2),
  roi numeric(8,5) generated always as ((sold_price - total_cost) / nullif(total_cost,0)) stored,
  market_margin numeric(8,5) generated always as ((market_avg - total_cost) / nullif(total_cost,0)) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_vehicles_updated_at on vehicles;
create trigger trg_vehicles_updated_at before update on vehicles
for each row execute function set_updated_at();

create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_vehicles_investor on vehicles(investor_id);
create index if not exists idx_vehicles_makemodelyear on vehicles(make, model, year);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  investor_id uuid references investors(id) on delete set null,
  date date not null,
  description text,
  amount numeric(12,2) not null,
  category text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_expenses_updated_at on expenses;
create trigger trg_expenses_updated_at before update on expenses
for each row execute function set_updated_at();

create index if not exists idx_expenses_date on expenses(date);
create index if not exists idx_expenses_vehicle on expenses(vehicle_id);

create table if not exists extra_income (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null,
  amount numeric(12,2) not null,
  notes text,
  investor_id uuid references investors(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists cash_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  balance numeric(12,2) not null default 0
);

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  account_id uuid not null references cash_accounts(id) on delete restrict,
  amount numeric(12,2) not null,
  reference_type cash_reference_type not null,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_cash_movements_account on cash_movements(account_id);
create index if not exists idx_cash_movements_date on cash_movements(date);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  investor_id uuid not null references investors(id) on delete restrict,
  amount numeric(12,2) not null,
  type payout_type not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  expense_id uuid references expenses(id) on delete set null,
  url text not null,
  kind attachment_kind not null,
  uploaded_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  supabase_user_id uuid primary key,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  diff jsonb
);

create table if not exists import_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sheet text not null,
  row jsonb,
  error text not null
);

-- Seed default cash accounts
insert into cash_accounts(name) values ('Money Bank') on conflict do nothing;
insert into cash_accounts(name) values ('Money Cash') on conflict do nothing;

-- Helper: default cash account id
create or replace function get_default_cash_account_id()
returns uuid language sql stable as $$
  select id from cash_accounts where name = 'Money Bank'
  union all
  select id from cash_accounts limit 1
  limit 1;
$$;

-- Update vehicles.total_cost on expenses changes
create or replace function recalc_vehicle_total_cost(p_vehicle uuid)
returns void language sql as $$
  update vehicles v set total_cost = coalesce((
    select sum(amount) from expenses e where e.vehicle_id = v.id
  ),0)
  where v.id = p_vehicle;
$$;

create or replace function trg_expense_recalc_total()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') and new.vehicle_id is not null then
    perform recalc_vehicle_total_cost(new.vehicle_id);
  end if;
  if tg_op = 'UPDATE' and old.vehicle_id is distinct from new.vehicle_id and old.vehicle_id is not null then
    perform recalc_vehicle_total_cost(old.vehicle_id);
  end if;
  if tg_op = 'DELETE' and old.vehicle_id is not null then
    perform recalc_vehicle_total_cost(old.vehicle_id);
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_expenses_recalc on expenses;
create trigger trg_expenses_recalc after insert or update or delete on expenses
for each row execute function trg_expense_recalc_total();

-- Auto cash movements
create or replace function ensure_default_account() returns uuid language plpgsql as $$
declare acc uuid;
begin
  select get_default_cash_account_id() into acc;
  return acc;
end $$;

create or replace function trg_after_vehicle_insert()
returns trigger language plpgsql as $$
declare acc uuid := ensure_default_account();
begin
  insert into cash_movements(date, account_id, amount, reference_type, reference_id, notes)
  values (new.date_purchased, acc, -new.purchase_price, 'vehicle_purchase', new.id, 'Auto movement: vehicle purchase');
  return new;
end $$;

drop trigger if exists trg_vehicle_insert_cash on vehicles;
create trigger trg_vehicle_insert_cash after insert on vehicles
for each row execute function trg_after_vehicle_insert();

create or replace function trg_after_vehicle_update_sold()
returns trigger language plpgsql as $$
declare acc uuid := ensure_default_account();
begin
  if (new.status = 'Sold') and (old.status is distinct from 'Sold') then
    if new.sold_price is null or new.date_sold is null then
      raise exception 'Sold vehicle must have sold_price and date_sold';
    end if;
    insert into cash_movements(date, account_id, amount, reference_type, reference_id, notes)
    values (new.date_sold, acc, new.sold_price, 'vehicle_sale', new.id, 'Auto movement: vehicle sale');
  end if;
  return new;
end $$;

drop trigger if exists trg_vehicle_update_cash on vehicles;
create trigger trg_vehicle_update_cash after update on vehicles
for each row execute function trg_after_vehicle_update_sold();

create or replace function trg_after_expense_insert()
returns trigger language plpgsql as $$
declare acc uuid := ensure_default_account();
begin
  insert into cash_movements(date, account_id, amount, reference_type, reference_id, notes)
  values (new.date, acc, -new.amount, 'expense', new.id, 'Auto movement: expense');
  return new;
end $$;

drop trigger if exists trg_expense_insert_cash on expenses;
create trigger trg_expense_insert_cash after insert on expenses
for each row execute function trg_after_expense_insert();

create or replace function trg_after_extraincome_insert()
returns trigger language plpgsql as $$
declare acc uuid := ensure_default_account();
begin
  insert into cash_movements(date, account_id, amount, reference_type, reference_id, notes)
  values (new.date, acc, new.amount, 'extra_income', new.id, 'Auto movement: extra income');
  return new;
end $$;

drop trigger if exists trg_extraincome_insert_cash on extra_income;
create trigger trg_extraincome_insert_cash after insert on extra_income
for each row execute function trg_after_extraincome_insert();

create or replace function trg_after_payout_insert()
returns trigger language plpgsql as $$
declare acc uuid := ensure_default_account();
begin
  insert into cash_movements(date, account_id, amount, reference_type, reference_id, notes)
  values (new.date, acc, -new.amount, 'manual_adjustment', new.id, 'Auto movement: payout');
  return new;
end $$;

drop trigger if exists trg_payout_insert_cash on payouts;
create trigger trg_payout_insert_cash after insert on payouts
for each row execute function trg_after_payout_insert();

-- Views
create or replace view vw_vehicle_finance as
select v.id,
       v.vin,
       v.make,
       v.model,
       v.year,
       v.status,
       v.date_purchased,
       v.list_price,
       v.sold_price,
       v.date_sold,
       v.purchase_price,
       coalesce((select sum(e.amount) from expenses e where e.vehicle_id = v.id), 0) as total_cost,
       v.roi,
       v.market_avg,
       v.market_margin,
       i.name as investor_name,
       v.investor_id
from vehicles v
join investors i on i.id = v.investor_id;

create or replace view vw_cash_account_balances as
select a.id, a.name,
       coalesce((select sum(m.amount) from cash_movements m where m.account_id = a.id), 0)::numeric(12,2) as balance
from cash_accounts a;

create or replace view vw_investor_positions as
with vehicle_costs as (
  select v.investor_id,
         v.id as vehicle_id,
         v.purchase_price,
         coalesce((select sum(e.amount) from expenses e where e.vehicle_id = v.id), 0) as total_cost,
         v.sold_price,
         v.date_sold
  from vehicles v
),
sold as (
  select investor_id,
         sum(coalesce(sold_price,0) - total_cost - purchase_price)::numeric(12,2) as realized_pl
  from vehicle_costs
  where date_sold is not null
  group by investor_id
),
in_stock as (
  select investor_id,
         sum(purchase_price + total_cost - coalesce(sold_price,0))::numeric(12,2) as capital_in_stock
  from vehicle_costs
  where date_sold is null
  group by investor_id
),
returned as (
  select investor_id,
         sum(case when type = 'returned_capital' then abs(amount) else 0 end)::numeric(12,2) as returned_capital
  from payouts
  group by investor_id
),
exinc as (
  select investor_id, sum(amount)::numeric(12,2) as extra_income
  from extra_income where investor_id is not null
  group by investor_id
),
other_exp as (
  select investor_id, sum(amount)::numeric(12,2) as other_expenses
  from expenses where vehicle_id is null and investor_id is not null
  group by investor_id
),
cash as (
  select
    (select balance from vw_cash_account_balances where name = 'Money Bank') as money_bank,
    (select balance from vw_cash_account_balances where name = 'Money Cash') as money_cash
)
select i.id as investor_id,
       i.name,
       i.initial_investment,
       coalesce(s.realized_pl,0) as realized_pl,
       coalesce(r.returned_capital,0) as returned_capital,
       coalesce(x.extra_income,0) as extra_income,
       coalesce(st.capital_in_stock,0) as capital_in_stock,
       (i.initial_investment + coalesce(s.realized_pl,0) + coalesce(x.extra_income,0) - coalesce(r.returned_capital,0))::numeric(12,2) as current_deposit_net,
       coalesce(o.other_expenses,0) as other_expenses,
       -( (i.initial_investment + coalesce(s.realized_pl,0) + coalesce(x.extra_income,0) - coalesce(r.returned_capital,0)) + coalesce(st.capital_in_stock,0) )::numeric(12,2) as total_money,
       (select money_bank from cash) as money_bank,
       (select money_cash from cash) as money_cash
from investors i
left join sold s on s.investor_id = i.id
left join in_stock st on st.investor_id = i.id
left join returned r on r.investor_id = i.id
left join exinc x on x.investor_id = i.id
left join other_exp o on o.investor_id = i.id;

-- Audit logging generic function
create or replace function log_audit() returns trigger language plpgsql as $$
declare changed jsonb;
begin
  if (tg_op = 'INSERT') then
    changed := to_jsonb(new);
  elsif (tg_op = 'UPDATE') then
    changed := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    changed := to_jsonb(old);
  end if;
  insert into audit_logs(actor_id, entity, entity_id, action, diff)
  values (null, tg_table_name, coalesce(new.id, old.id), tg_op, changed);
  return coalesce(new, old);
end $$;

-- Attach audit triggers
do $$ begin
  perform 1;
  exception when others then null; end $$;

drop trigger if exists audit_investors on investors;
create trigger audit_investors after insert or update or delete on investors
for each row execute function log_audit();

drop trigger if exists audit_vehicles on vehicles;
create trigger audit_vehicles after insert or update or delete on vehicles
for each row execute function log_audit();

drop trigger if exists audit_expenses on expenses;
create trigger audit_expenses after insert or update or delete on expenses
for each row execute function log_audit();

drop trigger if exists audit_extraincome on extra_income;
create trigger audit_extraincome after insert or update or delete on extra_income
for each row execute function log_audit();

drop trigger if exists audit_payouts on payouts;
create trigger audit_payouts after insert or update or delete on payouts
for each row execute function log_audit();

-- RLS: role function and policies (Supabase)
create or replace function public.current_app_role() returns user_role language plpgsql stable as $$
declare r user_role;
begin
  begin
    select u.role into r from public.users u where u.supabase_user_id = auth.uid();
  exception when others then
    -- Fallback for local/dev
    r := 'owner';
  end;
  if r is null then r := 'owner'; end if;
  return r;
end $$;

-- Enable RLS
alter table investors enable row level security;
alter table vehicles enable row level security;
alter table expenses enable row level security;
alter table extra_income enable row level security;
alter table cash_accounts enable row level security;
alter table cash_movements enable row level security;
alter table payouts enable row level security;
alter table attachments enable row level security;
alter table users enable row level security;
alter table audit_logs enable row level security;
alter table import_errors enable row level security;

-- Basic policies (tighten as needed)
-- viewers: read-only
create policy if not exists sel_investors on investors for select using (true);
create policy if not exists sel_vehicles on vehicles for select using (true);
create policy if not exists sel_expenses on expenses for select using (true);
create policy if not exists sel_extra_income on extra_income for select using (true);
create policy if not exists sel_cash_accounts on cash_accounts for select using (true);
create policy if not exists sel_cash_movements on cash_movements for select using (true);
create policy if not exists sel_payouts on payouts for select using (true);
create policy if not exists sel_attachments on attachments for select using (true);
create policy if not exists sel_users on users for select using (public.current_app_role() in ('owner','manager','analyst'));
create policy if not exists sel_audit on audit_logs for select using (public.current_app_role() in ('owner','manager','analyst'));
create policy if not exists sel_import_errors on import_errors for select using (public.current_app_role() in ('owner','manager','analyst'));

-- inserts/updates depending on role
create policy if not exists mut_investors_owner on investors for all using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');
create policy if not exists mut_vehicles_edit on vehicles for insert with check (public.current_app_role() in ('owner','manager'));
create policy if not exists upd_vehicles_edit on vehicles for update using (public.current_app_role() in ('owner','manager'));
create policy if not exists del_vehicles_owner on vehicles for delete using (public.current_app_role() = 'owner');

create policy if not exists mut_expenses_edit on expenses for insert with check (public.current_app_role() in ('owner','manager'));
create policy if not exists upd_expenses_edit on expenses for update using (public.current_app_role() in ('owner','manager'));
create policy if not exists del_expenses_edit on expenses for delete using (public.current_app_role() in ('owner','manager'));

create policy if not exists mut_exinc_edit on extra_income for insert with check (public.current_app_role() in ('owner','manager'));
create policy if not exists upd_exinc_edit on extra_income for update using (public.current_app_role() in ('owner','manager'));
create policy if not exists del_exinc_edit on extra_income for delete using (public.current_app_role() in ('owner','manager'));

create policy if not exists mut_payouts_owner on payouts for insert with check (public.current_app_role() = 'owner');
create policy if not exists upd_payouts_owner on payouts for update using (public.current_app_role() = 'owner');
create policy if not exists del_payouts_owner on payouts for delete using (public.current_app_role() = 'owner');

create policy if not exists mut_attachments_edit on attachments for insert with check (public.current_app_role() in ('owner','manager'));
create policy if not exists del_attachments_edit on attachments for delete using (public.current_app_role() in ('owner','manager'));

create policy if not exists mut_users_owner on users for all using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');
