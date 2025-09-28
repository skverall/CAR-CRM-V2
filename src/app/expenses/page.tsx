import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RatePrefill from "@/app/components/RatePrefill";
import OverheadPreview from "@/app/components/OverheadPreview";
import ExpenseScopeCarPicker from "@/app/components/ExpenseScopeCarPicker";
export const dynamic = "force-dynamic";


type CarRef = { id: string; vin: string };

type ExpenseInsert = {
  occurred_at: string;
  amount: number;
  currency: string;
  rate_to_aed: number;
  scope: 'car' | 'overhead' | 'personal';
  category: 'purchase' | 'transport' | 'repair' | 'detailing' | 'ads' | 'fees' | 'fuel' | 'parking' | 'rent' | 'salary' | 'other';
  description?: string;
  car_id?: string;
  org_id: string;
  amount_aed_fils?: number;
};

type ExpenseRow = {
  id: string;
  occurred_at: string;
  amount: number;
  currency: string;
  amount_aed_fils?: number | null;
  category?: string | null;
  scope?: string | null;
  car_id: string | null;
  description: string | null;
};

async function addExpense(formData: FormData) {
  "use server";
  const db = getSupabaseAdmin();

  const raw: ExpenseInsert = {
    occurred_at: String(formData.get("occurred_at")),
    amount: Number(formData.get("amount")),
    currency: String(formData.get("currency")),
    rate_to_aed: Number(formData.get("rate_to_aed")),
    scope: String(formData.get("scope")) as ExpenseInsert['scope'],
    category: String(formData.get("category")) as ExpenseInsert['category'],
    description: String(formData.get("description") || ""),
    org_id: String(formData.get("org_id") || ""),
  };

  const carId = String(formData.get("car_id") || "");
  if (carId) {
    raw.car_id = carId;
    raw.scope = 'car';
  }

  if (!raw.org_id) {
    throw new Error('Missing org_id');
  }

  const amountAedFils = Math.round(raw.amount * raw.rate_to_aed * 100);

  await db.from("au_expenses").insert([{
    org_id: raw.org_id,
    occurred_at: raw.occurred_at,
    amount: raw.amount,
    currency: raw.currency,
    rate_to_aed: raw.rate_to_aed,
    amount_aed_fils: amountAedFils,
    scope: raw.scope,
    category: raw.category,
    description: raw.description || null,
    car_id: raw.car_id || null,
  }]);
}

export default async function ExpensesPage() {
  const db = getSupabaseAdmin();
  const { data: cars } = await db.from("au_cars").select("id, vin").order("purchase_date", { ascending: false });
  const { data: rows } = await db.from("au_expenses").select("*").order("occurred_at", { ascending: false }).limit(50);
  const { data: org } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  const orgId = (org as { id: string } | null)?.id || null;



  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Xarajatlar</h1>
      <form action={addExpense} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-4 rounded">
        <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
        <input name="occurred_at" type="date" required aria-label="Sana" className="border px-2 py-1 rounded" />
        <input type="hidden" name="org_id" value={orgId || ""} />
        <input name="amount" type="number" step="0.01" required placeholder="Miqdor" aria-label="Miqdor" className="border px-2 py-1 rounded" />
        <input name="currency" required placeholder="Valyuta" aria-label="Valyuta" className="border px-2 py-1 rounded" />
        <input name="rate_to_aed" type="number" step="0.000001" required placeholder="AED ga kurs" aria-label="AED ga kurs" className="border px-2 py-1 rounded" />
        <select name="category" required aria-label="Toifa" className="border px-2 py-1 rounded">
          <option value="purchase">Xarid</option>
          <option value="transport">Transport</option>
          <option value="repair">Ta&apos;mirlash</option>
          <option value="detailing">Detalling</option>
          <option value="ads">Reklama</option>
          <option value="fees">To&apos;lov/Komissiya</option>
          <option value="fuel">Yoqilg&apos;i</option>
          <option value="parking">Parkovka</option>
          <option value="rent">Ijara</option>
          <option value="salary">Oylik</option>
          <option value="other">Boshqa</option>
        </select>
        <input name="description" placeholder="Izoh" aria-label="Izoh" className="border px-2 py-1 rounded" />

        {/* Avto va tur tanlash (scope=car => car majburiy) */}
        <ExpenseScopeCarPicker cars={(cars as CarRef[]) || []} />


        {/* Preview umumiy/shaxsiy taqsimoti */}
        <OverheadPreview orgId={orgId} />

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
                <td className="p-2 border">-{r.amount} {r.currency} (AED {(r.amount_aed_fils != null ? (r.amount_aed_fils / 100).toFixed(2) : '')})</td>
                <td className="p-2 border">{r.category ?? ''}</td>
                <td className="p-2 border">{r.car_id || r.scope || ''}</td>
                <td className="p-2 border">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

