import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const dynamic = "force-dynamic";

import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Card from "@/app/components/ui/Card";
import TableShell from "@/app/components/ui/TableShell";
import EmptyState from "@/app/components/ui/EmptyState";
import Text from "@/app/components/i18n/Text";


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

async function addMovement(formData: FormData) {
  "use server";
  const occurred_at = String(formData.get("occurred_at"));
  const account = String(formData.get("account")) as Movement["account"];
  const kind = String(formData.get("kind")); // deposit | withdraw | adjust
  const amount_abs = Math.abs(Number(formData.get("amount_abs")) || 0);
  const reason = String(formData.get("reason") || "");

  if (!occurred_at) throw new Error("Date is required");
  if (!account) throw new Error("Account is required");
  if (!(amount_abs > 0)) throw new Error("Amount must be > 0");

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0,10);
  if (occurred_at > today) throw new Error("Date cannot be in the future");

  let amount_aed = amount_abs;
  if (kind === "withdraw") amount_aed = -amount_abs;
  if (kind === "deposit") amount_aed = amount_abs;
  if (kind === "adjust") {
    // allow sign from input using a hidden field? for now use provided sign in amount_abs? keep positive and rely on reason
    // To allow negative adjustments, user should select withdraw.
  }

  await db.from("au_capital_movements").insert([
    { occurred_at, account, amount_aed, reason: reason || kind }
  ]);
}

export default async function CapitalPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const db = getSupabaseAdmin();
  const sp = (searchParams || {}) as Record<string, string | undefined>;
  const dateFrom = sp["date_from"];
  const dateTo = sp["date_to"];

  const { data: movements } = await (async () => {
    let q = db.from("au_capital_movements").select("*").order("occurred_at", { ascending: false }).limit(100);
    if (dateFrom) q = q.gte("occurred_at", dateFrom);
    if (dateTo) q = q.lte("occurred_at", dateTo);
    const { data } = await q;
    return { data };
  })();

  const movementsList = (movements as Movement[] | null) || [];
  const balances = movementsList.reduce<Record<string, number>>((acc, m) => {
    acc[m.account] = (acc[m.account] || 0) + Number(m.amount_aed || 0);
    return acc;
  }, {});
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold"><Text path="capital.title" fallback="Kapital va harakatlar" /></h1>
      <Card title={<Text path="capital.filters" fallback="Filtrlar" /> as unknown as string}>
        <form method="get" className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <Input name="date_from" type="date" defaultValue={dateFrom || ""} aria-label="Boshlanish" />
          <Input name="date_to" type="date" defaultValue={dateTo || ""} aria-label="Tugash" />
          <div className="sm:col-span-3" />
          <Button type="submit"><Text path="common.apply" fallback="Qollash" /></Button>
        </form>
      </Card>


      <Card title={<Text path="capital.addTitle" fallback="Kapital harakati qo‘shish" /> as unknown as string}>
        <form action={addMovement} className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <input name="occurred_at" type="date" required className="border px-2 py-1 rounded col-span-2 sm:col-span-2" />
          <select name="account" className="border px-2 py-1 rounded">
            <option value="investor">investor</option>
            <option value="business">business</option>
            <option value="owner">owner</option>
            <option value="assistant">assistant</option>
          </select>
          <select name="kind" className="border px-2 py-1 rounded">
            <option value="deposit">Kiritish</option>
            <option value="withdraw">Chiqib olish</option>
            <option value="adjust">To‘g‘rilash</option>
          </select>
          <input name="amount_abs" type="number" step="0.01" min="0.01" placeholder="Miqdor (AED)" required className="border px-2 py-1 rounded" />
          <input name="reason" placeholder="Izoh" className="border px-2 py-1 rounded col-span-2 sm:col-span-2" />
          <button className="col-span-2 sm:col-span-1 bg-black text-white px-3 py-2 rounded"><Text path="capital.addCta" fallback="Qo‘shish" /></button>
        </form>
      </Card>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["investor","business","owner","assistant"] as const).map((k) => (
          <Card key={k}>
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-xl font-semibold">{(balances[k] || 0).toFixed(2)} AED</div>
          </Card>
        ))}
      </div>

      <div className="overflow-auto">
      {movementsList.length === 0 ? (
        <Card>
          <EmptyState />
        </Card>
      ) : (
        <TableShell>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-2 border"><Text path="capital.table.date" fallback="Sana" /></th>
              <th className="p-2 border"><Text path="capital.table.account" fallback="Hisob" /></th>
              <th className="p-2 border"><Text path="capital.table.amountAed" fallback="Miqdor (AED)" /></th>
              <th className="p-2 border"><Text path="capital.table.reason" fallback="Sabab" /></th>
              <th className="p-2 border"><Text path="capital.table.links" fallback="Bog‘lanmalar" /></th>
            </tr>
          </thead>
          <tbody>
            {movementsList.map((m: Movement) => (
              <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{m.occurred_at}</td>
                <td className="p-2 border"><Text path={`capital.accounts.${m.account}`} fallback={m.account} /></td>
                <td className="p-2 border">{m.amount_aed}</td>
                <td className="p-2 border">{m.reason}</td>
                <td className="p-2 border text-xs">{m.car_id || m.expense_id || m.income_id || m.distribution_id}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      </div>
    </div>
  );
}

