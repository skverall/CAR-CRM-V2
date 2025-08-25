import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

function val(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? ''
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams
  const from = val(sp, 'from')
  const to = val(sp, 'to')
  const vin = val(sp, 'vin')
  const model = val(sp, 'model')
  const category = val(sp, 'category')
  const investor = val(sp, 'investor')
  const q = val(sp, 'q')
  const limitRaw = parseInt(val(sp, 'limit') || '5000', 10) || 5000
  const limit = Math.min(Math.max(limitRaw, 1), 100000)

  let query = supabase.from('expenses').select('*')

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)
  if (vin) query = query.ilike('vin', `%${vin}%`)
  if (model) query = query.ilike('model', `%${model}%`)
  if (category) query = query.ilike('category', `%${category}%`)
  if (investor) query = query.ilike('investor', `%${investor}%`)
  if (q) query = query.or(`description.ilike.%${q}%,notes.ilike.%${q}%`)

  const { data, error } = await query.order('date', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = ['date','vin','model','description','category','investor','amount','notes']
  const lines = [header.join(',')]
  for (const x of data || []) {
    const row = [x.date, x.vin, x.model, x.description, x.category, x.investor, x.amount, x.notes]
      .map(v => {
        const s = v === null || v === undefined ? '' : String(v)
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
      })
      .join(',')
    lines.push(row)
  }
  const csv = lines.join('\n')
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="expenses_export.csv"'
    }
  })
}

