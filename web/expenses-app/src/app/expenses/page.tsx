import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

export default async function ExpensesPage() {
  const items = await fetchExpenses()
  return (
    <main>
      <h1>Список расходов</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: 800, width: '100%' }}>
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

