import Text from "@/app/components/i18n/Text";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  vin: string;
  make: string;
  model: string;
  sold_date: string;
  purchase_date: string | null;
  days_on_lot: number | null;
  sold_price_aed: number;
  commission_aed: number;
  total_cost_aed: number;
  profit_aed: number;
  margin_pct: number;
  roi_pct: number;
};

async function getOrgId(): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? null;
}

async function fetchRows(orgId: string, start?: string, end?: string): Promise<Row[]> {
  const db = getSupabaseAdmin();
  let query = db
    .from("car_profit_view")
    .select("id, org_id, vin, make, model, sold_date, purchase_date, days_on_lot, sold_price_aed, commission_aed, total_cost_aed, profit_aed, margin_pct, roi_pct")
    .eq("org_id", orgId)
    .order("sold_date", { ascending: false })
    .limit(5000);
  if (start) query = query.gte("sold_date", start);
  if (end) query = query.lte("sold_date", end);
  const { data } = await query;
  return (data as Row[] | null) || [];
}

function sum(arr: number[]) { return arr.reduce((a,b) => a + b, 0); }
function avg(arr: number[]) { return arr.length ? (sum(arr) / arr.length) : 0; }

export default async function SalesReportPage({ searchParams }: { searchParams?: { start?: string; end?: string } }) {
  const orgId = await getOrgId();
  const start = searchParams?.start;
  const end = searchParams?.end;
  const rows = orgId ? await fetchRows(orgId, start, end) : [];

  const totalProfit = sum(rows.map(r => Number(r.profit_aed || 0)));
  const avgMargin = avg(rows.filter(r => r.margin_pct != null).map(r => Number(r.margin_pct)));
  const count = rows.length;

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const baseExport = orgId ? `${base}/api/export?type=sales&org_id=${orgId}${start?`&start=${encodeURIComponent(start)}`:''}${end?`&end=${encodeURIComponent(end)}`:''}` : "#";
  const urls = {
    csv: baseExport,
    xlsx: `${baseExport}&format=xlsx`,
    pdf: `${baseExport}&format=pdf`,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><Text path="reports.sales.title" fallback="Sotuvlar hisoboti" /></h1>
          <p className="text-gray-600 text-sm"><Text path="reports.sales.subtitle" fallback="Sotuv bo'yicha foyda va marja" /></p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={urls.csv} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">CSV</Link>
          <Link href={urls.xlsx} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Excel</Link>
          <Link href={urls.pdf} className="px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm">PDF</Link>
        </div>
      </div>

      {/* Фильтр периода */}
      <form className="flex items-end gap-3" action="/reports/sales" method="get">
        <div>
          <label className="block text-xs text-gray-600 mb-1"><Text path="common.from" fallback="Boshlanish" /></label>
          <input type="date" name="start" defaultValue={start} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1"><Text path="common.to" fallback="Tugash" /></label>
          <input type="date" name="end" defaultValue={end} className="border rounded px-3 py-2" />
        </div>
        <button className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50" type="submit">
          <Text path="common.apply" fallback="Qo'llash" />
        </button>
      </form>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-lg border"><div className="text-xs text-gray-500"><Text path="reports.sales.totalProfit" fallback="Jami foyda" /></div><div className="text-xl font-semibold">{totalProfit.toLocaleString()} AED</div></div>
        <div className="p-4 bg-white rounded-lg border"><div className="text-xs text-gray-500"><Text path="reports.sales.avgMargin" fallback="O'rtacha marja" /></div><div className="text-xl font-semibold">{avgMargin.toFixed(1)}%</div></div>
        <div className="p-4 bg-white rounded-lg border"><div className="text-xs text-gray-500"><Text path="reports.sales.count" fallback="Sotuvlar soni" /></div><div className="text-xl font-semibold">{count}</div></div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="text-left text-xs text-gray-600 uppercase">
              <th className="p-3">Data</th>
              <th className="p-3">VIN</th>
              <th className="p-3">Make</th>
              <th className="p-3">Model</th>
              <th className="p-3 text-right">Sold</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3 text-right">Comm</th>
              <th className="p-3 text-right">Profit</th>
              <th className="p-3 text-right">Margin</th>
              <th className="p-3 text-right">ROI</th>
              <th className="p-3 text-right">Days</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-gray-50/30">
                <td className="p-3 whitespace-nowrap">{new Date(r.sold_date).toLocaleDateString('uz-UZ')}</td>
                <td className="p-3 font-mono text-xs">{r.vin}</td>
                <td className="p-3">{r.make}</td>
                <td className="p-3">{r.model}</td>
                <td className="p-3 text-right">{r.sold_price_aed.toLocaleString()}</td>
                <td className="p-3 text-right">{r.total_cost_aed.toLocaleString()}</td>
                <td className="p-3 text-right">{r.commission_aed.toLocaleString()}</td>
                <td className="p-3 text-right">
                  <span className={`${r.profit_aed >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                    {r.profit_aed >= 0 ? '+' : ''}{r.profit_aed.toLocaleString()}
                  </span>
                </td>
                <td className="p-3 text-right">{r.margin_pct?.toFixed(1)}%</td>
                <td className="p-3 text-right">{r.roi_pct?.toFixed(1)}%</td>
                <td className="p-3 text-right">{r.days_on_lot ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

