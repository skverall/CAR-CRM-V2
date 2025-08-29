"use client"
import { useEffect, useMemo, useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { InvestorPositionRow } from '@/src/lib/types'

export default function InvestorsPage() {
  const [rows, setRows] = useState<InvestorPositionRow[]>([])
  const [loading, setLoading] = useState(false)

  const columns = useMemo<ColumnDef<InvestorPositionRow>[]>(
    () => [
      { header: 'Investor', accessorKey: 'name' },
      { header: 'Initial Investment', accessorKey: 'initial_investment' },
      { header: 'Realized P&L', accessorKey: 'realized_pl' },
      { header: 'Returned Capital', accessorKey: 'returned_capital' },
      { header: 'Extra Income', accessorKey: 'extra_income' },
      { header: 'Current Deposit (Net)', accessorKey: 'current_deposit_net' },
      { header: 'Capital in Stock', accessorKey: 'capital_in_stock' },
      { header: 'Other Expenses', accessorKey: 'other_expenses' },
      { header: 'Total Money', accessorKey: 'total_money' },
      { header: 'Money Bank', accessorKey: 'money_bank' },
      { header: 'Money Cash', accessorKey: 'money_cash' },
    ],
    []
  )
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/investors', { cache: 'no-store' })
    const json = await res.json()
    setRows(json)
    setLoading(false)
  }
  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Investors</h1>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left p-2 border-b">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={columns.length}>
                  Loading...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="p-2 border-b">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

