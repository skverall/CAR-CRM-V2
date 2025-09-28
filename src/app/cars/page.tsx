import Link from "next/link";
import Text from "@/app/components/i18n/Text";
import TableShell from "@/app/components/ui/TableShell";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import SellBar from "@/app/components/cars/SellBar";
import RowQuickAddExpenseClient from "@/app/components/cars/RowQuickAddExpenseClient";
import StatusFilter from "@/app/components/cars/StatusFilter";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

type CarRow = {
  id: string;
  vin: string;
  make: string;
  model: string;
  model_year: number | null;
  status: 'in_transit' | 'for_sale' | 'reserved' | 'sold' | 'archived' | 'available' | 'repair' | 'listed';
  purchase_date: string;
  purchase_price_aed: number | null;
  cost_base_aed: number;
  sold_price_aed: number | null;
  profit_aed: number | null;
  margin_pct: number | null;
  days_on_lot: number | null;
};

async function getOrgId(): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? null;
}

async function fetchCars(orgId: string, statusParam?: string): Promise<CarRow[]> {
  const qs = new URLSearchParams({ org_id: orgId, per_page: '200' });
  if (statusParam) qs.set('status', statusParam);
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/cars?${qs.toString()}`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load cars');
  return (json.data.cars as CarRow[]);
}

async function sellViaDeals(formData: FormData) {
  "use server";
  const car_id = String(formData.get("car_id"));
  const occurred_at = String(formData.get("occurred_at"));
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency"));
  const rate_to_aed = Number(formData.get("rate_to_aed"));
  if (!car_id || !occurred_at || !amount || !currency || !rate_to_aed) {
    throw new Error("Sale details are required");
  }
  const sold_price_aed = currency === 'AED' ? amount : amount * rate_to_aed;
  const payload = { car_id, sold_price_aed, sold_date: occurred_at };
  await fetch(`/api/deals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export default async function CarsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const orgId = await getOrgId();
  const cars = orgId ? await fetchCars(orgId, searchParams?.status) : [];

  return (
    <div className="grid gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold"><Text path="cars.title" fallback="Avtomobillar" /></h1>
        <StatusFilter />
      </div>

      <TableShell className="text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="p-2 border"><Text path="cars.table.car" fallback="Avtomobil" /></th>
            <th className="p-2 border"><Text path="cars.table.status" fallback="Holat" /></th>
            <th className="p-2 border"><Text path="cars.table.purchaseDate" fallback="Xarid sanasi" /></th>
            <th className="p-2 border">AED <Text path="cars.table.purchasePrice" fallback="Xarid narxi" /></th>
            <th className="p-2 border"><Text path="cars.table.totalCost" fallback="Tan narx (AED)" /></th>
            <th className="p-2 border"><Text path="cars.table.soldPrice" fallback="Sotuv narxi" /></th>
            <th className="p-2 border"><Text path="cars.table.profit" fallback="Foyda" /></th>
            <th className="p-2 border"><Text path="cars.table.margin" fallback="Marja" /></th>
            <th className="p-2 border"><Text path="cars.table.days" fallback="Kunlar" /></th>
            <th className="p-2 border"><Text path="cars.table.actions" fallback="Amallar" /></th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">
                <div className="font-medium">{car.vin}</div>
                <div className="text-gray-600">{car.make} {car.model} {car.model_year ?? ''}</div>
              </td>
              <td className="p-2 border">
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                  <Text path={`status.${car.status}`} fallback={car.status} />
                </span>
              </td>
              <td className="p-2 border whitespace-nowrap">{new Date(car.purchase_date).toLocaleDateString('uz-UZ')}</td>
              <td className="p-2 border whitespace-nowrap">{car.purchase_price_aed != null ? `${car.purchase_price_aed.toLocaleString()} AED` : '—'}</td>
              <td className="p-2 border whitespace-nowrap">{(car.cost_base_aed ?? 0).toLocaleString()} AED</td>
              <td className="p-2 border whitespace-nowrap">{car.sold_price_aed != null ? `${car.sold_price_aed.toLocaleString()} AED` : '—'}</td>
              <td className="p-2 border">
                {car.profit_aed != null ? (
                  <span className={car.profit_aed >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()} AED
                  </span>
                ) : '—'}
              </td>
              <td className="p-2 border">{car.margin_pct != null ? `${car.margin_pct.toFixed(1)}%` : '—'}</td>
              <td className="p-2 border">{car.days_on_lot != null ? car.days_on_lot : '—'}</td>
              <td className="p-2 border">
                <div className="flex items-center gap-2">
                  <Link href={`/cars/${car.id}`} className="text-blue-600 hover:underline">
                    <Text path="cars.table.view" fallback="Ko'rish" />
                  </Link>
                  {car.status !== 'sold' && car.status !== 'archived' && (
                    <SellBar carId={car.id} onSell={sellViaDeals} />
                  )}
                  <RowQuickAddExpenseClient orgId={orgId} carId={car.id} carVin={car.vin} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
