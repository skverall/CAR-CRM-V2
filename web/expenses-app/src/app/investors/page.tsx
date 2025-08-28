import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function fetchInvestors() {
  const { data, error } = await supabase.from('v_expenses_by_investor').select('*')
  if (error) throw error
  return data || []
}

export default async function InvestorsPage() {
  const investors = await fetchInvestors()
  const total = investors.reduce((s: number, x: any) => s + Number(x.total || 0), 0)

  return (
    <main>
      <h1>Инвесторы</h1>
      <div className="muted" style={{ marginBottom: 12 }}>Всего инвесторов: {investors.length} · Общая сумма: {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Инвестор</th>
              <th style={{ textAlign: 'right' }}>Сумма</th>
              <th style={{ textAlign: 'right' }}>Кол-во</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {investors.map((x: any, i: number) => (
              <tr key={i}>
                <td>{x.investor ?? 'н/д'}</td>
                <td style={{ textAlign: 'right' }}>{Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>{x.cnt}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/expenses?investor=${encodeURIComponent(x.investor ?? '')}`}>Открыть расходы</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

