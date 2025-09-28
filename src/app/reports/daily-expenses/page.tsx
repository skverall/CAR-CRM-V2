import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export const dynamic = 'force-dynamic';

function toISODate(d: Date) { return d.toISOString().slice(0,10); }

export default async function DailyExpensesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const { data: org } = await db.from('orgs').select('id').eq('name', 'Default Organization').single();
  const orgId = (org as { id: string } | null)?.id || '';

  const today = new Date();
  const start = (searchParams.start as string) || toISODate(today);
  const end = (searchParams.end as string) || toISODate(today);

  const qs = new URLSearchParams({ org_id: orgId, start, end }).toString();
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
          href={`/api/export?type=expenses&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
        >CSV yuklab olish — Xarajatlar (davr: {start} → {end})</a>
      </div>
    </div>
  );
}

