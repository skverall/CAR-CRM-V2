import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export const dynamic = 'force-dynamic';

function toISODate(d: Date) { return d.toISOString().slice(0,10); }

export default async function DailyExpensesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const { data: org } = await db.from('orgs').select('id').eq('name', 'Default Organization').single();
  const orgId = (org as { id: string } | null)?.id || '';

  const scope = (searchParams.scope as string) || '';
  const carId = (searchParams.car_id as string) || '';
  const category = (searchParams.category as string) || '';

  const today = new Date();
  const start = (searchParams.start as string) || toISODate(today);
  const end = (searchParams.end as string) || toISODate(today);

  // Car options for filters
  const { data: cars } = await db.from('au_cars').select('id, vin').order('purchase_date', { ascending: false });
  const carOptions = (cars as { id: string; vin: string }[] | null) || [];

  const qs = new URLSearchParams({ org_id: orgId, start, end, scope, car_id: carId, category }).toString();
  const res = await fetch(`/api/reports/daily-expenses?${qs}`, { cache: 'no-store' });
  const json = await res.json();
  const data = json.data as {
    range: { start: string; end: string };
    summary: { total_aed: number; by_category: { key: string; total_aed: number }[]; by_scope: { key: string; total_aed: number }[]; by_car: { key: string; total_aed: number }[] };
    items: { id: string; occurred_at: string; amount_aed: number; scope: string; category: string; description: string | null; car_vin: string | null }[];
  } | null;

  const fmt = (n: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 2 }).format(n);

  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return toISODate(d); })();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kunlik xarajatlar</h1>
        <div className="flex items-center gap-2 text-sm">
          <a className="underline" href={`?start=${toISODate(today)}&end=${toISODate(today)}`}>Bugun</a>
          <a className="underline" href={`?start=${yesterday}&end=${yesterday}`}>Kecha</a>
        </div>
      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-2 border rounded p-3">
        <input type="hidden" name="start" value={start} />
        <input type="hidden" name="end" value={end} />
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Scope</label>
          <select name="scope" defaultValue={scope} className="border px-2 py-1 rounded">
            <option value="">Hammasi</option>
            <option value="overhead">Umumiy</option>
            <option value="personal">Shaxsiy</option>
            <option value="car">Faqat avto (car_id)</option>
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Avto</label>
          <select name="car_id" defaultValue={carId} className="border px-2 py-1 rounded">
            <option value="">—</option>
            {carOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.vin}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Toifa</label>
          <select name="category" defaultValue={category} className="border px-2 py-1 rounded">
            <option value="">—</option>
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
        </div>
        <button className="bg-black text-white px-3 py-2 rounded">Filtrlash</button>
      </form>

      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Jami AED</div>
          <div className="text-xl font-semibold">{data ? fmt(data.summary.total_aed) : '—'}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Toifa bo&apos;yicha</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {data?.summary.by_category.map((c) => (
              <span key={c.key} className="px-2 py-1 bg-gray-100 rounded text-xs">{c.key}: {fmt(c.total_aed)}</span>
            ))}
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Avto/Hisob bo&apos;yicha</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {data?.summary.by_car.map((c) => (
              <span key={c.key} className="px-2 py-1 bg-gray-100 rounded text-xs">{c.key}: {fmt(c.total_aed)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Sana</th>
              <th className="p-2 border">Miqdor (AED)</th>
              <th className="p-2 border">Toifa</th>
              <th className="p-2 border">Avto/Hisob</th>
              <th className="p-2 border">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{r.occurred_at}</td>
                <td className="p-2 border">-{fmt(r.amount_aed)}</td>
                <td className="p-2 border">{r.category}</td>
                <td className="p-2 border">{r.car_vin || (r.scope === 'personal' ? 'Shaxsiy' : r.scope)}</td>
                <td className="p-2 border">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <a
          className="underline text-blue-600"
          href={`/api/export?type=expenses&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&scope=${encodeURIComponent(scope)}&car_id=${encodeURIComponent(carId)}&category=${encodeURIComponent(category)}`}
        >CSV yuklab olish — Xarajatlar (filtrlar saqlanadi, davr: {start} → {end})</a>
      </div>
    </div>
  );
}

