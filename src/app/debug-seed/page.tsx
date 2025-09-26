export const dynamic = "force-dynamic";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";

async function seed() {
  "use server";
  const db = getSupabaseAdmin();
  const car = {
    vin: `TESTVIN-${Date.now()}`,
    make: "Toyota",
    model: "Corolla",
    model_year: 2018,
    source: "demo",
    purchase_date: new Date().toISOString().slice(0,10),
    purchase_currency: "USD",
    purchase_rate_to_aed: 3.67,
    purchase_price: 5000,
    status: "available" as const,
  };
  const { data: carRows, error: carErr } = await db.from("au_cars").insert([car]).select("id");
  if (carErr || !carRows?.[0]) throw new Error(carErr?.message || "Car insert failed");
  const carId = carRows[0].id as string;

  await db.from("au_expenses").insert([
    { occurred_at: car.purchase_date, amount: 300, currency: "USD", rate_to_aed: 3.67, expense_type: "shipping", description: "demo", car_id: carId },
    { occurred_at: car.purchase_date, amount: 800, currency: "USD", rate_to_aed: 3.67, expense_type: "repair", description: "demo", car_id: carId },
    { occurred_at: car.purchase_date, amount: 1000, currency: "AED", rate_to_aed: 1, expense_type: "office", description: "general demo", is_personal_or_general: true, general_account: "business" },
  ]);

  await db.from("au_incomes").insert([
    { occurred_at: car.purchase_date, amount: 21000, currency: "AED", rate_to_aed: 1, description: "sale", car_id: carId },
  ]);

  await db.from("au_cars").update({ status: "sold" }).eq("id", carId);

  // Try distribution (ignore error if function not present)
  try { await db.rpc("au_distribute_profit", { p_car_id: carId }); } catch {}

  redirect(`/cars/${carId}`);
}

export default function DebugSeed() {
  return (
    <div className="max-w-xl mx-auto p-4 grid gap-4">
      <h1 className="text-xl font-semibold">Demo seed</h1>
      <form action={seed}>
        <button className="bg-black text-white px-3 py-2 rounded">Seed demo data</button>
      </form>
    </div>
  );
}

