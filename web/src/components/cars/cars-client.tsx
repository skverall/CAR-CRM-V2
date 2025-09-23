'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

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
  const router = useRouter()
  const { toast } = useToast()
  const [accounts, setAccounts] = React.useState<AccountOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const response = await fetch('/api/capital/accounts')
        if (!response.ok) throw new Error('Не удалось загрузить счета')
        const data = await response.json()
        if (mounted) setAccounts(data)
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось загрузить данные',
          variant: 'destructive',
        })
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [toast])

  const carOptions = React.useMemo(
    () => cars.map((car) => ({ id: car.id, label: `${car.vin} • ${car.make} ${car.model} ${car.year}` })),
    [cars],
  )

  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  const columns = React.useMemo<ColumnDef<CarListItem>[]>(
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
        cell: ({ row }) => <Badge>{row.original.status.toLowerCase()}</Badge>,
      },
      {
        header: 'Себестоимость',
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
              <Link href={`/cars/${row.original.id}`}>Детали</Link>
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

