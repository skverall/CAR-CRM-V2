import { notFound } from 'next/navigation'

import { AddExpenseDialog } from '@/components/cars/add-expense-dialog'
import { AddIncomeDialog } from '@/components/cars/add-income-dialog'
import { CarStatusMenu } from '@/components/cars/car-status-menu'
import { DistributeProfitButton } from '@/components/cars/distribute-profit-button'
import { OperationsTimeline, TimelineItem } from '@/components/cars/operations-timeline'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CAR_STATUS_BADGE_VARIANT, CAR_STATUS_LABEL } from '@/constants/cars'
import { listCapitalAccounts } from '@/server/capital'
import { getCarById } from '@/server/car'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const [carResult, accounts] = await Promise.all([
    getCarById(params.id).catch(() => null),
    listCapitalAccounts(),
  ])

  if (!carResult) {
    notFound()
  }

  const { car, metrics } = carResult
  const directExpenses = car.expenses.filter((item) => !item.isPersonal)
  const directCosts = metrics.buyCostAed + metrics.expensesAed
  const roi = directCosts > 0 ? (metrics.profitAed / directCosts) * 100 : 0
  const profitPositive = metrics.profitAed > 0
  const investorShare = profitPositive ? metrics.profitAed * 0.5 : 0
  const assistantShare = profitPositive ? metrics.profitAed * 0.25 : 0
  const ownerShare = profitPositive ? metrics.profitAed * 0.25 : 0

  const carOption = {
    id: car.id,
    label: `${car.vin} • ${car.make} ${car.model} ${car.year}`,
  }

  const timelineItems: TimelineItem[] = []

  timelineItems.push({
    id: `buy-${car.id}`,
    type: 'buy',
    title: 'Покупка автомобиля',
    description: `${car.source ?? 'источник не указан'}`,
    date: car.buyDate,
    amountAed: metrics.buyCostAed,
    originalAmount: { value: car.buyPrice, currency: car.buyCurrency },
  })

  for (const expense of directExpenses) {
    const amountAed = expense.amount * expense.fxRateToAed
    timelineItems.push({
      id: `expense-${expense.id}`,
      type: 'expense',
      title: `Расход: ${expense.type.toLowerCase()}`,
      description: expense.description ?? undefined,
      date: expense.date,
      amountAed,
      originalAmount: { value: expense.amount, currency: expense.currency },
    })
  }

  for (const income of car.incomes) {
    const amountAed = income.amount * income.fxRateToAed
    timelineItems.push({
      id: `income-${income.id}`,
      type: 'income',
      title: 'Доход от продажи',
      description: income.description ?? income.buyerName ?? undefined,
      date: income.date,
      amountAed,
      originalAmount: { value: income.amount, currency: income.currency },
    })
  }

  const payoutTitles: Record<string, string> = {
    PAYOUT_INVESTOR: 'Выплата инвестору',
    PAYOUT_OWNER: 'Выплата владельцу',
    PAYOUT_ASSISTANT: 'Выплата помощнику',
  }

  for (const txn of car.capitalTxns) {
    if (!['PAYOUT_INVESTOR', 'PAYOUT_OWNER', 'PAYOUT_ASSISTANT'].includes(txn.reason)) continue
    if (txn.amountAed <= 0) continue
    timelineItems.push({
      id: `payout-${txn.id}`,
      type: 'payout',
      title: payoutTitles[txn.reason] ?? 'Выплата',
      description: txn.meta && typeof txn.meta === 'object' && 'recipient' in txn.meta ? String(txn.meta.recipient) : undefined,
      date: txn.date,
      amountAed: txn.amountAed,
    })
  }

  timelineItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-semibold tracking-tight'>{car.make} {car.model}</h1>
            <Badge variant={CAR_STATUS_BADGE_VARIANT[car.status as keyof typeof CAR_STATUS_BADGE_VARIANT] ?? 'outline'}>
              {CAR_STATUS_LABEL[car.status as keyof typeof CAR_STATUS_LABEL] ?? car.status}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>VIN {car.vin} • {car.year} • {car.buyCurrency} {car.buyPrice.toLocaleString('en-US')} по курсу {car.buyRate}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <CarStatusMenu carId={car.id} currentStatus={car.status} />
          <AddExpenseDialog accounts={accounts} cars={[carOption]} defaultCarId={car.id} />
          <AddIncomeDialog accounts={accounts} cars={[carOption]} defaultCarId={car.id} />
          <DistributeProfitButton carId={car.id} profit={metrics.profitAed} />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader>
            <CardTitle>Покупка</CardTitle>
            <CardDescription>Стоимость автомобиля в AED</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>{formatCurrency(metrics.buyCostAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прямые расходы</CardTitle>
            <CardDescription>Связанные с VIN расходы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>{formatCurrency(metrics.expensesAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Себестоимость</CardTitle>
            <CardDescription>Покупка + расходы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold'>{formatCurrency(directCosts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
            <CardDescription>Продажа и платежи</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-semibold text-emerald-600'>{formatCurrency(metrics.revenueAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прибыль</CardTitle>
            <CardDescription>По формуле доход − себестоимость</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${metrics.profitAed >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {formatCurrency(metrics.profitAed)}
            </p>
            <p className='text-xs text-muted-foreground'>ROI: {roi.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Паспорт авто</CardTitle>
            <CardDescription>Основные параметры и заметки</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className='grid gap-3 text-sm'>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>VIN</dt>
                <dd className='font-medium'>{car.vin}</dd>
              </div>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>Марка / модель</dt>
                <dd className='font-medium'>{car.make} {car.model}</dd>
              </div>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>Год</dt>
                <dd>{car.year}</dd>
              </div>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>Источник</dt>
                <dd>{car.source ?? '—'}</dd>
              </div>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>Дата покупки</dt>
                <dd>{new Date(car.buyDate).toLocaleDateString('ru-RU')}</dd>
              </div>
              <div className='grid grid-cols-[140px,1fr] gap-2'>
                <dt className='text-muted-foreground'>Заметки</dt>
                <dd>{car.notes ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Распределение прибыли</CardTitle>
            <CardDescription>50% инвестор, 25% помощник, 25% владелец</CardDescription>
          </CardHeader>
          <CardContent>
            {profitPositive ? (
              <div className='grid gap-3 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Инвестор</span>
                  <span className='font-medium'>{formatCurrency(investorShare)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Помощник</span>
                  <span className='font-medium'>{formatCurrency(assistantShare)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Владелец</span>
                  <span className='font-medium'>{formatCurrency(ownerShare)}</span>
                </div>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Положительная прибыль отсутствует — распределение недоступно.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Таймлайн операций</CardTitle>
          <CardDescription>Покупка, расходы, продажи и выплаты</CardDescription>
        </CardHeader>
        <CardContent>
          <OperationsTimeline items={timelineItems} />
        </CardContent>
      </Card>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Расходы</CardTitle>
            <CardDescription>Только расходы, привязанные к VIN</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead className='text-right'>Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directExpenses.length ? (
                  directExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className='capitalize'>{expense.type.toLowerCase()}</TableCell>
                        <TableCell className='capitalize'>{expense.paidFrom.toLowerCase()}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(expense.amount * expense.fxRateToAed)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-sm text-muted-foreground'>Нет расходов</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Доходы</CardTitle>
            <CardDescription>Все поступления по VIN</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Покупатель</TableHead>
                  <TableHead className='text-right'>Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {car.incomes.length ? (
                  car.incomes.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell>{new Date(income.date).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>{income.description ?? income.paymentMethod ?? '-'}</TableCell>
                      <TableCell>{income.buyerName ?? '-'}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(income.amount * income.fxRateToAed)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-sm text-muted-foreground'>Нет доходов</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
