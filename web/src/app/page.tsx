type Movement = { account: "investor" | "business" | "owner" | "assistant"; amount_aed: number };
export const dynamic = "force-dynamic";


export default async function Dashboard() {
  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  const db = getSupabaseAdmin();
  const { data: movements } = await db
    .from("au_capital_movements")
    .select("account, amount_aed");
  const balances = ((movements as Movement[] | null) || []).reduce<Record<string, number>>((acc, m) => {
    acc[m.account] = (acc[m.account] || 0) + Number(m.amount_aed || 0);
    return acc;
  }, {});
  const { count: activeCars } = await db
    .from("au_cars")
    .select("id", { count: "exact", head: true })
    .neq("status", "archived");

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Панель управления</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {(["investor","business","owner","assistant"] as const).map((k) => (
          <div key={k} className="rounded border p-4">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-xl font-semibold">{(balances[k] || 0).toFixed(2)} AED</div>
          </div>
        ))}
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Активных авто</div>
          <div className="text-xl font-semibold">{activeCars ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
