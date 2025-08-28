"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useCallback } from "react"

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value && value.trim() !== "") params.set(key, value)
  else params.delete(key)
}

export default function Filters() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const onChange = useCallback((key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const params = new URLSearchParams(sp?.toString())
    setParam(params, key, e.target.value)
    // сбрасываем страницу при изменении фильтра
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, sp])

  const onReset = useCallback(() => {
    router.replace(pathname)
  }, [router, pathname])

  const exportHref = (() => {
    const params = new URLSearchParams(sp?.toString())
    params.set("limit", "100000")
    return `/expenses/export?${params.toString()}`
  })()

  return (
    <form onSubmit={(e) => e.preventDefault()} className="toolbar" role="search">
      <input name="from" placeholder="От (ГГГГ-ММ-ДД)" defaultValue={sp?.get("from") ?? ""} onChange={onChange("from")} />
      <input name="to" placeholder="До (ГГГГ-ММ-ДД)" defaultValue={sp?.get("to") ?? ""} onChange={onChange("to")} />
      <input name="vin" placeholder="VIN" defaultValue={sp?.get("vin") ?? ""} onChange={onChange("vin")} />
      <input name="model" placeholder="Модель" defaultValue={sp?.get("model") ?? ""} onChange={onChange("model")} />
      <input name="category" placeholder="Категория" defaultValue={sp?.get("category") ?? ""} onChange={onChange("category")} />
      <input name="investor" placeholder="Инвестор" defaultValue={sp?.get("investor") ?? ""} onChange={onChange("investor")} />
      <input name="q" placeholder="Поиск в описании/заметках" defaultValue={sp?.get("q") ?? ""} onChange={onChange("q")} className="col-span-3" />
      <select name="pageSize" defaultValue={sp?.get("pageSize") ?? "50"} onChange={onChange("pageSize")}>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="200">200</option>
      </select>
      <button type="button" onClick={onReset}>Сбросить</button>
      <Link href={exportHref} role="button">Экспорт CSV</Link>
    </form>
  )
}

