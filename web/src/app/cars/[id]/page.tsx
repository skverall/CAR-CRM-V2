import { notFound } from "next/navigation"

import { DistributeProfitButton } from "@/components/cars/distribute-profit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCarById } from "@/server/car"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(value)
}

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const result = await getCarById(params.id).catch(() => null)
  if (!result) {
    notFound()
  }

  const { car, metrics } = result

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">VIN {car.vin}</h1>
          <p className="text-sm text-muted-foreground">
            {car.make} {car.model} • {car.year}
          </p>
        </div>
        <DistributeProfitButton carId={car.id} profit={metrics.profitAed} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Себестоимость</CardTitle>
            <CardDescription>Покупка + прямые расходы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(metrics.buyCostAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(metrics.expensesAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(metrics.revenueAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прибыль</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(metrics.profitAed)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Расходы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {car.expenses.length ? (
                car.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.type.toLowerCase()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount * expense.fxRateToAed)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Нет данных
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доходы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {car.incomes.length ? (
                car.incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                    <TableCell>{income.description ?? income.paymentMethod ?? '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(income.amount * income.fxRateToAed)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Нет данных
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}