import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchViews() {
  const [{ data: byInvestor }, { data: byCategory }, { data: byMonth }] = await Promise.all([
    supabase.from('v_expenses_by_investor').select('*'),
    supabase.from('v_expenses_by_category').select('*'),
    supabase.from('v_expenses_by_month').select('*'),
  ])
  return { byInvestor: byInvestor ?? [], byCategory: byCategory ?? [], byMonth: byMonth ?? [] }
}

export default async function DashboardPage() {
  const { byInvestor, byCategory, byMonth } = await fetchViews()
  return (
    <main>
      <h1>Дашборд</h1>

      <section>
        <h2>По инвестору</h2>
        <ul>
          {byInvestor.map((x: any, i: number) => (
            <li key={i}>{x.investor ?? '—'}: {Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({x.cnt})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>По категории</h2>
        <ul>
          {byCategory.map((x: any, i: number) => (
            <li key={i}>{x.category ?? '—'}: {Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({x.cnt})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>По месяцам</h2>
        <ul>
          {byMonth.map((x: any, i: number) => (
            <li key={i}>{new Date(x.month).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}: {Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

