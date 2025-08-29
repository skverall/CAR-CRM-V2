"use client"
import { useEffect, useMemo, useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ExpenseRow } from '../../../lib/types'

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border rounded px-2 py-1 ${props.className || ''}`} />
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`border rounded px-2 py-1 ${props.className || ''}`} />
}

export default function ExpensesPage() {
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(false)
  const [investors, setInvestors] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState({ investorId: '', vehicleId: '', category: '', dateFrom: '', dateTo: '' })

  const [form, setForm] = useState({ date: '', amount: '', category: '', description: '', notes: '', investor_id: '', vehicle_id: '' })

  const columns = useMemo<ColumnDef<ExpenseRow>[]>(
    () => [
      { header: 'Date', accessorKey: 'date' },
      { header: 'Category', accessorKey: 'category' },
      { header: 'Amount', accessorKey: 'amount' },
      { header: 'Description', accessorKey: 'description' },
      { header: 'Notes', accessorKey: 'notes' },
    ],
    []
  )
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
    const res = await fetch('/api/expenses?' + params.toString(), { cache: 'no-store' })
    const json = await res.json()
    setRows(json.rows)
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/investors?type=options').then((r) => r.json()).then(setInvestors)
  }, [])
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.amount || !form.category) return
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        amount: Number(form.amount),
        category: form.category,
        description: form.description || undefined,
        notes: form.notes || undefined,
        investor_id: form.investor_id || undefined,
        vehicle_id: form.vehicle_id || undefined,
      }),
    })
    if (res.ok) {
      setForm({ date: '', amount: '', category: '', description: '', notes: '', investor_id: '', vehicle_id: '' })
      fetchData()
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Expenses</h1>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Select value={filters.investorId} onChange={(e) => setFilters({ ...filters, investorId: e.target.value })}>
          <option value="">All investors</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <TextInput placeholder="Vehicle ID" value={filters.vehicleId} onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })} />
        <TextInput placeholder="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} />
        <TextInput type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
        <TextInput type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
      </div>

      <form onSubmit={submitExpense} className="flex flex-wrap gap-2 items-end border rounded p-3">
        <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <TextInput type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <TextInput placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <TextInput placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <TextInput placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Select value={form.investor_id} onChange={(e) => setForm({ ...form, investor_id: e.target.value })}>
          <option value="">No investor</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <TextInput placeholder="Vehicle ID (optional)" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} />
        <button className="px-3 py-1 border rounded">Add Expense</button>
      </form>

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

