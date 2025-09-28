import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import Link from "next/link";

type CarRow = {
  id: string;
  vin: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  status: string;
  purchase_date: string;
  purchase_price: number;
  purchase_currency: string;
  purchase_rate_to_aed: number;
};


function fmtAED(n: number | null) { if (n == null) return "—"; return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 2 }).format(n); }

type CarInsert = Pick<CarRow, "vin" | "make" | "model" | "model_year" | "purchase_date" | "purchase_currency" | "purchase_rate_to_aed" | "purchase_price" | "status"> & { source?: string | null };

async function getCars(): Promise<CarRow[]> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("au_cars")
    .select("id, vin, make, model, model_year, status, purchase_date, purchase_price, purchase_currency, purchase_rate_to_aed")
    .order("purchase_date", { ascending: false });
  return (data as CarRow[]) || [];
}

async function addCar(formData: FormData) {
  "use server";
  const payload: CarInsert = {
    vin: String(formData.get("vin") || "").trim(),
    make: String(formData.get("make") || "").trim(),
    model: String(formData.get("model") || "").trim(),
    model_year: Number(formData.get("model_year")) || null,
    source: String(formData.get("source") || "").trim(),
    purchase_date: String(formData.get("purchase_date")),
    purchase_currency: String(formData.get("purchase_currency")),
    purchase_rate_to_aed: Number(formData.get("purchase_rate_to_aed")),
    purchase_price: Number(formData.get("purchase_price")),
    status: "available",
  };
  const db = getSupabaseAdmin();
  await db.from("au_cars").insert([payload]);
}

export default async function CarsPage() {
  const cars = await getCars();
  const db = getSupabaseAdmin();
  const profitsEntries = await Promise.all(
    cars.map(async (c) => {
      if (c.status !== "sold") return [c.id, null] as const;
      const { data: pr } = await db.rpc("au_car_profit_aed", { p_car_id: c.id });
      const v = Number(Array.isArray(pr) ? pr[0] : pr);
      return [c.id, isNaN(v) ? null : v] as const;
    })
  );
  const profits = Object.fromEntries(profitsEntries) as Record<string, number | null>;
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Avtomobillar</h1>
      </div>
      <form action={addCar} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-4 rounded">
        <input name="vin" required placeholder="VIN" className="border px-2 py-1 rounded" />
        <input name="make" placeholder="Marka" className="border px-2 py-1 rounded" />
        <input name="model" placeholder="Model" className="border px-2 py-1 rounded" />
        <input name="model_year" type="number" placeholder="Yil" className="border px-2 py-1 rounded" />
        <input name="source" placeholder="Manba" className="border px-2 py-1 rounded" />
        <input name="purchase_date" type="date" required className="border px-2 py-1 rounded" />
        <input name="purchase_currency" placeholder="Valyuta (masalan, USD)" required className="border px-2 py-1 rounded" />
        <input name="purchase_rate_to_aed" type="number" step="0.000001" placeholder="AED ga kurs" required className="border px-2 py-1 rounded" />
        <input name="purchase_price" type="number" step="0.01" placeholder="Xarid narxi" required className="border px-2 py-1 rounded" />
        <button className="col-span-2 sm:col-span-1 bg-black text-white px-3 py-2 rounded">Qo‘shish</button>
      </form>

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">VIN</th>
              <th className="p-2 border">Avto</th>
              <th className="p-2 border">Xarid</th>
              <th className="p-2 border">Holat</th>
              <th className="p-2 border">Foyda (AED)</th>
              <th className="p-2 border">Ochish</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c: CarRow) => (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border font-mono text-xs">{c.vin}</td>
                <td className="p-2 border">{c.make} {c.model} {c.model_year || ""}</td>
                <td className="p-2 border">{c.purchase_price} {c.purchase_currency}</td>
                <td className="p-2 border">{c.status}</td>
                <td className={`p-2 border ${profits[c.id] == null ? '' : (profits[c.id] as number) > 0 ? 'text-green-700' : (profits[c.id] as number) < 0 ? 'text-red-700' : 'text-gray-700'}`}>{fmtAED(profits[c.id] as number | null)}</td>
                <td className="p-2 border"><Link className="text-blue-600 underline" href={`/cars/${c.id}`}>Tafsilotlar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

