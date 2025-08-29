CAR-CRM-V2

Production-ready web service for managing car deals, investors, expenses, incomes, cash, and attachments. Built with Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Table + React Hook Form + Zod. Backend: Supabase (Postgres) with Prisma. Includes RLS policies, SQL migrations, Excel import (seed + ongoing), audit logs, and unit tests.

Tech Stack
- Next.js 15 (App Router), TypeScript, Tailwind CSS
- shadcn/ui, TanStack Table, React Hook Form, Zod
- Supabase (Postgres + Auth + Storage), Prisma ORM
- Vitest for unit tests, ESLint + Prettier

Getting Started
1) Prerequisites
- Node.js 20+, pnpm
- Supabase project (or local Postgres for dev)

2) Environment
- Copy .env.example to .env at repo root and to web/.env
- Fill in DATABASE_URL and Supabase keys

3) Install
- pnpm install

4) Database
- Create database (Postgres). Ensure pgcrypto extension available.
- Apply migrations: connect Prisma to DATABASE_URL and run:
  pnpm -C web prisma migrate deploy

5) Dev
- pnpm dev
  App runs under web (Next.js dev server).

Excel Import
- CLI: pnpm import --file "./YourFile.xlsx"
  Parses sheets: Investors, Inventory, INFO, Expenses, Extra income.
  Writes counts and logs conflicts to table import_errors.

Data Import UI
- Open /import to upload a .xlsx file and run the same mapping.

Roles & RLS
- Table users maps Supabase user to role: owner, manager, analyst, viewer.
- RLS policies are defined in migration.sql using current_app_role() that reads from users via auth.uid().

Views
- vw_investor_positions: aggregates per investor (initial_investment, capital_in_stock, realized_pl, returned_capital, extra_income, current_deposit_net, other_expenses, total_money, Money Bank, Money Cash)
- vw_vehicle_finance: per-vehicle financials with investor_name
- vw_cash_account_balances: computed balances per cash account

Cash Movements
- Auto-generated via triggers:
  - vehicle insert → -purchase_price
  - vehicle status Sold → +sold_price
  - expense insert → -amount
  - extra_income insert → +amount
  - payout insert → -amount
- Default account is Money Bank (or first available).

Testing
- pnpm -C web test
- Critical business logic tests live under web/src/lib/*.test.ts

Deploy
- Database: Supabase
  - Create project, set DATABASE_URL (connection string) locally and in Vercel
  - Run SQL migrations (web/prisma/migrations) via Prisma migrate deploy or Supabase SQL editor
  - Create storage buckets as needed (photos, attachments)
  - Insert initial users/roles in users table
- App: Vercel
  - Build command: pnpm -C web build
  - Install command: pnpm install --frozen-lockfile
  - Output: Next.js default
  - Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

Notes
- vehicles.total_cost is kept in sync via triggers over expenses.
- ROI and market_margin are generated columns in DB.
- Some UI (dashboard, tables) is scaffolded minimally; extend with shadcn/ui and TanStack Table as needed.

