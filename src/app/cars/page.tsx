import Text from "@/app/components/i18n/Text";
import TableShell from "@/app/components/ui/TableShell";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import StatusFilter from "@/app/components/cars/StatusFilter";
import RowActionsMenu from "@/app/components/cars/RowActionsMenu";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <Text path="cars.title" fallback="Avtomobillar" />
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Barcha avtomobillar ro&apos;yxati va ularning holati
          </p>
        </div>
        <StatusFilter />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TableShell className="text-sm" maxHeightClass="max-h-[80vh]">
          <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.car" fallback="Avtomobil" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.status" fallback="Holat" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.purchaseDate" fallback="Xarid sanasi" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.purchasePrice" fallback="Xarid narxi" /> (AED)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.totalCost" fallback="Tan narx" /> (AED)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.soldPrice" fallback="Sotuv narxi" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.profit" fallback="Foyda" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.margin" fallback="Marja" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.days" fallback="Kunlar" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Text path="cars.table.actions" fallback="Amallar" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cars.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <p className="text-sm">Hech qanday avtomobil topilmadi</p>
                  </div>
                </td>
              </tr>
            ) : (
              cars.map((car, index) => (
                <tr key={car.id} className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {car.make?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {car.make} {car.model} {car.model_year ?? ''}
                        </div>
                        <div className="text-gray-500 text-xs font-mono">
                          VIN: {car.vin}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={car.status}>
                      <Text path={`status.${car.status}`} fallback={car.status} />
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(car.purchase_date).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {car.purchase_price_aed != null ? `${car.purchase_price_aed.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {(car.cost_base_aed ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                    {car.sold_price_aed != null ? `${car.sold_price_aed.toLocaleString()} AED` : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {car.profit_aed != null ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className={`text-sm font-semibold ${car.profit_aed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {car.profit_aed >= 0 ? '+' : ''}{car.profit_aed.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">AED</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-gray-600">
                    {car.margin_pct != null ? (
                      <span className={`font-medium ${car.margin_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {car.margin_pct.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-gray-600">
                    {car.days_on_lot != null ? (
                      <span className="inline-flex items-center gap-1">
                        <span>{car.days_on_lot}</span>
                        <span className="text-xs text-gray-400">kun</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <RowActionsMenu carId={car.id} orgId={orgId} onSell={sellViaDeals} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
