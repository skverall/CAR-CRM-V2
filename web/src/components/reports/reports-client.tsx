'use client'

import { useState, useTransition } from 'react'
import { endOfMonth, endOfQuarter, endOfYear, formatISO, startOfMonth, startOfQuarter, startOfYear } from 'date-fns'
import { Download, Loader2, RefreshCw } from 'lucide-react'

import { ExpenseBreakdown } from '@/components/dashboard/expense-breakdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

type ReportSummary = {
  filters: { from: string | null; to: string | null }
  totals: {
    revenueAed: number
    directExpensesAed: number
    generalExpensesAed: number
    profitAed: number
  }
  cars: Array<{
    id: string
    vin: string
    make: string
    model: string
    year: number
    source: string | null
    buyCostAed: number
    expensesAed: number
    revenueAed: number
    profitAed: number
  }>
  expenseByType: Array<{ type: string; amountAed: number }>
  revenueBySource: Array<{ source: string; amountAed: number }>
}

type Props = {
  initialSummary: ReportSummary
}

const quickRanges = [
  {
    label: 'Этот месяц',
    getRange: () => {
      const now = new Date()
      return {
        from: formatISO(startOfMonth(now), { representation: 'date' }),
        to: formatISO(endOfMonth(now), { representation: 'date' }),
      }
    },
  },
  {
    label: 'Этот квартал',
    getRange: () => {
      const now = new Date()
      return {
        from: formatISO(startOfQuarter(now), { representation: 'date' }),
        to: formatISO(endOfQuarter(now), { representation: 'date' }),
      }
    },
  },
  {
    label: 'Этот год',
    getRange: () => {
      const now = new Date()
      return {
        from: formatISO(startOfYear(now), { representation: 'date' }),
        to: formatISO(endOfYear(now), { representation: 'date' }),
      }
    },
  },
]

export function ReportsClient({ initialSummary }: Props) {
  const { toast } = useToast()
  const [summary, setSummary] = useState<ReportSummary>(initialSummary)
  const [from, setFrom] = useState<string>(initialSummary.filters.from?.slice(0, 10) ?? '')
  const [to, setTo] = useState<string>(initialSummary.filters.to?.slice(0, 10) ?? '')
  const [isPending, startTransition] = useTransition()

  const applyFilters = (nextFrom?: string, nextTo?: string) => {
    const search = new URLSearchParams()
    if (nextFrom) search.set('from', nextFrom)
    if (nextTo) search.set('to', nextTo)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/reports/summary?${search.toString()}`, { cache: 'no-store' })
        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error ?? 'Не удалось получить отчёт')
        }
        const data: ReportSummary = await response.json()
        setSummary(data)
        setFrom(data.filters.from?.slice(0, 10) ?? '')
        setTo(data.filters.to?.slice(0, 10) ?? '')
      } catch (error) {
        toast({
          title: 'Ошибка отчёта',
          description: error instanceof Error ? error.message : 'Не удалось обновить отчёт',
          variant: 'destructive',
        })
      }
    })
  }

  const downloadCsv = (rows: string[][], prefix: string) => {
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportCarsCsv = () => {
    const header = ['vin', 'make', 'model', 'year', 'source', 'revenue_aed', 'buy_cost_aed', 'expenses_aed', 'profit_aed']
    const lines = [header]
    summary.cars.forEach((car) => {
      lines.push([
        car.vin,
        car.make,
        car.model,
        car.year.toString(),
        car.source ?? '—',
        car.revenueAed.toString(),
        car.buyCostAed.toString(),
        car.expensesAed.toString(),
        car.profitAed.toString(),
      ])
    })
    downloadCsv(lines, 'report-cars')
  }

  const exportExpensesCsv = () => {
    const header = ['type', 'amount_aed']
    const lines = [header]
    summary.expenseByType.forEach((item) => {
      lines.push([item.type, item.amountAed.toString()])
    })
    downloadCsv(lines, 'report-expenses')
  }

  const directCosts = summary.totals.directExpensesAed
  const totalCosts = directCosts + summary.totals.generalExpensesAed

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Отчёты</h1>
          <p className='text-sm text-muted-foreground'>Сводная аналитика по VIN, расходам и источникам</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Input type='date' value={from} onChange={(event) => setFrom(event.target.value)} className='w-[150px]' />
          <Input type='date' value={to} onChange={(event) => setTo(event.target.value)} className='w-[150px]' />
          <Button
            variant='outline'
            size='sm'
            onClick={() => applyFilters(from || undefined, to || undefined)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <RefreshCw className='mr-2 h-4 w-4' />}
            Обновить
          </Button>
          {quickRanges.map((range) => (
            <Button
              key={range.label}
              variant='ghost'
              size='sm'
              onClick={() => {
                const preset = range.getRange()
                setFrom(preset.from)
                setTo(preset.to)
                applyFilters(preset.from, preset.to)
              }}
              disabled={isPending}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
            <CardDescription>Сумма продаж за период</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold text-emerald-600'>{formatCurrency(summary.totals.revenueAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прямые расходы</CardTitle>
            <CardDescription>Покупка + расходы по VIN</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold text-destructive'>{formatCurrency(directCosts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Общие расходы</CardTitle>
            <CardDescription>Без привязки к VIN</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{formatCurrency(summary.totals.generalExpensesAed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прибыль</CardTitle>
            <CardDescription>Выручка − все расходы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-semibold ${summary.totals.profitAed >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {formatCurrency(summary.totals.profitAed)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle>Рентабельность по VIN</CardTitle>
            <CardDescription>Покупка, расходы, выручка и прибыль по каждому автомобилю</CardDescription>
          </div>
          <Button variant='outline' size='sm' onClick={exportCarsCsv}>
            <Download className='mr-2 h-4 w-4' /> Экспорт CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className='rounded-xl border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Авто</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Выручка</TableHead>
                  <TableHead>Себестоимость</TableHead>
                  <TableHead>Расходы</TableHead>
                  <TableHead className='text-right'>Прибыль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.cars.length ? (
                  summary.cars.map((car) => {
                    const totalCost = car.buyCostAed + car.expensesAed
                    return (
                      <TableRow key={car.id}>
                        <TableCell>{car.vin}</TableCell>
                        <TableCell>{car.make} {car.model}</TableCell>
                        <TableCell>{car.source ?? '—'}</TableCell>
                        <TableCell>{formatCurrency(car.revenueAed)}</TableCell>
                        <TableCell>{formatCurrency(car.buyCostAed)}</TableCell>
                        <TableCell>{formatCurrency(car.expensesAed)}</TableCell>
                        <TableCell className={`text-right ${car.profitAed >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {formatCurrency(car.profitAed)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center text-sm text-muted-foreground'>Нет данных за выбранный период</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader className='flex items-center justify-between gap-2'>
            <div>
              <CardTitle>Структура расходов</CardTitle>
              <CardDescription>Распределение прямых затрат</CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={exportExpensesCsv}>
              <Download className='mr-2 h-4 w-4' /> Экспорт CSV
            </Button>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdown data={summary.expenseByType.map((item) => ({ type: item.type, amountAed: item.amountAed }))} />
            <div className='mt-4 rounded-xl border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Категория</TableHead>
                    <TableHead className='text-right'>Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.expenseByType.length ? (
                    summary.expenseByType.map((item) => (
                      <TableRow key={item.type}>
                        <TableCell className='capitalize'>{item.type}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amountAed)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className='text-center text-sm text-muted-foreground'>Нет данных</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Выручка по источникам</CardTitle>
            <CardDescription>Сумма продаж по источнику закупки</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-xl border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Источник</TableHead>
                    <TableHead className='text-right'>Выручка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.revenueBySource.length ? (
                    summary.revenueBySource.map((item) => (
                      <TableRow key={item.source}>
                        <TableCell>{item.source}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.amountAed)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className='text-center text-sm text-muted-foreground'>Нет данных</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
