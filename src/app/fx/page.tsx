import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import TableShell from "@/app/components/ui/TableShell";
import EmptyState from "@/app/components/ui/EmptyState";
import Text from "@/app/components/i18n/Text";

async function upsertRate(formData: FormData) {
  "use server";
  const rate_date = String(formData.get("rate_date"));
  const base = String(formData.get("base"));
  const pair = `${base}/AED`;
  const rate = Number(formData.get("rate"));
  const db = getSupabaseAdmin();
  await db.from("fx_rates").upsert({ rate_date, pair, rate }, { onConflict: "rate_date,pair" });
}

export default async function FxPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const sp = (searchParams || {}) as Record<string, string | undefined>;
  const dateFrom = sp["date_from"];
  const dateTo = sp["date_to"];
  const base = sp["base"] || "USD";
  const pair = `${base}/AED`;

  const { data: rows } = await (async () => {
    let q = db.from("fx_rates").select("rate_date,pair,rate").order("rate_date", { ascending: false }).limit(100);
    if (dateFrom) q = q.gte("rate_date", dateFrom);
    if (dateTo) q = q.lte("rate_date", dateTo);
    if (base) q = q.eq("pair", pair);
    const { data } = await q;
    return { data };
  })();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="fx.title" fallback="Valyuta kurslari" /></h1>
      <Card title={<Text path="fx.filters" fallback="Filtrlar" /> as unknown as string}>
        <form method="get" className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <Input name="date_from" type="date" defaultValue={dateFrom || ""} aria-label="Boshlanish" />
          <Input name="date_to" type="date" defaultValue={dateTo || ""} aria-label="Tugash" />
          <Select name="base" defaultValue={base}>
            <option value="AED">AED</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
          <div className="sm:col-span-2" />
          <Button type="submit"><Text path="common.apply" fallback="Qo‘llash" /></Button>
        </form>
      </Card>

      <Card title={<Text path="fx.addTitle" fallback="Kurs qo‘shish" /> as unknown as string}>
        <form action={upsertRate} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input name="rate_date" type="date" required className="border px-2 py-1 rounded" />
          <select name="base" className="border px-2 py-1 rounded" defaultValue="USD">
            <option value="AED">AED</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <input name="rate" type="number" step="0.000001" placeholder={"Kurs (baza→AED)"} required className="border px-2 py-1 rounded" />
          <Button type="submit" className="col-span-2 sm:col-span-1"><Text path="common.save" fallback="Saqlash" /></Button>
        </form>
      </Card>


      <div className="overflow-auto">
      {(((rows as { rate_date: string; pair: string; rate: number }[] | null)?.length || 0) === 0) ? (
        <Card>
          <EmptyState />
        </Card>
      ) : (
        <TableShell className="text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-2 border"><Text path="fx.table.date" fallback="Sana" /></th>
              <th className="p-2 border"><Text path="fx.table.pair" fallback="Juft" /></th>
              <th className="p-2 border"><Text path="fx.table.rate" fallback="Kurs" /></th>
            </tr>
          </thead>
          <tbody>
            {(rows as { rate_date: string; pair: string; rate: number }[] || []).map((r) => (
              <tr key={r.rate_date + r.pair} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{r.rate_date}</td>
                <td className="p-2 border">{r.pair}</td>
                <td className="p-2 border">{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}


      </div>
    </div>
  );
}

