'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#2563eb', '#0891b2', '#f97316', '#16a34a', '#7c3aed', '#ef4444', '#0ea5e9', '#d97706']

type Props = {
  data: { type: string; amountAed: number }[]
}

export function ExpenseBreakdown({ data }: Props) {
  if (data.length === 0) {
    return <p className='text-sm text-muted-foreground'>No expenses recorded yet.</p>
  }

  return (
    <div className='h-72 w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie data={data} dataKey='amountAed' nameKey='type' innerRadius={60} strokeWidth={4}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value), '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

