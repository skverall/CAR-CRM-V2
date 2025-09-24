'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import { CAR_STATUS_BADGE_VARIANT, CAR_STATUS_LABEL } from '@/constants/cars'
import { AddCarDialog } from '@/components/cars/add-car-dialog'
import { AddExpenseDialog } from '@/components/cars/add-expense-dialog'
import { AddIncomeDialog } from '@/components/cars/add-income-dialog'
import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export type CarListItem = {
  id: string
  vin: string
  make: string
  model: string
  year: number
  status: string
  buyDate: string
  buyPrice: number
  buyCurrency: string
  buyRate: number
  source?: string | null
  createdAt: string
  metrics: {
    buyCostAed: number
    expensesAed: number
    revenueAed: number
    profitAed: number
    roiPercentage: number
  }
}

type AccountOption = {
  id: string
  name: string
  type: string
}

export function CarsClient({ cars }: { cars: CarListItem[] }) {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<AccountOption[]>([])

  useEffect(() => {
    let mounted = true

    async function loadAccounts() {
      try {
        const response = await fetch('/api/capital/accounts')
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? 'Не удалось получить счета')
        }
        const data = await response.json()
        if (mounted) setAccounts(data)
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось получить данные счетов',
          variant: 'destructive',
        })
      } finally {
        // intentionally left blank
      }
    }

    loadAccounts()
    return () => {
      mounted = false
    }
  }, [toast])

  const carOptions = useMemo(
    () => cars.map((car) => ({ id: car.id, label: `${car.vin} • ${car.make} ${car.model} ${car.year}` })),
    [cars],
  )

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0,
      }).format(value),
    [],
  )

  const columns = useMemo<ColumnDef<CarListItem>[]>(
    () => [
      {
        accessorKey: 'vin',
        header: 'VIN',
      },
      {
        accessorKey: 'make',
        header: 'Авто',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <span className='font-medium'>{row.original.make} {row.original.model}</span>
            <span className='text-xs text-muted-foreground'>{row.original.year}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => (
          <Badge variant={CAR_STATUS_BADGE_VARIANT[row.original.status as keyof typeof CAR_STATUS_BADGE_VARIANT] ?? 'outline'}>
            {CAR_STATUS_LABEL[row.original.status as keyof typeof CAR_STATUS_LABEL] ?? row.original.status}
          </Badge>
        ),
      },
      {
        header: 'Покупка',
        cell: ({ row }) => formatCurrency(row.original.metrics.buyCostAed),
      },
      {
        header: 'Расходы',
        cell: ({ row }) => formatCurrency(row.original.metrics.expensesAed),
      },
      {
        header: 'Выручка',
        cell: ({ row }) => formatCurrency(row.original.metrics.revenueAed),
      },
      {
        header: 'Прибыль',
        cell: ({ row }) => (
          <span className={row.original.metrics.profitAed >= 0 ? 'text-emerald-600' : 'text-destructive'}>
            {formatCurrency(row.original.metrics.profitAed)}
          </span>
        ),
      },
      {
        header: 'ROI %',
        cell: ({ row }) => `${row.original.metrics.roiPercentage.toFixed(1)}%`,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link href={`/cars/${row.original.id}`}>Открыть</Link>
            </Button>
            <AddExpenseDialog accounts={accounts} cars={carOptions} defaultCarId={row.original.id} />
            <AddIncomeDialog accounts={accounts} cars={carOptions} defaultCarId={row.original.id} />
          </div>
        ),
      },
    ],
    [accounts, carOptions, formatCurrency],
  )

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-2xl font-semibold tracking-tight'>Автомобили</h1>
        <div className='flex flex-wrap gap-2'>
          <AddExpenseDialog accounts={accounts} cars={carOptions} />
          <AddIncomeDialog accounts={accounts} cars={carOptions} />
          <AddCarDialog accounts={accounts} />
        </div>
      </div>
      <DataTable columns={columns} data={cars} searchKey='vin' placeholder='Поиск по VIN' />
    </div>
  )
}
