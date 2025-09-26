import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RatePrefill from "@/app/components/RatePrefill";
export const dynamic = "force-dynamic";


type CarRef = { id: string; vin: string };

type IncomeInsert = {
  occurred_at: string;
  amount: number;
  currency: string;
  rate_to_aed: number;
  description?: string;
  car_id: string;
};

type IncomeRow = {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  amount_aed: number;
  car_id: string;
  description: string | null;
};

async function addIncome(formData: FormData) {
  "use server";
  const payload: IncomeInsert = {
    occurred_at: String(formData.get("occurred_at")),
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency")),
    rate_to_aed: Number(formData.get("rate_to_aed")),
    description: String(formData.get("description") || ""),
    car_id: String(formData.get("car_id")),
  };
  const db = getSupabaseAdmin();
  await db.from("au_incomes").insert([payload]);
}

export default async function IncomesPage() {
  const db = getSupabaseAdmin();
  const { data: cars } = await db.from("au_cars").select("id, vin").order("purchase_date", { ascending: false });
  const { data: rows } = await db.from("au_incomes").select("*").order("occurred_at", { ascending: false }).limit(50);
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Income</h1>
      <form action={addIncome} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-4 rounded">
        <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
        <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" />
        <input name="amount" type="number" step="0.01" required placeholder="Amount" className="border px-2 py-1 rounded" />
        <input name="currency" required placeholder="Currency" className="border px-2 py-1 rounded" />
        <input name="rate_to_aed" type="number" step="0.000001" required placeholder="Rate to AED" className="border px-2 py-1 rounded" />
        <input name="description" placeholder="Description" className="border px-2 py-1 rounded" />
        <select name="car_id" required className="border px-2 py-1 rounded">
          {(cars as CarRef[] || []).map((c: CarRef) => (
            <option key={c.id} value={c.id}>{c.vin}</option>
          ))}
        </select>
        <button className="col-span-2 sm:col-span-1 bg-black text-white px-3 py-2 rounded">Add Income</button>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Car</th>
              <th className="p-2 border">Comment</th>
            </tr>
          </thead>
          <tbody>
            {(rows as IncomeRow[] || []).map((r: IncomeRow) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{r.occurred_at}</td>
                <td className="p-2 border">+{r.amount} {r.currency} (AED {r.amount_aed})</td>
                <td className="p-2 border">{r.car_id}</td>
                <td className="p-2 border">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

