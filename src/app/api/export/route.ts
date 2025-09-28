import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Row = Record<string, unknown>;

function toCSV(rows: Row[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").toLowerCase();
  const db = getSupabaseAdmin();

  type ExpenseRowSelect = {
    id: string;
    occurred_at: string;
    amount: number | null;
    currency: string | null;
    rate_to_aed: number | null;
    amount_aed_fils: number | null;
    scope: string;
    category: string;
    description: string | null;
    car_id: string | null;
    au_cars?: { vin: string | null } | null;
  };


  let rows: Row[] = [];
  switch (type) {
    case "expenses": {
      const orgId = searchParams.get("org_id") || "";
      const start = searchParams.get("start");
      const end = searchParams.get("end");
      const scope = searchParams.get("scope");
      const carId = searchParams.get("car_id");
      const category = searchParams.get("category");

      let query = db
        .from("au_expenses")
        .select(`
          id,
          occurred_at,
          amount,
          currency,
          rate_to_aed,
          amount_aed_fils,
          scope,
          category,
          description,
          car_id,
          au_cars(vin)
        `)
        .eq("org_id", orgId)
        .order("occurred_at", { ascending: false })
        .limit(2000);

      if (start) query = query.gte("occurred_at", start);
      if (end) query = query.lte("occurred_at", end);
      if (scope) query = query.eq("scope", scope);
      if (carId) query = query.eq("car_id", carId);
      if (category) query = query.eq("category", category);

      const { data } = await query;
      const arr = (data as ExpenseRowSelect[] | null) || [];
      rows = arr.map((r) => ({
        occurred_at: r.occurred_at,
        scope: r.scope,
        category: r.category,
        amount: r.amount ?? "",
        currency: r.currency ?? "",
        rate_to_aed: r.rate_to_aed ?? "",
        amount_aed: r.amount_aed_fils != null ? (Number(r.amount_aed_fils) / 100).toFixed(2) : "",
        car_id: r.car_id ?? "",
        car_vin: r.au_cars?.vin ?? "",
        description: r.description ?? "",
      }));
      break;
    }
    case "incomes": {
      const { data } = await db.from("au_incomes").select("id,occurred_at,amount,currency,amount_aed,car_id,description").order("occurred_at", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    case "movements": {
      const { data } = await db.from("au_capital_movements").select("id,occurred_at,account,amount_aed,reason,expense_id,income_id,car_id,distribution_id").order("occurred_at", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    case "cars": {
      const { data } = await db.from("au_cars").select("id,vin,make,model,model_year,status,purchase_date,purchase_currency,purchase_rate_to_aed,purchase_price").order("purchase_date", { ascending: false }).limit(500);
      rows = data || [];
      break;
    }
    default:
      return new Response("Unknown type", { status: 400 });
  }

  const csv = toCSV(rows);
  const headers = new Headers({
    "content-type": "text/csv; charset=utf-8",
    "content-disposition": `attachment; filename=${type}.csv`,
  });
  return new Response(csv, { headers });
}

