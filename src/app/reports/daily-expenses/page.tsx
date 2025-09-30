import Text from "@/app/components/i18n/Text";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function getOrgId(): Promise<string> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("orgs").select("id").eq("name", "Default Organization").single();
  return (data as { id: string } | null)?.id ?? "";
}

export default async function DailyExpensesPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const orgId = await getOrgId();
  const db = getSupabaseAdmin();

  const today = toISODate(new Date());
  const start = (typeof searchParams?.start === "string" && searchParams?.start) || today;
  const end = (typeof searchParams?.end === "string" && searchParams?.end) || today;
  const scope = typeof searchParams?.scope === "string" ? searchParams!.scope : "";
  const carId = typeof searchParams?.car_id === "string" ? searchParams!.car_id : "";
  const category = typeof searchParams?.category === "string" ? searchParams!.category : "";

  // Cars for dropdown
  type CarRow = { id: string; vin: string | null };
  const { data: cars } = await db
    .from("au_cars")
    .select("id, vin")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("vin");
  const carRefs = ((cars || []) as CarRow[]).map((c) => ({ id: c.id, vin: c.vin ?? "" }));

  // Fetch daily expenses data via internal API
  const params = new URLSearchParams({ org_id: orgId, start, end });
  if (scope) params.set("scope", scope);
  if (carId) params.set("car_id", carId);
  if (category) params.set("category", category);

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/reports/daily-expenses?${params.toString()}`, { cache: "no-store" });
  const json = await res.json();
  const ok = json?.success === true;
  const items = (ok ? json.data?.items : []) as Array<{
    occurred_at: string;
    amount_aed: number;
    scope: "car" | "overhead" | "personal";
    category: string;
    description: string | null;
    car_vin?: string | null;
  }>;
  const summary = (ok ? json.data?.summary : null) as
    | { total_aed: number; by_category: Array<{ key: string; total_aed: number }>; by_car: Array<{ key: string; total_aed: number }> }
    | null;

  const cats = [
    "purchase",
    "transport",
    "repair",
    "detailing",
    "ads",
    "fees",
    "fuel",
    "parking",
    "rent",
    "salary",
    "other",
  ];

  const exportUrl = `/api/export?type=expenses&${params.toString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            <Text path="reports.dailyExpensesPage.title" fallback="Kunlik xarajatlar" />
          </h1>
        </div>
        <div className="flex gap-2">
          <a
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
            href={`?start=${today}&end=${today}&scope=${scope || ""}&car_id=${carId || ""}&category=${category || ""}`}
          >
            <Text path="reports.dailyExpensesPage.today" fallback="Bugun" />
          </a>
          <a
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
            href={`?start=${toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000))}&end=${toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000))}&scope=${scope || ""}&car_id=${carId || ""}&category=${category || ""}`}
          >
            <Text path="reports.dailyExpensesPage.yesterday" fallback="Kecha" />
          </a>
          <a className="px-3 py-1.5 text-sm rounded-lg border border-green-300 bg-green-50 hover:bg-green-100" href={exportUrl} download>
            <Text path="reports.dailyExpensesPage.export.expensesCsvWithRange" fallback="CSV — Xarajatlar (filtrlar saqlanadi, davr)" />
          </a>
        </div>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-3" method="get">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start</label>
          <input type="date" name="start" defaultValue={start} className="w-full rounded-lg border-gray-300" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End</label>
          <input type="date" name="end" defaultValue={end} className="w-full rounded-lg border-gray-300" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            <Text path="reports.dailyExpensesPage.filters.scope" fallback="Scope" />
          </label>
          <select name="scope" defaultValue={scope} className="w-full rounded-lg border-gray-300">
            <option value="">
              <Text path="reports.dailyExpensesPage.filters.all" fallback="Hammasi" />
            </option>
            <option value="overhead">
              <Text path="reports.dailyExpensesPage.filters.overhead" fallback="Umumiy" />
            </option>
            <option value="personal">
              <Text path="reports.dailyExpensesPage.filters.personal" fallback="Shaxsiy" />
            </option>
            <option value="car">car</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            <Text path="reports.dailyExpensesPage.filters.car" fallback="Avto" />
          </label>
          <select name="car_id" defaultValue={carId} className="w-full rounded-lg border-gray-300">
            <option value="">
              <Text path="reports.dailyExpensesPage.filters.all" fallback="Hammasi" />
            </option>
            {carRefs.map((c) => (
              <option key={c.id} value={c.id}>{c.vin}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            <Text path="reports.dailyExpensesPage.filters.category" fallback="Toifa" />
          </label>
          <select name="category" defaultValue={category} className="w-full rounded-lg border-gray-300">
            <option value="">
              <Text path="reports.dailyExpensesPage.filters.all" fallback="Hammasi" />
            </option>
            {cats.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Apply</button>
        </div>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <Text path="reports.dailyExpensesPage.summary.totalAed" fallback="Jami AED" />
          </div>
          <div className="text-2xl font-bold">{summary ? summary.total_aed.toFixed(2) : "0.00"}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <Text path="reports.dailyExpensesPage.summary.byCategory" fallback="Toifa bo‘yicha" />
          </div>
          <ul className="mt-2 space-y-1">
            {(summary?.by_category || []).slice(0, 5).map((row) => (
              <li key={row.key} className="flex justify-between text-sm">
                <span>{row.key}</span>
                <span>{row.total_aed.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <Text path="reports.dailyExpensesPage.summary.byCar" fallback="Avto/Hisob bo‘yicha" />
          </div>
          <ul className="mt-2 space-y-1">
            {(summary?.by_car || []).slice(0, 5).map((row) => (
              <li key={row.key} className="flex justify-between text-sm">
                <span>{row.key}</span>
                <span>{row.total_aed.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 font-semibold">
          <Text path="reports.dailyExpensesPage.title" fallback="Kunlik xarajatlar" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm">
                <th className="px-4 py-2">
                  <Text path="reports.dailyExpensesPage.table.date" fallback="Sana" />
                </th>
                <th className="px-4 py-2">
                  <Text path="reports.dailyExpensesPage.table.amountAed" fallback="Miqdor (AED)" />
                </th>
                <th className="px-4 py-2">
                  <Text path="reports.dailyExpensesPage.table.category" fallback="Toifa" />
                </th>
                <th className="px-4 py-2">
                  <Text path="reports.dailyExpensesPage.table.car" fallback="Avto/Hisob" />
                </th>
                <th className="px-4 py-2">
                  <Text path="reports.dailyExpensesPage.table.description" fallback="Izoh" />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t text-sm">
                  <td className="px-4 py-2 whitespace-nowrap">{it.occurred_at}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{it.amount_aed.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{it.category}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{it.car_vin || (it.scope === 'personal' ? 'PERSONAL' : it.scope.toUpperCase())}</td>
                  <td className="px-4 py-2">{it.description || ""}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>
                    <Text path="expenses.summary.noData" fallback="Ma'lumot yo'q" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

