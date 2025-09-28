import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import RatePrefill from "@/app/components/RatePrefill";
export const dynamic = "force-dynamic";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import EmptyState from "@/app/components/ui/EmptyState";
import Select from "@/app/components/ui/Select";
import QuickAddIncome from "@/app/components/quick/QuickAddIncome";
import IncomesClientTable from "@/app/components/table/IncomesClientTable";
import Text from "@/app/components/i18n/Text";



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
  // Prevent double-counting: sale income is recorded automatically on car page
  const { data: saleExists } = await db
    .from("au_incomes")
    .select("id")
    .eq("car_id", payload.car_id)
    .ilike("description", "%[SALE]%")
    .limit(1);
  if (saleExists && saleExists.length > 0 && (payload.description || "").toLowerCase().includes("sale")) {
    throw new Error("Car sale income is recorded automatically when marking a car as sold. Do not add manual sale income.");
  }
  await db.from("au_incomes").insert([payload]);
}

export default async function IncomesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const { data: cars } = await db.from("au_cars").select("id, vin").order("purchase_date", { ascending: false });
  const sp = (searchParams || {}) as Record<string, string | undefined>;
  const dateFrom = sp["date_from"];
  const dateTo = sp["date_to"];
  const filterCarId = sp["car_id"];

  const { data: rows } = await (async () => {
    let q = db.from("au_incomes").select("*").order("occurred_at", { ascending: false }).limit(100);
    if (dateFrom) q = q.gte("occurred_at", dateFrom);
    if (dateTo) q = q.lte("occurred_at", dateTo);
    if (filterCarId) q = q.eq("car_id", filterCarId);
    const { data } = await q;
    return { data };
  })();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="incomes.title" fallback="Daromad (qo'lda)" /></h1>
      <p className="text-sm text-gray-600"><Text path="incomes.noteSaleAuto" fallback="Eslatma: Avto sotilganda tushum avtomatik ravishda avto sahifasida yozib olinadi. Bu yerda faqat boshqa daromadlarni kiriting." /></p>
      <Card title={<Text path="incomes.filters" fallback="Filtrlar" /> as unknown as string}>
        <form method="get" className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <Input name="date_from" type="date" defaultValue={dateFrom || ""} aria-label="Boshlanish" />
          <Input name="date_to" type="date" defaultValue={dateTo || ""} aria-label="Tugash" />
          <Select name="car_id" defaultValue={filterCarId || ""} aria-label="Avto">
            <option value="">Barcha avtolar</option>
            {(cars as CarRef[] || []).map((c: CarRef) => (
              <option key={c.id} value={c.id}>{c.vin}</option>
            ))}
          </Select>
          <Button type="submit" className="sm:col-span-1"><Text path="common.apply" fallback="Qo‘llash" /></Button>
        </form>
      </Card>

      <Card title={<Text path="incomes.addTitle" fallback="Daromad qo‘shish" /> as unknown as string}>
        <div className="mb-3"><QuickAddIncome onSubmit={addIncome} orgId={null} cars={(cars as CarRef[])||[]} /></div>
        <form action={addIncome} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <RatePrefill currencyName="currency" dateName="occurred_at" rateName="rate_to_aed" />
          <input name="occurred_at" type="date" required className="border px-2 py-1 rounded" />
          <input name="amount" type="number" step="0.01" required placeholder="Miqdor" className="border px-2 py-1 rounded" />
          <input name="currency" required placeholder="Valyuta" className="border px-2 py-1 rounded" />
          <input name="rate_to_aed" type="number" step="0.000001" required placeholder="AED ga kurs" className="border px-2 py-1 rounded" />
          <input name="description" placeholder="Izoh" className="border px-2 py-1 rounded" />
          <select name="car_id" required className="border px-2 py-1 rounded">
            {(cars as CarRef[] || []).map((c: CarRef) => (
              <option key={c.id} value={c.id}>{c.vin}</option>
            ))}
          </select>
          <Button type="submit" className="col-span-2 sm:col-span-1"><Text path="incomes.addTitle" fallback="Daromad qo‘shish" /></Button>
        </form>
      </Card>


      <div className="overflow-auto">

      {(((rows as IncomeRow[] | null)?.length || 0) === 0) ? (
        <Card>
          <EmptyState />
        </Card>
      ) : (
        <Card>
          <IncomesClientTable rows={(rows as unknown) as Record<string, unknown>[]} />
        </Card>
      )}


      </div>
    </div>
  );
}

