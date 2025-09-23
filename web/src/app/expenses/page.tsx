import { listExpenses } from '@/server/expense'
import { listCars } from '@/server/car'
import { listCapitalAccounts } from '@/server/capital'

import { AddExpenseDialog } from '@/components/cars/add-expense-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(value)
}

export default async function ExpensesPage() {
  const [expenses, carsResult, accounts] = await Promise.all([
    listExpenses(100),
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
        <h1 className='text-2xl font-semibold tracking-tight'>Расходы</h1>
        <AddExpenseDialog accounts={accounts} cars={carOptions} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Последние расходы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Авто</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead className='text-right'>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.car ? `${expense.car.vin} • ${expense.car.make}` : 'Общие'}</TableCell>
                  <TableCell>{expense.type.toLowerCase()}</TableCell>
                  <TableCell>{expense.paidFrom.toLowerCase()}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(expense.amountAed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
