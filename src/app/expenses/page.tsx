import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RatePrefill from "@/app/components/RatePrefill";
export const dynamic = "force-dynamic";


type CarRef = { id: string; vin: string };

type ExpenseInsert = {
  occurred_at: string;
  amount: number;
  currency: string;
  rate_to_aed: number;
  expense_type: string;
  description?: string;
  car_id?: string;
  is_personal_or_general?: boolean;
  general_account?: "business" | "owner" | "assistant" | "investor";
};

type ExpenseRow = {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  amount_aed: number;
  expense_type: string;
  car_id: string | null;
  general_account: string | null;
  description: string | null;
};

async function addExpense(formData: FormData) {
  "use server";
  const payload: ExpenseInsert = {
    occurred_at: String(formData.get("occurred_at")),
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency")),
    rate_to_aed: Number(formData.get("rate_to_aed")),
    expense_type: String(formData.get("expense_type")),
    description: String(formData.get("description") || ""),
  };
  const carId = String(formData.get("car_id") || "");
  if (carId) {
    payload.car_id = carId;
    payload.is_personal_or_general = false;
  } else {
    payload.is_personal_or_general = true;
    payload.general_account = String(formData.get("general_account")) as ExpenseInsert["general_account"];
  }
  const db = getSupabaseAdmin();
  await db.from("au_expenses").insert([payload]);
}

export default async function ExpensesPage() {
  const db = getSupabaseAdmin();
  const { data: cars } = await db.from("au_cars").select("id, vin").order("purchase_date", { ascending: false });
  const { data: rows } = await db.from("au_expenses").select("*").order("occurred_at", { ascending: false }).limit(50);
  const GENERAL_ACCOUNT_LABELS: Record<string, string> = {
    business: "Biznes",
    owner: "Egasi",
    assistant: "Yordamchi",
    investor: "Sarmoyador",
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Xarajatlar</h1>
      <form action={addExpense} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-4 rounded">
        <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
        <input name="occurred_at" type="date" required aria-label="Sana" className="border px-2 py-1 rounded" />
        <input name="amount" type="number" step="0.01" required placeholder="Miqdor" aria-label="Miqdor" className="border px-2 py-1 rounded" />
        <input name="currency" required placeholder="Valyuta" aria-label="Valyuta" className="border px-2 py-1 rounded" />
        <input name="rate_to_aed" type="number" step="0.000001" required placeholder="AED ga kurs" aria-label="AED ga kurs" className="border px-2 py-1 rounded" />
        <input name="expense_type" required placeholder="Toifa (masalan, ta'mirlash)" aria-label="Toifa" className="border px-2 py-1 rounded" />
        <input name="description" placeholder="Izoh" aria-label="Izoh" className="border px-2 py-1 rounded" />

        {/* Avto tanlash yoki Umumiy/Shaxsiy */}
        <select name="car_id" className="border px-2 py-1 rounded" aria-label="Avto (bo'sh qoldirsangiz — Umumiy/Shaxsiy)">
          <option value="">Umumiy/Shaxsiy</option>
          {(cars as CarRef[] || []).map((c: CarRef) => (
            <option key={c.id} value={c.id}>{c.vin}</option>
          ))}
        </select>

        {/* Umumiy/Shaxsiy bo'lsa — kimning hisobidan */}
        <select name="general_account" className="border px-2 py-1 rounded" aria-label="Hisob turi (Umumiy/Shaxsiy)">
          <option value="business">{GENERAL_ACCOUNT_LABELS["business"]}</option>
          <option value="owner">{GENERAL_ACCOUNT_LABELS["owner"]}</option>
          <option value="assistant">{GENERAL_ACCOUNT_LABELS["assistant"]}</option>
          <option value="investor">{GENERAL_ACCOUNT_LABELS["investor"]}</option>
        </select>

        <button className="col-span-2 sm:col-span-1 bg-black text-white px-3 py-2 rounded">Xarajat qo‘shish</button>

        <p className="col-span-2 sm:col-span-4 text-xs text-gray-600 mt-1">
          Eslatma: Avto tanlanmasa, xarajat “Umumiy/Shaxsiy” hisoblanadi va avtomatik ravishda faol mashinalar orasida taqsimlanadi.
        </p>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Sana</th>
              <th className="p-2 border">Miqdor</th>
              <th className="p-2 border">Toifa</th>
              <th className="p-2 border">Avto/Hisob</th>
              <th className="p-2 border">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {(rows as ExpenseRow[] || []).map((r: ExpenseRow) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{r.occurred_at}</td>
                <td className="p-2 border">-{r.amount} {r.currency} (AED {r.amount_aed})</td>
                <td className="p-2 border">{r.expense_type}</td>
                <td className="p-2 border">{r.car_id || GENERAL_ACCOUNT_LABELS[r.general_account || ""] || r.general_account}</td>
                <td className="p-2 border">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

