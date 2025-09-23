'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'


type Props = {
  data: { date: string; amount: number }[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export function CashflowChart({ data }: Props) {
  return (
    <div className='h-72 w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data}>
          <defs>
            <linearGradient id='cashflowGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='hsl(var(--primary))' stopOpacity={0.8} />
              <stop offset='95%' stopColor='hsl(var(--primary))' stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='4 4' stroke='hsl(var(--muted-foreground)/0.2)' />
          <XAxis dataKey='date' tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} formatter={(value: number) => [formatCurrency(value), '']} />
          <Area type='monotone' dataKey='amount' stroke='hsl(var(--primary))' fill='url(#cashflowGradient)' />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}


