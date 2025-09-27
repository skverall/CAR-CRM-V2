import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import RatePrefill from "@/app/components/RatePrefill";

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
  const { data: existing } = await db
    .from("au_incomes")
    .select("id")
    .eq("car_id", carId)
    .ilike("description", "%[SALE]%")
    .limit(1);
  const payload = { occurred_at, amount, currency, rate_to_aed, description, car_id: carId } as const;
  if (existing && existing.length > 0) {
    await db.from("au_incomes").update(payload).eq("id", existing[0].id);
  } else {
    await db.from("au_incomes").insert([payload]);
  }
  await db.from("au_cars").update({ status: "sold" }).eq("id", carId);
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

export default async function CarPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const db = getSupabaseAdmin();
  const { data: car } = await db.from("au_cars").select("*").eq("id", id).single();
  if (!car) return notFound();
  const carRow: Car = car as unknown as Car;
  const { data: expenses } = await db.from("au_expenses").select("*").eq("car_id", id).order("occurred_at");
  const { data: incomes } = await db.from("au_incomes").select("*").eq("car_id", id).order("occurred_at");
  const { data: distributions } = await db.from("au_profit_distributions").select("*").eq("car_id", id);
  const { data: profitRes } = await db.rpc("au_car_profit_aed", { p_car_id: id });
  const profit = Number(Array.isArray(profitRes) ? profitRes[0] : profitRes);
  const canDistribute = carRow.status === "sold" && profit > 0 && (distributions || []).length === 0;

  const purchaseAED = Number(carRow.purchase_price) * Number(carRow.purchase_rate_to_aed);
  const expensesAED = ((expenses as unknown as Expense[] | null) || []).reduce((a, e) => a + Number(e.amount_aed || 0), 0);
  const incomesAED = ((incomes as unknown as Income[] | null) || []).reduce((a, i) => a + Number(i.amount_aed || 0), 0);

  const order: Car["status"][] = ["available","repair","listed","sold","archived"];
  const curIdx = order.indexOf(carRow.status);
  const next = curIdx >= 0 && curIdx < order.length - 1 ? order[curIdx + 1] : null;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{carRow.vin} - {carRow.make} {carRow.model} {carRow.model_year || ""}</h1>
        <div className="flex items-center gap-2">
          {next && next !== "sold" && (
            <form action={changeStatus} className="flex items-center gap-2">
              <input type="hidden" name="car_id" value={id} />
              <input type="hidden" name="next_status" value={next} />
              <button className="bg-blue-600 text-white px-3 py-2 rounded">Holat: {carRow.status} → {next}</button>
            </form>
          )}
          {next === "sold" && (
            <form action={sellCar} className="flex flex-wrap items-center gap-2">
              <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
              <input type="hidden" name="car_id" value={id} />
              <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" />
              <input name="amount" type="number" step="0.01" required placeholder="Sale amount" className="border px-2 py-1 rounded" />
              <input name="currency" required placeholder="Currency" className="border px-2 py-1 rounded" />
              <input name="rate_to_aed" type="number" step="0.000001" required placeholder="Rate→AED" className="border px-2 py-1 rounded" />
              <input name="description" placeholder="Description" defaultValue="[SALE] Auto sale" className="border px-2 py-1 rounded" />
              <button className="bg-blue-600 text-white px-3 py-2 rounded">Sold + Record Income</button>
            </form>
          )}
          {canDistribute && (
            <form action={distribute}>
              <input type="hidden" name="car_id" value={id} />
              <button className="bg-green-600 text-white px-3 py-2 rounded">Foydani taqsimlash</button>
            </form>
          )}
        </div>
      </div>

      <div className="border rounded p-3 bg-yellow-50 grid gap-2">
        <div><b>Xarid</b>: {carRow.purchase_price} {carRow.purchase_currency} (AED {purchaseAED.toFixed(2)})</div>
        <div className="text-sm text-gray-700">
          Foyda = Tushum (AED {incomesAED.toFixed(2)}) − (Xarid narxi AED {purchaseAED.toFixed(2)} + Bog‘liq xarajatlar AED {expensesAED.toFixed(2)})
        </div>
        <div><b>Yakuniy foyda (AED)</b>: <span className={profit >= 0 ? "text-green-700" : "text-red-700"}>{profit.toFixed(2)} AED</span></div>
      </div>

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

