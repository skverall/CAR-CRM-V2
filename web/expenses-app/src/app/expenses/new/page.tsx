"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewExpensePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    vin: '',
    model: '',
    description: '',
    category: '',
    investor: '',
    amount: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount)
        })
      })
      const js = await res.json()
      if (!res.ok) throw new Error(js?.error || 'Failed to save')
      const q = new URLSearchParams()
      if (form.investor) q.set('investor', form.investor)
      router.push(`/expenses?${q.toString()}`)
    } catch (err: any) {
      setError(String(err.message || err))
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  return (
    <main>
      <h1>Новый расход</h1>
      {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={onSubmit} className="form-grid">
        <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <input placeholder="VIN" value={form.vin} onChange={e => set('vin', e.target.value)} />
        <input placeholder="Модель" value={form.model} onChange={e => set('model', e.target.value)} />
        <input placeholder="Описание" value={form.description} onChange={e => set('description', e.target.value)} className="col-span-2" />
        <input placeholder="Категория" value={form.category} onChange={e => set('category', e.target.value)} />
        <input placeholder="Инвестор" value={form.investor} onChange={e => set('investor', e.target.value)} />
        <input required type="number" step="0.01" placeholder="Сумма" value={form.amount} onChange={e => set('amount', e.target.value)} />
        <input placeholder="Заметки" value={form.notes} onChange={e => set('notes', e.target.value)} className="col-span-2" />
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
        </div>
      </form>
    </main>
  )
}

