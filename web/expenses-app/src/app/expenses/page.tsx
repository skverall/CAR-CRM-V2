import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type SearchParams = Record<string, string | string[] | undefined>

function val(sp: SearchParams, key: string) {
  const v = sp[key]
  if (Array.isArray(v)) return v[0]
  return v ?? ''
}

async function fetchExpenses(sp: SearchParams) {
  const from = val(sp, 'from')
  const to = val(sp, 'to')
  const vin = val(sp, 'vin')
  const model = val(sp, 'model')
  const category = val(sp, 'category')
  const investor = val(sp, 'investor')
  const q = val(sp, 'q')
  const limit = Math.min(Math.max(parseInt(val(sp, 'limit') || '200', 10) || 200, 1), 5000)

  let query = supabase.from('expenses').select('*')

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)
  if (vin) query = query.ilike('vin', `%${vin}%`)
  if (model) query = query.ilike('model', `%${model}%`)
  if (category) query = query.ilike('category', `%${category}%`)
  if (investor) query = query.ilike('investor', `%${investor}%`)
  if (q) query = query.or(`description.ilike.%${q}%,notes.ilike.%${q}%`)

  const { data, error } = await query.order('date', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const items = await fetchExpenses(sp)
  const params = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string) || '')
  const exportHref = `/expenses/export?from=${encodeURIComponent(params('from') || '')}&to=${encodeURIComponent(params('to') || '')}&vin=${encodeURIComponent(params('vin') || '')}&model=${encodeURIComponent(params('model') || '')}&category=${encodeURIComponent(params('category') || '')}&investor=${encodeURIComponent(params('investor') || '')}&q=${encodeURIComponent(params('q') || '')}&limit=${encodeURIComponent(params('limit') || '5000')}`

  return (
    <main>
      <h1>Список расходов</h1>

      <form method="get" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
        <input name="from" placeholder="From (YYYY-MM-DD)" defaultValue={params('from')} />
        <input name="to" placeholder="To (YYYY-MM-DD)" defaultValue={params('to')} />
        <input name="vin" placeholder="VIN" defaultValue={params('vin')} />
        <input name="model" placeholder="Model" defaultValue={params('model')} />
        <input name="category" placeholder="Category" defaultValue={params('category')} />
        <input name="investor" placeholder="Investor" defaultValue={params('investor')} />
        <input name="q" placeholder="Поиск в описании/заметках" defaultValue={params('q')} style={{ gridColumn: 'span 3 / span 3' }} />
        <input name="limit" placeholder="Limit" defaultValue={params('limit') || '200'} />
        <button type="submit">Применить</button>
        <Link href={exportHref}>Экспорт CSV</Link>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 800, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>VIN</th>
              <th>Model</th>
              <th>Description</th>
              <th>Category</th>
              <th>Investor</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((x:any) => (
              <tr key={x.id}>
                <td>{new Date(x.date).toLocaleDateString()}</td>
                <td>{x.vin ?? ''}</td>
                <td>{x.model ?? ''}</td>
                <td>{x.description ?? ''}</td>
                <td>{x.category ?? ''}</td>
                <td>{x.investor ?? ''}</td>
                <td style={{ textAlign: 'right' }}>{Number(x.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
