"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value && value.trim() !== "") params.set(key, value)
  else params.delete(key)
}

function useDebounced(fn: () => void, delay: number, deps: any[]) {
  const t = useRef<any>(null)
  useEffect(() => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(fn, delay)
    return () => t.current && clearTimeout(t.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export default function Filters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const initial = useMemo(() => ({
    from: sp?.get('from') ?? '',
    to: sp?.get('to') ?? '',
    vin: sp?.get('vin') ?? '',
    model: sp?.get('model') ?? '',
    category: sp?.get('category') ?? '',
    investor: sp?.get('investor') ?? '',
    q: sp?.get('q') ?? '',
    pageSize: sp?.get('pageSize') ?? '50',
  }), [sp])

  const [form, setForm] = useState(initial)

  // keep local state in sync on url change
  useEffect(() => {
    setForm(initial)
  }, [initial])

  // Debounced URL update
  useDebounced(() => {
    const params = new URLSearchParams(sp?.toString())
    for (const [k, v] of Object.entries(form)) {
      setParam(params, k, String(v))
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, 300, [form.from, form.to, form.vin, form.model, form.category, form.investor, form.q, form.pageSize])

  const onChange = useCallback((key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }, [])

  const onReset = useCallback(() => {
    router.replace(pathname)
  }, [router, pathname])

  const exportHref = useMemo(() => {
    const params = new URLSearchParams(sp?.toString())
    params.set("limit", "100000")
    return `/expenses/export?${params.toString()}`
  }, [sp])

  const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
  const setRange = useCallback((from?: Date, to?: Date) => {
    const params = new URLSearchParams(sp?.toString())
    if (from) params.set('from', fmtDate(from)); else params.delete('from')
    if (to) params.set('to', fmtDate(to)); else params.delete('to')
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, sp])

  const presets = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    return {
      thisMonth: { from: startOfMonth, to: endOfMonth },
      lastMonth: { from: prevStart, to: prevEnd },
      thisYear: { from: startOfYear, to: now },
    }
  }, [])

  return (
    <form onSubmit={(e) => e.preventDefault()} className="toolbar" role="search">
      <input name="from" placeholder="От (ГГГГ-ММ-ДД)" value={form.from} onChange={onChange("from")} />
      <input name="to" placeholder="До (ГГГГ-ММ-ДД)" value={form.to} onChange={onChange("to")} />
      <input name="vin" placeholder="VIN" value={form.vin} onChange={onChange("vin")} />
      <input name="model" placeholder="Модель" value={form.model} onChange={onChange("model")} />
      <input name="category" placeholder="Категория" value={form.category} onChange={onChange("category")} />
      <input name="investor" placeholder="Инвестор" value={form.investor} onChange={onChange("investor")} />
      <input name="q" placeholder="Поиск по описанию/заметкам" value={form.q} onChange={onChange("q")} className="col-span-3" />
      <select name="pageSize" value={form.pageSize} onChange={onChange("pageSize")}>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="200">200</option>
      </select>
      <button type="button" onClick={onReset}>Сбросить</button>
      <Link href={exportHref} role="button">Экспорт CSV</Link>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setRange(presets.thisMonth.from, presets.thisMonth.to)}>Этот месяц</button>
        <button type="button" onClick={() => setRange(presets.lastMonth.from, presets.lastMonth.to)}>Прошлый месяц</button>
        <button type="button" onClick={() => setRange(presets.thisYear.from, presets.thisYear.to)}>Этот год</button>
      </div>
    </form>
  )
}

