import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import React from "react";

import { notFound, redirect } from "next/navigation";
import Text from "@/app/components/i18n/Text";
import SellBar from "@/app/components/cars/SellBar";
import ProfitBreakdown from "@/app/components/cars/ProfitBreakdown";


// Helpers for better visual presentation
function formatAED(n: number) {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Status = Car["status"];
function StatusBadge({ status }: { status: Status }) {
  const color = (
    {
      available: "bg-gray-100 text-gray-800 ring-gray-200",
      repair: "bg-amber-100 text-amber-800 ring-amber-200",
      listed: "bg-blue-100 text-blue-800 ring-blue-200",
      sold: "bg-green-100 text-green-800 ring-green-200",
      archived: "bg-slate-100 text-slate-700 ring-slate-200",
    } as Record<string, string>
  )[status] || "bg-gray-100 text-gray-800 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${color}`}>
      {status}
    </span>
  );
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

export default async function CarPage({ params, searchParams }: { params: { id: string }, searchParams?: { edit?: string } }) {
  const id = params.id;
  const db = getSupabaseAdmin();
  const { data: car } = await db.from("au_cars").select("*").eq("id", id).single();
  if (!car) return notFound();
  const carRow: Car = car as unknown as Car;
  const isEdit = Boolean(searchParams?.edit);

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

  const { data: expenses } = await db.from("au_expenses").select("*").eq("car_id", id).order("occurred_at");
  const { data: incomes } = await db.from("au_incomes").select("*").eq("car_id", id).order("occurred_at");
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

  const order: Car["status"][] = ["available","repair","listed","sold","archived"];
  const curIdx = order.indexOf(carRow.status);
  const next = curIdx >= 0 && curIdx < order.length - 1 ? order[curIdx + 1] : null;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{carRow.make} {carRow.model} {carRow.model_year || ""}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
            <span>VIN: {carRow.vin}</span>
            <StatusBadge status={carRow.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEdit && (
            <a href={`/cars/${id}?edit=1`} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Tahrirlash</a>
          )}
          {next && next !== "sold" && (
            <form action={changeStatus} className="flex items-center gap-2">
              <input type="hidden" name="car_id" value={id} />
              <input type="hidden" name="next_status" value={next} />
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-blue-700">Holat: {carRow.status} → {next}</button>
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
            sublabel={`To‘g‘ridan-to‘g‘ri: ${formatAED(directExpensesAED)} • Overhead: ${formatAED(overheadAED)}`}
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
        <div>
          <h2 className="font-semibold mb-2">Xarajatlar</h2>
          <ul className="space-y-1">
            {(expenses as unknown as Expense[] || []).map((e: Expense) => (
              <li key={e.id} className="border rounded p-2 text-sm">
                {e.occurred_at}: -{e.amount} {e.currency} (AED {e.amount_aed}) — {e.expense_type} {e.description || ""}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Daromad</h2>
          <ul className="space-y-1">
            {(incomes as unknown as Income[] || []).map((i: Income) => (
              <li key={i.id} className="border rounded p-2 text-sm">
                {i.occurred_at}: +{i.amount} {i.currency} (AED {i.amount_aed}) — {i.description || ""}
              </li>
            ))}
          </ul>
        </div>
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

