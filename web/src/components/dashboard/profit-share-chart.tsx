'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#1d4ed8', '#ea580c', '#16a34a']

type Props = {
  data: { label: string; amountAed: number }[]
}

export function ProfitShareChart({ data }: Props) {
  if (!data.length) {
    return <p className='text-sm text-muted-foreground'>No profit distribution available yet.</p>
  }

  return (
    <div className='h-72 w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie data={data} dataKey='amountAed' nameKey='label' innerRadius={60} strokeWidth={4}>
            {data.map((_, index) => (
              <Cell key={`profit-share-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(value),
              'Amount',
            ]}
            labelFormatter={(label) => label}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

