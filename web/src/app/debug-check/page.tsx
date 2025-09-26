export const dynamic = "force-dynamic";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function checkTable(name: string) {
  const db = getSupabaseAdmin();
  const { error } = await db.from(name as any).select("count").limit(1);
  return { name, ok: !error, error: error?.message };
}

export default async function DebugCheck() {
  const tables = [
    "au_cars",
    "au_expenses",
    "au_incomes",
    "au_capital_movements",
    "au_profit_distributions",
  ];
  const results = await Promise.all(tables.map(checkTable));
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Schema check</h1>
      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.name} className="border rounded p-2">
            <b>{r.name}:</b> {r.ok ? "OK" : `MISSING (${r.error})`}
          </li>
        ))}
      </ul>
    </div>
  );
}

