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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

export default async function DashboardPage() {
  const { byInvestor, byCategory, byMonth } = await fetchViews()
  const total = [...byInvestor].reduce((s: any, x: any) => s + Number(x.total || 0), 0)

  return (
    <main>
      <h1>Дашборд</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <Card title="Всего расходов">
          <div style={{ fontSize: 24, fontWeight: 700 }}>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </Card>
        <Card title="Категории">
          <div style={{ fontSize: 24, fontWeight: 700 }}>{byCategory.length}</div>
        </Card>
        <Card title="Инвесторы">
          <div style={{ fontSize: 24, fontWeight: 700 }}>{byInvestor.length}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
        <Card title="По инвесторам">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {byInvestor.map((x: any, i: number) => (
              <li key={i}>{x.investor ?? 'Н/Д'}: {Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({x.cnt})</li>
            ))}
          </ul>
        </Card>

        <Card title="По категориям">
          {(() => {
            const max = Math.max(1, ...byCategory.map((x: any) => Number(x.total || 0)))
            return (
              <div style={{ display: 'grid', gap: 6 }}>
                {byCategory.map((x: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                      <span>{x.category ?? 'Н/Д'}</span>
                      <span>{Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ height: 8, background: '#1f252b', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${(Number(x.total || 0) / max) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="По месяцам">
          {(() => {
            const max = Math.max(1, ...byMonth.map((x: any) => Number(x.total || 0)))
            return (
              <div style={{ display: 'grid', gap: 6 }}>
                {byMonth.map((x: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                      <span>{new Date(x.month).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                      <span>{Number(x.total).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ height: 8, background: '#1f252b', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${(Number(x.total || 0) / max) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </Card>
      </div>
    </main>
  )
}
