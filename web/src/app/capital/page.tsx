import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";


type Movement = {
  id: string;
  occurred_at: string;
  account: "investor" | "business" | "owner" | "assistant";
  amount_aed: number;
  reason: string | null;
  car_id?: string | null;
  expense_id?: string | null;
  income_id?: string | null;
  distribution_id?: string | null;
};

export default async function CapitalPage() {
  const db = getSupabaseAdmin();
  const { data: movements } = await db.from("au_capital_movements").select("*").order("occurred_at", { ascending: false }).limit(100);
  const movementsList = (movements as Movement[] | null) || [];
  const balances = movementsList.reduce<Record<string, number>>((acc, m) => {
    acc[m.account] = (acc[m.account] || 0) + Number(m.amount_aed || 0);
    return acc;
  }, {});
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Capital & Movements</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["investor","business","owner","assistant"] as const).map((k) => (
          <div key={k} className="rounded border p-4">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-xl font-semibold">{(balances[k] || 0).toFixed(2)} AED</div>
          </div>
        ))}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Account</th>
              <th className="p-2 border">Amount (AED)</th>
              <th className="p-2 border">Reason</th>
              <th className="p-2 border">Refs</th>
            </tr>
          </thead>
          <tbody>
            {movementsList.map((m: Movement) => (
              <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{m.occurred_at}</td>
                <td className="p-2 border">{m.account}</td>
                <td className="p-2 border">{m.amount_aed}</td>
                <td className="p-2 border">{m.reason}</td>
                <td className="p-2 border text-xs">{m.car_id || m.expense_id || m.income_id || m.distribution_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

