import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!

export async function POST(req: Request) {
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Server is not configured (missing SUPABASE envs)' }, { status: 500 })
  }
  const supabase = createClient(url, serviceKey)

  const body = await req.json().catch(() => ({}))
  const purchase_date = String(body.purchase_date || '').slice(0, 10)
  const purchase_price = Number(body.purchase_price)
  const row = {
    purchase_date,
    vin: body.vin || null,
    model: body.model || null,
    investor: body.investor || null,
    status: body.status || 'in_stock',
    purchase_price: isFinite(purchase_price) ? purchase_price : null,
    notes: body.notes || null,
  }

  if (!row.purchase_date) return NextResponse.json({ error: 'purchase_date is required' }, { status: 400 })

  const { data, error } = await supabase.from('inventory').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

