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
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Список расходов</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">VIN</th>
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Investor</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((x:any) => (
              <tr key={x.id} className="border-b hover:bg-neutral-50">
                <td className="py-1 pr-4 whitespace-nowrap">{new Date(x.date).toLocaleDateString()}</td>
                <td className="py-1 pr-4">{x.vin ?? ''}</td>
                <td className="py-1 pr-4">{x.model ?? ''}</td>
                <td className="py-1 pr-4">{x.description ?? ''}</td>
                <td className="py-1 pr-4">{x.category ?? ''}</td>
                <td className="py-1 pr-4">{x.investor ?? ''}</td>
                <td className="py-1 pr-4 text-right">{Number(x.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

