import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";

type Car = {
  vin: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  status: string;
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

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{carRow.vin} - {carRow.make} {carRow.model} {carRow.model_year || ""}</h1>
        {canDistribute && (
          <form action={distribute}>
            <input type="hidden" name="car_id" value={id} />
            <button className="bg-green-600 text-white px-3 py-2 rounded">Distribute Profit</button>
          </form>
        )}
      </div>

      <div className="grid gap-2">
        <div><b>Покупка</b>: {carRow.purchase_price} {carRow.purchase_currency} (AED {(carRow.purchase_price * carRow.purchase_rate_to_aed).toFixed(2)})</div>
        <div><b>Profit (AED)</b>: {profit.toFixed(2)} AED</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Expenses</h2>
          <ul className="space-y-1">
            {(expenses as unknown as Expense[] || []).map((e: Expense) => (
              <li key={e.id} className="border rounded p-2 text-sm">
                {e.occurred_at}: -{e.amount} {e.currency} (AED {e.amount_aed}) — {e.expense_type} {e.description || ""}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Income</h2>
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
          <h2 className="font-semibold mb-2">Profit distribution</h2>
          <pre className="text-sm">
            {JSON.stringify(distributions?.[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

