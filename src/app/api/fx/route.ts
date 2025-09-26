import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get("currency") || "AED").toUpperCase();
  const date = searchParams.get("date");
  const pair = `${currency}/AED`;

  if (!date) {
    return new Response(JSON.stringify({ rate: 1 }), { headers: { "content-type": "application/json" } });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("fx_rates")
    .select("rate")
    .eq("pair", pair)
    .lte("rate_date", date)
    .order("rate_date", { ascending: false })
    .limit(1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });
  }

  const rate = data && data[0]?.rate ? Number(data[0].rate) : (currency === "AED" ? 1 : null);
  if (rate == null) {
    return new Response(JSON.stringify({ rate: null }), { headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({ rate }), { headers: { "content-type": "application/json" } });
}

