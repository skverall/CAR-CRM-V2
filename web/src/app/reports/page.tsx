import { getDashboardOverview } from '@/server/reports'

import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { ExpenseBreakdown } from '@/components/dashboard/expense-breakdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportsPage() {
  const overview = await getDashboardOverview()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Отчёты</h1>
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Cashflow</CardTitle>
            <CardDescription>Движение средств по дням</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <CashflowChart data={overview.cashflowSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Структура расходов</CardTitle>
            <CardDescription>Группировка по типам</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdown data={overview.expenseDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
