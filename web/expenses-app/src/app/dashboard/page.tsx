import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchTotals() {
  const queries = [
    `select investor, round(sum(amount)::numeric,2) as total, count(*) as cnt from expenses group by investor order by total desc`,
    `select category, round(sum(amount)::numeric,2) as total, count(*) as cnt from expenses group by category order by total desc`,
    `select to_char(date_trunc('month', date), 'YYYY-MM') as ym, round(sum(amount)::numeric,2) as total from expenses group by ym order by ym`
  ]
  const [byInvestor, byCategory, byMonth] = await Promise.all(
    queries.map(async (sql) => {
      const { data, error } = await supabase.rpc('exec_sql', { sql })
      if (error) throw error
      return data as any[]
    })
  )
  return { byInvestor, byCategory, byMonth }
}

export default async function DashboardPage() {
  // На Supabase без serverless RPC сооружу простую клиентскую агрегацию через REST?
  // Здесь оставляю заглушку: потом заменю на edge function или view/supabase-js filters.
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <p>Сводки будут добавлены сразу после подключения безопасного способа агрегации (view/edge function). Пока доступна страница расходов.</p>
    </main>
  )
}

