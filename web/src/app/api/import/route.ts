import { NextRequest } from 'next/server'
import { prisma } from '@/src/server/db'
import { Prisma } from '@/src/generated/prisma'
import * as XLSX from 'xlsx'
import { parseDate, parseNumber, splitMakeModel, detectTrimAndSpec } from '@/src/lib/excel'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 })
  const buf = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })
  const sheets = {
    Investors: wb.Sheets['Investors'],
    Inventory: wb.Sheets['Inventory'],
    INFO: wb.Sheets['INFO'],
    Expenses: wb.Sheets['Expenses'],
    ExtraIncome: wb.Sheets['Extra income'],
  }
  const toJSON = (ws: XLSX.WorkSheet | undefined) => (ws ? XLSX.utils.sheet_to_json<any>(ws, { defval: null }) : [])
  const report = {
    investors: { created: 0, updated: 0, errors: [] as string[] },
    vehicles: { created: 0, updated: 0, errors: [] as string[] },
    expenses: { created: 0, updated: 0, errors: [] as string[] },
    extra_income: { created: 0, updated: 0, errors: [] as string[] },
    info: { updated: 0, errors: [] as string[] },
  }

  // Investors
  for (const row of toJSON(sheets.Investors)) {
    const name = (row.Investor || '').toString().trim()
    if (!name || name.toLowerCase() === 'totals') continue
    const initial = parseNumber(row['Initial Investment']) ?? 0
    try {
      const existing = await prisma.investors.findUnique({ where: { name } })
      if (existing) {
        await prisma.investors.update({ where: { id: existing.id }, data: { initial_investment: new Prisma.Decimal(initial) } })
        report.investors.updated++
      } else {
        await prisma.investors.create({ data: { name, initial_investment: new Prisma.Decimal(initial) } })
        report.investors.created++
      }
    } catch (e: any) {
      report.investors.errors.push(`Investor ${name}: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Investors', row: row as any, error: e.message } })
    }
  }

  // Inventory
  for (const row of toJSON(sheets.Inventory)) {
    const vin = row.VIN != null ? String(row.VIN) : null
    const { make, model } = splitMakeModel(row['Make/Model'] || '')
    const year = parseNumber(row.Year)
    const { trim, spec } = detectTrimAndSpec(row['Trim / Spec'])
    const status = (row.Status || 'On Sale') as any
    const date_purchased = parseDate(row['Date Purchased'])
    const investorName = (row.Investor || '').toString().trim()
    const investor = investorName ? await prisma.investors.findUnique({ where: { name: investorName } }) : null
    if (!investor) continue
    const purchase_price = parseNumber(row['Purchase Price']) ?? 0
    const total_cost = parseNumber(row['Total Cost']) ?? 0
    const list_price = parseNumber(row['List Price'])
    const sold_price = parseNumber(row['Sold Price'])
    const date_sold = parseDate(row['Date Sold'])
    const notes = row.Notes || null
    if (!make || !year || !date_purchased) continue
    try {
      if (vin) {
        const existing = await prisma.vehicles.findUnique({ where: { vin } })
        if (existing) {
          await prisma.vehicles.update({
            where: { id: existing.id },
            data: {
              make, model, year: year!, trim, spec, status, date_purchased: date_purchased!, investor_id: investor.id,
              purchase_price: new Prisma.Decimal(purchase_price), total_cost: new Prisma.Decimal(total_cost),
              list_price: list_price != null ? new Prisma.Decimal(list_price) : undefined,
              sold_price: sold_price != null ? new Prisma.Decimal(sold_price) : undefined,
              date_sold: date_sold || undefined,
              notes: notes || undefined,
            }
          })
          report.vehicles.updated++
        } else {
          await prisma.vehicles.create({
            data: {
              vin, make, model, year: year!, trim, spec, status, date_purchased: date_purchased!, investor_id: investor.id,
              purchase_price: new Prisma.Decimal(purchase_price), total_cost: new Prisma.Decimal(total_cost),
              list_price: list_price != null ? new Prisma.Decimal(list_price) : undefined,
              sold_price: sold_price != null ? new Prisma.Decimal(sold_price) : undefined,
              date_sold: date_sold || undefined,
              notes: notes || undefined,
            }
          })
          report.vehicles.created++
        }
      }
    } catch (e: any) {
      report.vehicles.errors.push(`Vehicle VIN ${vin || 'N/A'}: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Inventory', row: row as any, error: e.message } })
    }
  }

  // INFO
  for (const row of toJSON(sheets.INFO)) {
    const id = row.ID != null ? String(row.ID) : null
    if (!id) continue
    const v = await prisma.vehicles.findUnique({ where: { vin: id } }).catch(() => null)
    if (!v) continue
    try {
      await prisma.vehicles.update({
        where: { id: v.id },
        data: {
          color: row.Color || undefined,
          tire_year: parseNumber(row['Tire Year']) ?? undefined,
          market_avg: parseNumber(row['Рынок средняя (AED)']) != null ? new Prisma.Decimal(parseNumber(row['Рынок средняя (AED)'])!) : undefined,
        }
      })
      report.info.updated++
    } catch (e: any) {
      report.info.errors.push(`INFO for ${id}: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'INFO', row: row as any, error: e.message } })
    }
  }

  // Expenses
  for (const row of toJSON(sheets.Expenses)) {
    const date = parseDate(row.Date)
    const amount = parseNumber(row.Amount)
    const category = (row.Category || '').toString().trim()
    const description = (row.Description || '').toString()
    const notes = row.Notes || null
    const investorName = (row.Investor || '').toString().trim()
    let investor_id: string | undefined
    if (investorName) {
      const inv = await prisma.investors.findUnique({ where: { name: investorName } })
      investor_id = inv?.id || undefined
    }
    let vehicle_id: string | undefined
    if (row.VIN != null) {
      const v = await prisma.vehicles.findUnique({ where: { vin: String(row.VIN) } })
      vehicle_id = v?.id || undefined
    }
    if (!date || amount == null || !category) continue
    try {
      await prisma.expenses.create({
        data: {
          date,
          amount: new Prisma.Decimal(amount),
          category,
          description,
          notes: notes || undefined,
          investor_id,
          vehicle_id,
        }
      })
      report.expenses.created++
    } catch (e: any) {
      report.expenses.errors.push(`Expense: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Expenses', row: row as any, error: e.message } })
    }
  }

  // Extra income
  for (const row of toJSON(sheets.ExtraIncome)) {
    const date = parseDate(row.Date)
    const amount = parseNumber(row.Amount)
    const source = (row.Source || '').toString().trim()
    const notes = row.Notes || null
    if (!date || amount == null || !source) continue
    try {
      await prisma.extra_income.create({ data: { date, amount: new Prisma.Decimal(amount), source, notes: notes || undefined } })
      report.extra_income.created++
    } catch (e: any) {
      report.extra_income.errors.push(`Extra income: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Extra income', row: row as any, error: e.message } })
    }
  }

  return new Response(JSON.stringify(report), { status: 200 })
}

