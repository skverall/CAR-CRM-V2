import { Suspense } from 'react'

import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { ExpenseBreakdown } from '@/components/dashboard/expense-breakdown'
import { ProfitShareChart } from '@/components/dashboard/profit-share-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getDashboardOverview } from '@/server/reports'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview()

  const kpis = [
    {
      title: 'Cars In Work',
      description: 'Active vehicles in the pipeline',
      value: overview.carsInWork.toString(),
    },
    {
      title: 'Realised Profit',
      description: 'Aggregated profit from sold cars',
      value: formatCurrency(overview.totalProfitAed),
    },
    {
      title: 'Investor Capital',
      description: 'Funds allocated to investors',
      value: formatCurrency(overview.capitalSummary.investor),
    },
    {
      title: 'Business Capital',
      description: 'Operating cash balance',
      value: formatCurrency(overview.capitalSummary.business),
    },
    {
      title: 'Owner Capital',
      description: 'Your share retained in AED',
      value: formatCurrency(overview.capitalSummary.owner),
    },
    {
      title: 'Assistant Capital',
      description: 'Assistant compensation pool',
      value: formatCurrency(overview.capitalSummary.assistant),
    },
  ]

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {kpis.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-semibold tracking-tight'>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Cashflow (30 days)</CardTitle>
            <CardDescription>Daily capital movement aggregated in AED</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <Suspense fallback={<div className='h-72 animate-pulse rounded-xl bg-muted' />}>
              <CashflowChart data={overview.cashflowSeries} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profit Distribution</CardTitle>
            <CardDescription>Investor, assistant, and owner shares</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className='h-72 animate-pulse rounded-xl bg-muted' />}>
              <ProfitShareChart data={overview.profitSplit} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Expense Structure</CardTitle>
            <CardDescription>Breakdown of direct vehicle expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className='h-72 animate-pulse rounded-xl bg-muted' />}>
              <ExpenseBreakdown data={overview.expenseDistribution} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capital Accounts</CardTitle>
            <CardDescription>Live balances recalculated from ledger</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className='text-right'>Balance (AED)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className='capitalize'>{account.type.toLowerCase()}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(account.balanceAed)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

