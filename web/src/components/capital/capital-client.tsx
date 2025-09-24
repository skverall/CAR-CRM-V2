'use client'

import { useMemo, useState } from 'react'
import { Download, PlusCircle, Wallet } from 'lucide-react'

import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { ManualTxnDialog } from '@/components/capital/manual-txn-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CapitalTxnReason } from '@prisma/client'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

type Account = {
  id: string
  name: string
  type: string
  balanceAed: number
}

type CapitalTxn = {
  id: string
  account: {
    id: string
    name: string
    type: string
  }
  amountAed: number
  date: string
  reason: string
  car: {
    id: string
    vin: string
    make: string
    model: string
    year: number
  } | null
  meta: Record<string, unknown> | null
}

type Props = {
  accounts: Account[]
  transactions: CapitalTxn[]
}

export function CapitalClient({ accounts, transactions }: Props) {
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (accountFilter !== 'all' && txn.account.id !== accountFilter) return false
      if (reasonFilter !== 'all' && txn.reason !== reasonFilter) return false

      const day = txn.date.slice(0, 10)
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false

      return true
    })
  }, [transactions, accountFilter, reasonFilter, dateFrom, dateTo])

  const reasonOptions = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((txn) => set.add(txn.reason))
    return Array.from(set).sort()
  }, [transactions])

  const chartData = useMemo(() => {
    const daily = new Map<string, number>()
    const source = filteredTransactions.length ? filteredTransactions : transactions
    source.forEach((txn) => {
      const day = txn.date.slice(0, 10)
      daily.set(day, (daily.get(day) ?? 0) + txn.amountAed)
    })
    return Array.from(daily.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, amount]) => ({ date, amount }))
  }, [filteredTransactions, transactions])

  const exportCsv = () => {
    const rows = filteredTransactions.length ? filteredTransactions : transactions
    const header = ['date', 'account', 'type', 'reason', 'amount_aed', 'car', 'note']
    const lines = [header]

    rows.forEach((txn) => {
      const note = txn.meta && typeof txn.meta === 'object' && 'note' in txn.meta ? String((txn.meta as Record<string, unknown>).note) : ''
      const carLabel = txn.car ? `${txn.car.vin} ${txn.car.make}` : ''
      lines.push([
        txn.date,
        txn.account.name,
        txn.account.type,
        txn.reason,
        txn.amountAed.toString(),
        carLabel,
        note,
      ])
    })

    const csv = lines
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `capital-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalBalance = accounts.reduce((total, account) => total + account.balanceAed, 0)

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Капитал</h1>
          <p className='text-sm text-muted-foreground'>Баланс по счетам и журнал движений</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <ManualTxnDialog
            accounts={accounts}
            trigger={
              <Button size='sm' variant='default'>
                <PlusCircle className='mr-2 h-4 w-4' /> Депозит инвестора
              </Button>
            }
            reason={CapitalTxnReason.DEPOSIT_INVESTOR}
            lockReason
            dialogTitle='Депозит инвестора'
            description='Зачисление средств от инвестора в AED.'
            successMessage='Депозит сохранён'
          />
          <ManualTxnDialog
            accounts={accounts}
            trigger={
              <Button size='sm' variant='secondary'>
                <Wallet className='mr-2 h-4 w-4' /> Вывод владельца
              </Button>
            }
            reason={CapitalTxnReason.WITHDRAW_OWNER}
            lockReason
            dialogTitle='Вывод владельца'
            description='Списание средств в пользу владельца.'
            successMessage='Вывод сохранён'
          />
          <ManualTxnDialog accounts={accounts} triggerLabel='Произвольная операция' triggerVariant='outline' />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle>Совокупный баланс</CardTitle>
            <CardDescription>Сумма по всем счетам</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-semibold'>{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
              <CardDescription className='capitalize'>{account.type.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-semibold'>{formatCurrency(account.balanceAed)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle>Фильтры журнала</CardTitle>
            <CardDescription>Выберите счёт, основание и период</CardDescription>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Счёт' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Все счета</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Основание' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Все основания</SelectItem>
                {reasonOptions.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type='date' value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className='w-[160px]' />
            <Input type='date' value={dateTo} onChange={(event) => setDateTo(event.target.value)} className='w-[160px]' />
            <Button variant='outline' size='sm' onClick={exportCsv}>
              <Download className='mr-2 h-4 w-4' /> Экспорт CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 lg:grid-cols-[2fr,1fr]'>
            <div className='rounded-xl border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Счёт</TableHead>
                    <TableHead>Основание</TableHead>
                    <TableHead>Связь</TableHead>
                    <TableHead className='text-right'>Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length ? (
                    filteredTransactions.map((txn) => {
                      const note = txn.meta && typeof txn.meta === 'object' && 'note' in txn.meta ? String((txn.meta as Record<string, unknown>).note) : undefined
                      const isOutflow = txn.amountAed < 0
                      const carLabel = txn.car ? `${txn.car.vin} · ${txn.car.make}` : '—'

                      return (
                        <TableRow key={txn.id}>
                          <TableCell>{new Date(txn.date).toLocaleDateString('ru-RU')}</TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{txn.account.name}</span>
                              <span className='text-xs text-muted-foreground capitalize'>{txn.account.type.toLowerCase()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>{txn.reason.toLowerCase()}</Badge>
                            {note ? <p className='text-xs text-muted-foreground'>{note}</p> : null}
                          </TableCell>
                          <TableCell>{carLabel}</TableCell>
                          <TableCell className={`text-right ${isOutflow ? 'text-destructive' : 'text-emerald-600'}`}>
                            {formatCurrency(txn.amountAed)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-sm text-muted-foreground'>Нет операций</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Card className='shadow-none md:shadow-sm'>
              <CardHeader>
                <CardTitle>Динамика поступлений</CardTitle>
                <CardDescription>Net cashflow по дням</CardDescription>
              </CardHeader>
              <CardContent className='pl-2'>
                <CashflowChart data={chartData} />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

