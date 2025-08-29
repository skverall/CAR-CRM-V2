"use client"
import { useState } from 'react'

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setReport(null)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/import', { method: 'POST', body: form })
    const json = await res.json()
    setReport(json)
    setLoading(false)
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Data Import</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button disabled={!file || loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? 'Importing...' : 'Import'}
        </button>
      </form>
      {report && (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(report, null, 2)}</pre>
      )}
    </div>
  )
}

