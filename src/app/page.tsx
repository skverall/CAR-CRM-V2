import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getDashboardOverview } from '@/server/reports'

import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { ExpenseBreakdown } from '@/components/dashboard/expense-breakdown'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function DashboardPage() {
  const overview = await getDashboardOverview()

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle>Cars in Work</CardTitle>
            <CardDescription>Active vehicles in pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{overview.carsInWork}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
            <CardDescription>Realized profit across sold cars</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{formatCurrency(overview.totalProfitAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Aggregated sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{formatCurrency(overview.totalRevenueAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accounts Monitored</CardTitle>
            <CardDescription>Investor, business, owner, assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{overview.accounts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Cashflow (30 days)</CardTitle>
            <CardDescription>Daily capital movement in AED</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <Suspense fallback={<div className='h-64 animate-pulse rounded-lg bg-muted' />}>
              <CashflowChart data={overview.cashflowSeries} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Mix</CardTitle>
            <CardDescription>Structure of car-related costs</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className='h-64 animate-pulse rounded-lg bg-muted' />}>
              <ExpenseBreakdown data={overview.expenseDistribution} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capital Accounts</CardTitle>
          <CardDescription>Live balances by account</CardDescription>
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
  )
}
