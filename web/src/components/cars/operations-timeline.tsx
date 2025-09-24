'use client'

import type { ReactNode } from 'react'
import { Car, CircleDollarSign, HandCoins, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export type TimelineKind = 'buy' | 'expense' | 'income' | 'payout'

export type TimelineItem = {
  id: string
  type: TimelineKind
  title: string
  description?: string
  date: string
  amountAed: number
  originalAmount?: {
    value: number
    currency: string
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Math.abs(value))
}

const ICONS: Record<TimelineKind, ReactNode> = {
  buy: <Car className='h-3.5 w-3.5' />,
  expense: <Wrench className='h-3.5 w-3.5' />,
  income: <CircleDollarSign className='h-3.5 w-3.5' />,
  payout: <HandCoins className='h-3.5 w-3.5' />,
}

export function OperationsTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return <p className='text-sm text-muted-foreground'>Операции по автомобилю ещё не зарегистрированы.</p>
  }

  return (
    <ol className='relative space-y-4 border-l pl-6'>
      {items.map((item) => {
        const isOutflow = item.type === 'expense' || item.type === 'payout' || item.type === 'buy'
        const sign = isOutflow ? '-' : '+'
        const tone =
          item.type === 'payout'
            ? 'text-amber-600'
            : isOutflow
              ? 'text-destructive'
              : 'text-emerald-600'

        return (
          <li key={item.id} className='relative'>
            <span className='absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground'>
              {ICONS[item.type]}
            </span>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <p className='text-sm font-medium'>{item.title}</p>
                {item.description ? <p className='text-xs text-muted-foreground'>{item.description}</p> : null}
              </div>
              <Badge variant={item.type === 'income' ? 'default' : item.type === 'payout' ? 'secondary' : 'outline'}>
                {new Date(item.date).toLocaleDateString('ru-RU')}
              </Badge>
            </div>
            <div className='mt-2 flex items-center gap-2 text-sm'>
              <span className={tone}>
                {sign}
                {formatCurrency(item.amountAed)}
              </span>
              {item.originalAmount && item.originalAmount.currency !== 'AED' ? (
                <span className='text-xs text-muted-foreground'>
                  {item.originalAmount.value.toLocaleString('en-US')} {item.originalAmount.currency}
                </span>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
