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
  const date = String(body.date || '').slice(0, 10)
  const amount = Number(body.amount)
  const row = {
    date,
    vin: body.vin || null,
    model: body.model || null,
    description: body.description || null,
    category: body.category || null,
    investor: body.investor || null,
    amount: isFinite(amount) ? amount : 0,
    notes: body.notes || null,
  }

  if (!row.date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

  const { data, error } = await supabase.from('expenses').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

