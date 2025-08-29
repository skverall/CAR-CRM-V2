"use client"
import { useEffect, useMemo, useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { VehicleRow } from '../../../lib/types'

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border rounded px-2 py-1 ${props.className || ''}`} />
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`border rounded px-2 py-1 ${props.className || ''}`} />
}

export default function VehiclesPage() {
  const [data, setData] = useState<VehicleRow[]>([])
  const [loading, setLoading] = useState(false)
  const [investors, setInvestors] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState({ status: '', investorId: '', q: '', year: '', roiMin: '', roiMax: '' })

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v))
    const res = await fetch('/api/vehicles?' + params.toString(), { cache: 'no-store' })
    const rows = await res.json()
    setData(rows)
    setLoading(false)
  }
  useEffect(() => {
    fetch('/api/investors?type=options').then((r) => r.json()).then(setInvestors)
  }, [])
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const columns = useMemo<ColumnDef<VehicleRow>[]>(
    () => [
      { header: 'VIN', accessorKey: 'vin' },
      { header: 'Make', accessorKey: 'make' },
      { header: 'Model', accessorKey: 'model' },
      { header: 'Year', accessorKey: 'year' },
      { header: 'Investor', accessorKey: 'investor_name' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Purchased', accessorKey: 'date_purchased' },
      { header: 'Purchase Price', accessorKey: 'purchase_price' },
      { header: 'Total Cost', accessorKey: 'total_cost' },
      { header: 'Sold Price', accessorKey: 'sold_price' },
      { header: 'ROI', accessorKey: 'roi' },
      {
        header: 'Actions',
        cell: ({ row }) => <RowActions row={row.original} onUpdated={fetchData} />,
      },
    ],
    []
  )

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Vehicles</h1>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option>On Sale</option>
          <option>Sold</option>
          <option>Reserved</option>
          <option>In Transit</option>
        </Select>
        <Select value={filters.investorId} onChange={(e) => setFilters({ ...filters, investorId: e.target.value })}>
          <option value="">All investors</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </Select>
        <TextInput placeholder="Make/Model/VIN" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <TextInput placeholder="Year" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} />
        <TextInput placeholder="ROI min" value={filters.roiMin} onChange={(e) => setFilters({ ...filters, roiMin: e.target.value })} />
        <TextInput placeholder="ROI max" value={filters.roiMax} onChange={(e) => setFilters({ ...filters, roiMax: e.target.value })} />
      </div>
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

function RowActions({ row, onUpdated }: { row: VehicleRow; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [soldPrice, setSoldPrice] = useState('')
  const [soldDate, setSoldDate] = useState('')
  const markAsSold = async () => {
    if (!soldPrice || !soldDate) return
    const res = await fetch(`/api/vehicles/${row.id}/sold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sold_price: Number(soldPrice), date_sold: soldDate }),
    })
    if (res.ok) {
      setOpen(false)
      onUpdated()
    }
  }
  return (
    <div className="flex gap-2 items-center">
      <button className="px-2 py-1 border rounded" onClick={() => setOpen((v) => !v)} disabled={row.status === 'Sold'}>
        Mark as Sold
      </button>
      {open && (
        <div className="flex gap-2 items-center">
          <TextInput type="number" step="0.01" placeholder="Sold Price" value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} />
          <TextInput type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
          <button className="px-2 py-1 border rounded" onClick={markAsSold}>
            Save
          </button>
        </div>
      )}
      {/* Placeholders for future features */}
      <button className="px-2 py-1 border rounded" disabled>
        Add Expense
      </button>
      <button className="px-2 py-1 border rounded" disabled>
        Upload Photos
      </button>
      <button className="px-2 py-1 border rounded" disabled>
        Duplicate
      </button>
    </div>
  )
}

