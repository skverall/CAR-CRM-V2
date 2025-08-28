import Link from 'next/link'
import Filters from './Filters'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Не заданы переменные окружения NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type SearchParams = Record<string, string | string[] | undefined>

function sval(sp: SearchParams, key: string) {
  const v = sp[key]
  if (Array.isArray(v)) return v[0] ?? ''
  return (v as string) ?? ''
}

function applyFilters(q: any, sp: SearchParams) {
  const from = sval(sp, 'from')
  const to = sval(sp, 'to')
  const vin = sval(sp, 'vin')
  const model = sval(sp, 'model')
  const category = sval(sp, 'category')
  const investor = sval(sp, 'investor')
  const qText = sval(sp, 'q')

  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  if (vin) q = q.ilike('vin', `%${vin}%`)
  if (model) q = q.ilike('model', `%${model}%`)
  if (category) q = q.ilike('category', `%${category}%`)
  if (investor) q = q.ilike('investor', `%${investor}%`)
  if (qText) q = q.or(`description.ilike.%${qText}%,notes.ilike.%${qText}%`)
  return q
}

function parseSort(sp: SearchParams): { col: string; asc: boolean } {
  const raw = (sval(sp, 'sort') || 'date_desc').toLowerCase()
  const parts = raw.split('_')
  const col = parts[0]
  const dir = parts[1] || 'desc'
  const allow = new Set(['date','vin','model','description','category','investor','amount'])
  const safeCol = allow.has(col) ? col : 'date'
  const asc = dir === 'asc'
  return { col: safeCol, asc }
}

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const pageSize = Math.min(Math.max(parseInt(sval(searchParams, 'pageSize') || '50', 10) || 50, 1), 500)
  const page = Math.max(parseInt(sval(searchParams, 'page') || '1', 10) || 1, 1)
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1
  const { col, asc } = parseSort(searchParams)

  // total count
  const countQuery = applyFilters(supabase.from('expenses').select('*', { count: 'exact', head: true }), searchParams)
  const { count, error: countError } = await countQuery
  if (countError) {
    console.error(countError)
  }

  // page data
  let data: any[] = []
  let error: any = null
  try {
    let q = applyFilters(supabase.from('expenses').select('*'), searchParams)
    q = q.order(col as any, { ascending: asc }).range(fromIdx, toIdx)
    const res = await q
    if (res.error) throw res.error
    data = res.data || []
  } catch (e: any) {
    error = e
  }

  const total = typeof count === 'number' ? count : undefined
  const totalPages = total ? Math.max(1, Math.ceil(total / pageSize)) : undefined
  const pageSum = data.reduce((s, x: any) => s + Number(x.amount || 0), 0)

  const sp = new URLSearchParams()
  for (const k of Object.keys(searchParams)) {
    const v = sval(searchParams, k)
    if (v) sp.set(k, v)
  }

  function withParams(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    }
    return `?${p.toString()}`
  }

  function sortHref(field: string) {
    const current = sval(searchParams, 'sort') || 'date_desc'
    const [c, d = 'desc'] = current.split('_')
    const nextDir = c === field && d === 'asc' ? 'desc' : 'asc'
    return withParams({ sort: `${field}_${nextDir}`, page: '1' })
  }

  return (
    <main>
      <h1>Расходы</h1>

      <Filters />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="muted">Всего строк: {total ?? '—'}</div>
        <div className="muted">Страница: {page}{totalPages ? ` / ${totalPages}` : ''}</div>
        <div className="muted">Сумма на странице: {pageSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {error && (
        <div style={{ color: '#f87171', marginBottom: 12 }}>Ошибка загрузки: {String(error.message || error)}</div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 900, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th><Link href={sortHref('date')}>Дата</Link></th>
              <th><Link href={sortHref('vin')}>VIN</Link></th>
              <th><Link href={sortHref('model')}>Модель</Link></th>
              <th><Link href={sortHref('description')}>Описание</Link></th>
              <th><Link href={sortHref('category')}>Категория</Link></th>
              <th><Link href={sortHref('investor')}>Инвестор</Link></th>
              <th style={{ textAlign: 'right' }}><Link href={sortHref('amount')}>Сумма</Link></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((x:any) => (
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

      <div className="pagination" style={{ marginTop: 12 }}>
        <Link href={withParams({ page: String(Math.max(1, page - 1)) })} aria-disabled={page <= 1} role="button">Назад</Link>
        <Link href={withParams({ page: String(page + 1) })} aria-disabled={totalPages ? page >= totalPages : false} role="button">Вперед</Link>
      </div>
    </main>
  )
}

