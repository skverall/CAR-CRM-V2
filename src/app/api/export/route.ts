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

  let rows: Row[] = [];
  switch (type) {
    case "expenses": {
      const { data } = await db.from("au_expenses").select("id,occurred_at,amount,currency,amount_aed,expense_type,car_id,general_account,description").order("occurred_at", { ascending: false }).limit(500);
      rows = data || [];
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

