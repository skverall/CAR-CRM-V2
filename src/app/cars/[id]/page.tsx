import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import StatusBadge from "@/app/components/ui/StatusBadge";

import { notFound, redirect } from "next/navigation";
import SellBar from "@/app/components/cars/SellBar";
import ProfitBreakdown from "@/app/components/cars/ProfitBreakdown";


// Helpers for better visual presentation
function formatAED(n: number) {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function StatCard({
  label,
  value,
  sublabel,
  tone = 'default',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-green-700'
      : tone === 'danger'
      ? 'text-red-700'
      : tone === 'warning'
      ? 'text-amber-700'
      : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-gray-500">{sublabel}</div>}
    </div>
  );
}

type Car = {
  vin: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  status: "available" | "repair" | "listed" | "sold" | "archived";
  purchase_price: number;
  purchase_currency: string;
  purchase_rate_to_aed: number;
};
type CostRow = {
  purchase_component_aed: number | null;
  car_expenses_component_aed: number | null;
  overhead_component_aed: number | null;
  total_cost_aed: number | null;
};

type SaleIncomeRow = {
  amount: number | null;
  currency: string | null;
  rate_to_aed: number | null;
  amount_aed: number | null;
  description?: string | null;
  occurred_at: string;
};


type Expense = {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  amount_aed: number;
  expense_type: string;
  description: string | null;
};

type Income = {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  amount_aed: number;
  description: string | null;
};

async function distribute(formData: FormData) {
  "use server";
  const carId = String(formData.get("car_id"));
  const db = getSupabaseAdmin();
  await db.rpc("au_distribute_profit", { p_car_id: carId });
  redirect(`/cars/${carId}`);
}

async function sellCar(formData: FormData) {
  "use server";
  const carId = String(formData.get("car_id"));
  const occurred_at = String(formData.get("occurred_at"));
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency"));
  const rate_to_aed = Number(formData.get("rate_to_aed"));
  const description = String(formData.get("description") || "[SALE] Auto sale");
  if (!occurred_at || !amount || !currency || !rate_to_aed) {
    throw new Error("Sale details are required");
  }
  const db = getSupabaseAdmin();

  // Upsert sale income (avoid double counting by description tag)
  const { data: existing } = await db
    .from("au_incomes")
    .select("id")
    .eq("car_id", carId)
    .ilike("description", "%[SALE]%")
    .limit(1);

  const amount_aed = amount * rate_to_aed;
  const incomePayload = { occurred_at, amount, currency, rate_to_aed, amount_aed, description, car_id: carId } as const;
  if (existing && existing.length > 0) {
    await db.from("au_incomes").update(incomePayload).eq("id", existing[0].id);
  } else {
    await db.from("au_incomes").insert([incomePayload]);
  }

  // Update car sale fields
  const soldPriceAedFils = Math.round(amount_aed * 100);
  await db.from("au_cars").update({
    status: "sold",
    sold_price_aed: soldPriceAedFils,
    sold_date: occurred_at,
    commission_aed: 0
  }).eq("id", carId);

  // Create or update deal snapshot for reliability of reports
  const { data: pv } = await db
    .from('car_profit_view')
    .select('sold_price_aed, commission_aed, total_cost_aed, profit_aed, margin_pct, days_on_lot')
    .eq('id', carId)
    .single();

  if (pv) {
    const { data: existingSnap } = await db
      .from('deal_snapshots')
      .select('id')
      .eq('car_id', carId)
      .limit(1);

    const snapshot = {
      car_id: carId,
      org_id: (await db.from('au_cars').select('org_id').eq('id', carId).single()).data?.org_id || null,
      sold_date: occurred_at,
      sold_price_aed: pv.sold_price_aed ?? amount_aed,
      commission_aed: pv.commission_aed ?? 0,
      total_cost_aed: pv.total_cost_aed ?? 0,
      profit_aed: pv.profit_aed ?? (amount_aed - (pv.total_cost_aed ?? 0)),
      margin_pct: pv.margin_pct ?? null,
      days_on_lot: pv.days_on_lot ?? null,
    } as Record<string, unknown>;

    if (existingSnap && existingSnap.length > 0) {
      await db.from('deal_snapshots').update(snapshot).eq('id', existingSnap[0].id);
    } else {
      await db.from('deal_snapshots').insert([snapshot]);
    }
  }

  redirect(`/cars/${carId}`);
}

async function changeStatus(formData: FormData) {
  "use server";
  const carId = String(formData.get("car_id"));
  const next = String(formData.get("next_status")) as Car["status"];
  const db = getSupabaseAdmin();
  const { data: car } = await db.from("au_cars").select("status").eq("id", carId).single();
  if (!car) throw new Error("Car not found");
  const order: Car["status"][] = ["available","repair","listed","sold","archived"];
  const curIdx = order.indexOf(car.status);
  const nextIdx = order.indexOf(next);
  if (nextIdx < 0 || nextIdx < curIdx || nextIdx - curIdx > 1) {
    throw new Error("Holatni bunday o‘zgartirish mumkin emas");
  }
  await db.from("au_cars").update({ status: next }).eq("id", carId);
  redirect(`/cars/${carId}`);
}

export default async function CarPage({ params, searchParams }: { params: { id: string }, searchParams?: { edit?: string; from?: string; to?: string; cat?: string; view?: string } }) {
  const id = params.id;
  const db = getSupabaseAdmin();
  const { data: car } = await db.from("au_cars").select("*").eq("id", id).single();
  if (!car) return notFound();
  const carRow: Car = car as unknown as Car;
  const isEdit = Boolean(searchParams?.edit);


  const from = searchParams?.from || undefined;
  const to = searchParams?.to || undefined;
  const cat = searchParams?.cat || undefined;
  const activeCat = cat || null;

  function buildHref(nextCat?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (nextCat) params.set('cat', nextCat);
    const qs = params.toString();
    return `/cars/${id}` + (qs ? `?${qs}` : '');
  }

  // Server action: update basic fields
  async function updateCar(formData: FormData) {
    "use server";
    const payload: Record<string, unknown> = {
      make: String(formData.get("make") || carRow.make || ""),
      model: String(formData.get("model") || carRow.model || ""),
      model_year: formData.get("model_year") ? Number(formData.get("model_year")) : carRow.model_year,
      status: String(formData.get("status") || carRow.status),
    };
    await getSupabaseAdmin().from("au_cars").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id);
    redirect(`/cars/${id}`);
  }

  // Apply date/category filters to queries
  let expQuery = db.from("au_expenses").select("*").eq("car_id", id).order("occurred_at");
  if (from) expQuery = expQuery.gte('occurred_at', from);
  if (to) expQuery = expQuery.lte('occurred_at', to);
  if (cat) expQuery = expQuery.eq('expense_type', cat);
  const { data: expenses } = await expQuery;

  let incQuery = db.from("au_incomes").select("*").eq("car_id", id).order("occurred_at");
  if (from) incQuery = incQuery.gte('occurred_at', from);
  if (to) incQuery = incQuery.lte('occurred_at', to);
  const { data: incomes } = await incQuery;
  const { data: distributions } = await db.from("au_profit_distributions").select("*").eq("car_id", id);
  const { data: pv } = await db
    .from('car_profit_view')
    .select('profit_aed, margin_pct, days_on_lot, sold_price_aed, commission_aed, total_cost_aed')
    .eq('id', id)
    .single();
  const profit = Number(pv?.profit_aed ?? 0);
  const canDistribute = carRow.status === "sold" && profit > 0 && (distributions || []).length === 0;

  const purchaseAED = Number(carRow.purchase_price) * Number(carRow.purchase_rate_to_aed);
  const { data: costRow } = await db
    .from('car_cost_view')
    .select('purchase_component_aed, car_expenses_component_aed, overhead_component_aed, total_cost_aed')
    .eq('id', id)
    .single();
  const cost = (costRow as CostRow) || ({} as CostRow);
  const directExpensesAED = Number(cost.car_expenses_component_aed || 0);
  const overheadAED = Number(cost.overhead_component_aed || 0);
  const expensesAED = directExpensesAED + overheadAED;
  const totalCostAED = Number(cost.total_cost_aed || 0);

  const { data: saleIncomeRows } = await db
    .from('au_incomes')
    .select('amount, currency, rate_to_aed, amount_aed, description, occurred_at')
    .eq('car_id', id)

    .ilike('description', '%[SALE]%')
    .order('occurred_at', { ascending: false })
    .limit(1);
  const saleIncome = ((saleIncomeRows || [])[0] as SaleIncomeRow) || null;
  const saleAED = saleIncome ? (saleIncome.amount_aed ?? ((Number(saleIncome.amount || 0) * Number(saleIncome.rate_to_aed || 0)))) : 0;

  // Aggregates for timelines and headers
  const expensesList = ((expenses as unknown as Expense[]) || []);
  const incomesList = ((incomes as unknown as Income[]) || []);

  const expensesTotalListAED = expensesList.reduce((s, e) => s + Number(e.amount_aed || 0), 0);
  const incomesTotalListAED = incomesList.reduce((s, i) => s + Number(i.amount_aed || 0), 0);

  // Group expenses by category
  const groupedExpenses = expensesList.reduce((acc, e) => {
    const key = e.expense_type || 'Other';

    if (!acc[key]) acc[key] = { items: [] as Expense[], total: 0 };
    acc[key].items.push(e);
    acc[key].total += Number(e.amount_aed || 0);
    return acc;
  }, {} as Record<string, { items: Expense[]; total: number }>);

  const groupedExpenseEntries = Object.entries(groupedExpenses).sort((a,b)=> b[1].total - a[1].total);


  const order: Car["status"][] = ["available","repair","listed","sold","archived"];
  const curIdx = order.indexOf(carRow.status);
  const next = curIdx >= 0 && curIdx < order.length - 1 ? order[curIdx + 1] : null;


  // Combined transactions
  type Tx = { id: string; occurred_at: string; kind: 'expense'|'income'; amount: number; currency: string; amount_aed: number; description?: string };
  const transactions: Tx[] = [
    ...expensesList.map((e) => ({ id: `e-${e.id}`, occurred_at: e.occurred_at, kind: 'expense' as const, amount: Number(e.amount), currency: e.currency, amount_aed: Number(e.amount_aed), description: `${e.expense_type || ''} ${e.description || ''}`.trim() })),
    ...incomesList.map((i) => ({ id: `i-${i.id}`, occurred_at: i.occurred_at, kind: 'income' as const, amount: Number(i.amount), currency: i.currency, amount_aed: Number(i.amount_aed), description: i.description || '' })),
  ].sort((a,b) => (a.occurred_at < b.occurred_at ? 1 : -1));

  return (
    <div className="grid gap-6">

  <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{carRow.make} {carRow.model} {carRow.model_year || ""}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
            <span>VIN: {carRow.vin}</span>
            <StatusBadge status={carRow.status}>
              <Text path={`status.${carRow.status}`} fallback={carRow.status} />
            </StatusBadge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/expenses?car_id=${id}&quick=1`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <Text path="expenses.quickAdd.cta" fallback="Xarajat qo‘shish" />
          </Link>
          {!isEdit && (
            <Link href={`/cars/${id}?edit=1`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-7 7h10M9 21h6a2 2 0 002-2v-8a2 2 0 00-2-2H9a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tahrirlash
            </Link>
          )}
          {next && next !== "sold" && (
            <form action={changeStatus} className="flex items-center gap-2">
              <input type="hidden" name="car_id" value={id} />
              <input type="hidden" name="next_status" value={next} />
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-blue-700">Holat: <Text path={`status.${carRow.status}`} fallback={carRow.status} /> → <Text path={`status.${next}`} fallback={next || ''} /></button>
            </form>
          )}
          {next === "sold" && (
            <SellBar carId={id} onSell={sellCar} autoOpenFromQuery />
          )}
          {canDistribute && (
            <form action={distribute}>

              <input type="hidden" name="car_id" value={id} />
              <button className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-700">Foydani taqsimlash</button>
            </form>
          )}
        </div>

      {/* Sticky summary bar */}
      <div className="sticky top-2 z-30">
        <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-6">
          <div className="text-sm text-gray-600">Net foyda</div>
          <div className={`text-xl font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>AED {formatAED(profit)}</div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="text-sm text-gray-600">Marja</div>
          <div className="text-xl font-semibold">{pv?.margin_pct != null ? `${Number(pv.margin_pct).toFixed(1)}%` : '\u2014'}</div>
          {pv?.days_on_lot != null && (
            <>
              <div className="h-5 w-px bg-gray-200" />
              <div className="text-sm text-gray-600">Kunlar</div>
              <div className="text-xl font-semibold">{pv.days_on_lot}</div>
            </>
          )}
        </div>
      </div>

      </div>

      {isEdit && (
        <div className="border rounded p-4 bg-white">
          <h2 className="font-semibold mb-3">Tahrirlash</h2>
          <form action={updateCar} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input name="make" defaultValue={carRow.make || ''} placeholder="Make" className="border px-3 py-2 rounded" />
            <input name="model" defaultValue={carRow.model || ''} placeholder="Model" className="border px-3 py-2 rounded" />
            <input name="model_year" type="number" defaultValue={carRow.model_year || undefined} placeholder="Year" className="border px-3 py-2 rounded" />
            <select name="status" defaultValue={carRow.status} className="border px-3 py-2 rounded">
              <option value="available">available</option>
              <option value="repair">repair</option>
              <option value="listed">listed</option>
              <option value="sold">sold</option>
              <option value="archived">archived</option>
            </select>
            <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
              <a href={`/cars/${id}`} className="px-3 py-2 rounded border">Bekor qilish</a>

              <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Xarid (AED)"
            value={`AED ${formatAED(purchaseAED)}`}
            sublabel={`${Number(carRow.purchase_price)} ${carRow.purchase_currency}`}
          />
          <StatCard
            label="Xarajatlar (AED)"
            value={`AED ${formatAED(expensesAED)}`}
            sublabel={`To&apos;g&apos;ridan-to&apos;g&apos;ri: ${formatAED(directExpensesAED)} • Overhead: ${formatAED(overheadAED)}`}
          />
          <StatCard
            label="Sotuv (AED)"
            value={saleAED ? `AED ${formatAED(Number(saleAED))}` : '—'}

            tone={saleAED ? 'default' : 'warning'}
          />
          <StatCard
            label="Net foyda (AED)"
            value={`${profit >= 0 ? '+' : ''}AED ${formatAED(profit)}`}
            sublabel={pv?.margin_pct != null ? `Marja: ${Number(pv.margin_pct).toFixed(1)}%` : undefined}
            tone={profit >= 0 ? 'success' : 'danger'}
          />
        </div>
        <div className="text-sm text-gray-600">
          Jami tannarx (AED): <span className="font-medium">AED {formatAED(totalCostAED)}</span>
        </div>
      </div>

      {/* Date range filter */}
      <form method="GET" className="bg-white border rounded-xl p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Boshlanish</label>
          <input type="date" name="from" defaultValue={(searchParams?.from as string) || ''} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tugash</label>
          <input type="date" name="to" defaultValue={(searchParams?.to as string) || ''} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        {activeCat && <input type="hidden" name="cat" value={activeCat} />}
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg">Qo&apos;llash</button>
          <a href={`/cars/${id}`} className="px-3 py-2 border rounded-lg">Reset</a>
        </div>
      </form>



      {/* New Profit Breakdown Component */}
      <ProfitBreakdown
        purchasePrice={Number(carRow.purchase_price)}
        purchaseCurrency={carRow.purchase_currency}
        purchaseRate={Number(carRow.purchase_rate_to_aed)}
        directExpenses={directExpensesAED}
        overheadExpenses={overheadAED}
        soldPrice={carRow.status === 'sold' ? Number(pv?.sold_price_aed || 0) : undefined}
        commission={carRow.status === 'sold' ? Number(pv?.commission_aed || 0) : undefined}
        status={carRow.status}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expenses timeline with grouping */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold">Xarajatlar</h2>
            <div className="text-sm text-gray-600">Jami: <span className="font-medium text-red-700">AED {formatAED(expensesTotalListAED)}</span></div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <a href={buildHref(undefined)} className={`px-2.5 py-1 rounded-full text-xs ring-1 ${!activeCat ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-gray-700 ring-gray-200'}`}>Barchasi</a>
            {groupedExpenseEntries.map(([catName]) => (
              <a key={catName} href={buildHref(String(catName))} className={`px-2.5 py-1 rounded-full text-xs ring-1 ${activeCat === catName ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-gray-700 ring-gray-200'}`}>{catName}</a>
            ))}
          </div>
          <div className="space-y-3">
            {groupedExpenseEntries.map(([cat, group]) => (
              <details key={cat} className="group bg-white border rounded-lg p-3 shadow-sm open:shadow">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-gray-900">{cat}</span>
                  <span className="text-sm text-red-700">AED {formatAED(group.total)}</span>
                </summary>
                <ul className="mt-3 ml-2 pl-4 border-l space-y-2">
                  {group.items.map((e) => (
                    <li key={e.id} className="relative pl-4 text-sm text-gray-700">
                      <span className="absolute -left-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{e.occurred_at}</span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{e.description || ''}</span>
                        </div>
                        <div className="text-red-700">- {e.amount} {e.currency} (AED {formatAED(Number(e.amount_aed || 0))})</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* Incomes timeline */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold">Daromad</h2>
            <div className="text-sm text-gray-600">Jami: <span className="font-medium text-green-700">AED {formatAED(incomesTotalListAED)}</span></div>
          </div>

          <ul className="bg-white border rounded-lg p-3 shadow-sm space-y-2">
            {incomesList.map((i) => (
              <li key={i.id} className="relative pl-6 text-sm text-gray-700">
                <span className="absolute left-2 top-2 w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{i.occurred_at}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>{i.description || ''}</span>
                  </div>
                  <div className="text-green-700">+ {i.amount} {i.currency} (AED {formatAED(Number(i.amount_aed || 0))})</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Combined overall timeline */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-semibold">Umumiy timeline</h2>
          <div className="text-sm text-gray-600">Balans: <span className="font-medium">AED {formatAED(incomesTotalListAED - expensesTotalListAED)}</span></div>
        </div>
        <ul className="bg-white border rounded-lg p-3 shadow-sm space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="relative pl-6 text-sm text-gray-700">
              <span className={`absolute left-2 top-2 w-2 h-2 rounded-full ${t.kind === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{t.occurred_at}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span>{t.description || ''}</span>
                </div>
                <div className={t.kind === 'income' ? 'text-green-700' : 'text-red-700'}>
                  {t.kind === 'income' ? '+' : '-'} {t.amount} {t.currency} (AED {formatAED(Number(t.amount_aed || 0))})
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>


      {(distributions || []).length > 0 && (
        <div className="border rounded p-3">
          <h2 className="font-semibold mb-2">Foydani taqsimlash</h2>
          <pre className="text-sm">
            {JSON.stringify(distributions?.[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

