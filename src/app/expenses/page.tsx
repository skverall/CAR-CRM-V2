import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RatePrefill from "@/app/components/RatePrefill";
import OverheadPreview from "@/app/components/OverheadPreview";
import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import EmptyState from "@/app/components/ui/EmptyState";
import QuickAddExpense from "@/app/components/quick/QuickAddExpense";
import ExpensesClientTable from "@/app/components/table/ExpensesClientTable";

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

export default async function ExpensesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const { data: cars } = await db.from("au_cars").select("id, vin").order("purchase_date", { ascending: false });
  const { data: org } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  const orgId = (org as { id: string } | null)?.id || null;

  const sp = (searchParams || {}) as Record<string, string | undefined>;
  const dateFrom = sp["date_from"];
  const dateTo = sp["date_to"];
  const category = sp["category"];
  const filterCarId = sp["car_id"];

  const { data: rows } = await (async () => {
    let q = db.from("au_expenses").select("*").order("occurred_at", { ascending: false }).limit(100);
    if (dateFrom) q = q.gte("occurred_at", dateFrom);
    if (dateTo) q = q.lte("occurred_at", dateTo);
    if (category) q = q.eq("category", category);
    if (filterCarId) q = q.eq("car_id", filterCarId);
    const { data } = await q;
    return { data };
  })();



  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Xarajatlar</h1>
      <Card title="Filtrlar">
        <form method="get" className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <Input name="date_from" type="date" defaultValue={dateFrom || ""} aria-label="Boshlanish" />
          <Input name="date_to" type="date" defaultValue={dateTo || ""} aria-label="Tugash" />
          <Select name="category" defaultValue={category || ""} aria-label="Toifa">
            <option value="">Barcha toifalar</option>
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
          </Select>
          <Select name="car_id" defaultValue={filterCarId || ""} aria-label="Avto">
            <option value="">Barcha avtolar</option>
            {(cars as CarRef[] || []).map((c: CarRef) => (
              <option key={c.id} value={c.id}>{c.vin}</option>
            ))}
          </Select>
          <Button type="submit" className="sm:col-span-1">Qo‘llash</Button>
        </form>
      </Card>

      <Card title="Xarajat qo‘shish">
        <div className="mb-3"><QuickAddExpense onSubmit={addExpense} orgId={orgId} cars={(cars as CarRef[])||[]} /></div>
        <form action={addExpense} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

          <Button type="submit" className="col-span-2 sm:col-span-1">Xarajat qo‘shish</Button>
          <p className="col-span-2 sm:col-span-4 text-xs text-gray-600 mt-1">
            Eslatma: Avto tanlanmasa, xarajat “Umumiy/Shaxsiy” hisoblanadi va avtomatik ravishda faol mashinalar orasida taqsimlanadi.
          </p>
        </form>
      </Card>


      <div className="overflow-auto">
      {(((rows as ExpenseRow[] | null)?.length || 0) === 0) ? (
        <Card>
          <EmptyState />
        </Card>
      ) : (
        <Card>
          {/* Client-side search/sort/export + totals */}
          <ExpensesClientTable rows={(rows as unknown) as Record<string, unknown>[]} />
        </Card>
      )}


      </div>
    </div>
  );
}

