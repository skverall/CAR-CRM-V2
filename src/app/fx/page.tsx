import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

async function upsertRate(formData: FormData) {
  "use server";
  const rate_date = String(formData.get("rate_date"));
  const base = String(formData.get("base"));
  const pair = `${base}/AED`;
  const rate = Number(formData.get("rate"));
  const db = getSupabaseAdmin();
  await db.from("fx_rates").upsert({ rate_date, pair, rate }, { onConflict: "rate_date,pair" });
}

export default async function FxPage() {
  const db = getSupabaseAdmin();
  const { data: rows } = await db
    .from("fx_rates")
    .select("rate_date,pair,rate")
    .order("rate_date", { ascending: false })
    .limit(50);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Valyuta kurslari</h1>
      <form action={upsertRate} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-4 rounded">
        <input name="rate_date" type="date" required className="border px-2 py-1 rounded" />
        <select name="base" className="border px-2 py-1 rounded" defaultValue="USD">
          <option value="AED">AED</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <input name="rate" type="number" step="0.000001" placeholder="Kurs (baza→AED)" required className="border px-2 py-1 rounded" />
        <button className="col-span-2 sm:col-span-1 bg-black text-white px-3 py-2 rounded">Saqlash</button>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Sana</th>
              <th className="p-2 border">Juft</th>
              <th className="p-2 border">Kurs</th>
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
        </table>
      </div>
    </div>
  );
}

