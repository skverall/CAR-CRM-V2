import * as XLSX from 'xlsx'

export type ImportReport = {
  investors: { created: number; updated: number; errors: string[] }
  vehicles: { created: number; updated: number; errors: string[] }
  expenses: { created: number; updated: number; errors: string[] }
  extra_income: { created: number; updated: number; errors: string[] }
  info: { updated: number; errors: string[] }
}

export function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return isFinite(v) ? v : null
  if (typeof v === 'string') {
    let s = v.trim().replace(/\s+/g, '')
    // keep only digits, separators, and sign
    s = s.replace(/[^0-9,.-]/g, '')
    const hasComma = s.includes(',')
    const hasDot = s.includes('.')
    if (hasComma && hasDot) {
      // decide decimal by last occurrence
      const lastComma = s.lastIndexOf(',')
      const lastDot = s.lastIndexOf('.')
      const decimalIsComma = lastComma > lastDot
      if (decimalIsComma) {
        // remove all dots (thousands), replace last comma with dot
        s = s.replace(/\./g, '')
        s = s.replace(/,/, '#').replace(/,/g, '').replace('#', '.')
      } else {
        // remove all commas (thousands)
        s = s.replace(/,/g, '')
      }
    } else if (hasComma && !hasDot) {
      // If there are three digits after comma, treat as thousands; else decimal
      const parts = s.split(',')
      const frac = parts[1] || ''
      if (frac.length === 3 && parts[0].length > 0) {
        s = parts.join('')
      } else {
        s = s.replace(',', '.')
      }
    }
    const n = Number(s)
    return isNaN(n) ? null : n
  }
  return null
}

export function parseDate(v: any): Date | null {
  if (!v && v !== 0) return null
  if (v instanceof Date) return v
  if (typeof v === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(v)
    if (!date) return null
    return new Date(Date.UTC(date.y, (date.m || 1) - 1, date.d || 1))
  }
  if (typeof v === 'string') {
    const s = v.trim()
    // YYYY-MM-DD
    const iso = /^\d{4}-\d{2}-\d{2}$/
    if (iso.test(s)) return new Date(s + 'T00:00:00Z')
    // DD.MM.YYYY
    const dot = /^(\d{2})\.(\d{2})\.(\d{4})$/
    const m = s.match(dot)
    if (m) {
      const d = Number(m[1])
      const mo = Number(m[2])
      const y = Number(m[3])
      return new Date(Date.UTC(y, mo - 1, d))
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function splitMakeModel(v: string | null | undefined): { make: string; model: string } {
  const s = (v || '').trim()
  if (!s) return { make: '', model: '' }
  const parts = s.split(/[\s\/|-]+/)
  if (parts.length === 1) return { make: parts[0], model: '' }
  return { make: parts[0], model: parts.slice(1).join(' ') }
}

export function detectTrimAndSpec(input: string | null | undefined): { trim: string | null; spec: string | null } {
  const s = (input || '').trim()
  if (!s) return { trim: null, spec: null }
  const specKeywords = ['R-Line', 'Sport', 'AMG', 'S-Line', 'M-Pack', 'NISMO', 'TRD']
  const found = specKeywords.find((k) => s.toLowerCase().includes(k.toLowerCase()))
  return { trim: s, spec: found || null }
}

export type SheetMap = {
  Investors?: XLSX.WorkSheet
  Inventory?: XLSX.WorkSheet
  INFO?: XLSX.WorkSheet
  Expenses?: XLSX.WorkSheet
  'Extra income'?: XLSX.WorkSheet
}

export function loadWorkbook(path: string) {
  const wb = XLSX.readFile(path, { cellDates: true })
  const sheets: SheetMap = {
    Investors: wb.Sheets['Investors'],
    Inventory: wb.Sheets['Inventory'],
    INFO: wb.Sheets['INFO'],
    Expenses: wb.Sheets['Expenses'],
    'Extra income': wb.Sheets['Extra income'],
  }
  return { wb, sheets }
}

export function sheetToJSON<T = any>(ws: XLSX.WorkSheet | undefined): T[] {
  if (!ws) return []
  return XLSX.utils.sheet_to_json<T>(ws, { defval: null })
}
