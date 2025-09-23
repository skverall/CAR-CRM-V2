import { listIncomes } from '@/server/income'
import { listCars } from '@/server/car'
import { listCapitalAccounts } from '@/server/capital'

import { AddIncomeDialog } from '@/components/cars/add-income-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(value)
}

export default async function IncomesPage() {
  const [incomes, carsResult, accounts] = await Promise.all([
    listIncomes(100),
    listCars({ page: 1, pageSize: 100 }),
    listCapitalAccounts(),
  ])

  const carOptions = carsResult.items.map((car) => ({
    id: car.id,
    label: `${car.vin} • ${car.make} ${car.model} ${car.year}`,
  }))

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Доходы</h1>
        <AddIncomeDialog accounts={accounts} cars={carOptions} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Последние доходы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Авто</TableHead>
                <TableHead>Покупатель</TableHead>
                <TableHead className='text-right'>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                  <TableCell>{income.car ? `${income.car.vin} • ${income.car.make}` : '-'}</TableCell>
                  <TableCell>{income.buyerName ?? '-'}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(income.amountAed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
