-- Schema and basic indices for expenses app
-- Run this in Supabase SQL editor or via Supabase CLI

create extension if not exists pg_trgm;

create table if not exists public.expenses (
  id bigserial primary key,
  date date not null,
  vin text,
  model text,
  description text,
  category text,
  investor text,
  amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- Indexes for common filters
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_expenses_amount on public.expenses(amount);
create index if not exists idx_expenses_vin_trgm on public.expenses using gin (vin gin_trgm_ops);
create index if not exists idx_expenses_model_trgm on public.expenses using gin (model gin_trgm_ops);
create index if not exists idx_expenses_category_trgm on public.expenses using gin (category gin_trgm_ops);
create index if not exists idx_expenses_investor_trgm on public.expenses using gin (investor gin_trgm_ops);
create index if not exists idx_expenses_desc_trgm on public.expenses using gin (description gin_trgm_ops);
create index if not exists idx_expenses_notes_trgm on public.expenses using gin (notes gin_trgm_ops);

-- Views for dashboard
create or replace view public.v_expenses_by_investor as
select investor,
       count(*) as cnt,
       coalesce(sum(amount), 0)::numeric(14,2) as total
from public.expenses
group by investor
order by total desc nulls last;

create or replace view public.v_expenses_by_category as
select category,
       count(*) as cnt,
       coalesce(sum(amount), 0)::numeric(14,2) as total
from public.expenses
group by category
order by total desc nulls last;

create or replace view public.v_expenses_by_month as
select date_trunc('month', date::timestamp) as month,
       count(*) as cnt,
       coalesce(sum(amount), 0)::numeric(14,2) as total
from public.expenses
group by 1
order by 1 desc;

-- RLS: allow read-only for public (anon and authenticated)
alter table public.expenses enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'Allow read to all'
  ) then
    create policy "Allow read to all" on public.expenses for select using (true);
  end if;
end $$;

