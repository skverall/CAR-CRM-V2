"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewInventoryPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    purchase_date: new Date().toISOString().slice(0,10),
    vin: '',
    model: '',
    investor: '',
    status: 'in_stock',
    purchase_price: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
        })
      })
      const js = await res.json()
      if (!res.ok) throw new Error(js?.error || 'Failed to save')
      router.push('/investors')
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
      <h1>Новый объект инвентаря</h1>
      {error && <div style={{ color: '#f87171', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={onSubmit} className="form-grid">
        <input required type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        <input placeholder="VIN" value={form.vin} onChange={e => set('vin', e.target.value)} />
        <input placeholder="Модель" value={form.model} onChange={e => set('model', e.target.value)} />
        <input placeholder="Инвестор" value={form.investor} onChange={e => set('investor', e.target.value)} />
        <select value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="in_stock">В наличии</option>
          <option value="sold">Продано</option>
          <option value="scrapped">Списано</option>
        </select>
        <input type="number" step="0.01" placeholder="Цена покупки" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} />
        <input placeholder="Заметки" value={form.notes} onChange={e => set('notes', e.target.value)} className="col-span-2" />
        <div style={{ gridColumn: '1 / -1' }}>
          <button type="submit" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
        </div>
      </form>
    </main>
  )
}

