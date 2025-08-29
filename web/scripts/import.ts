import { PrismaClient, Prisma } from '../src/generated/prisma'
import { loadWorkbook, sheetToJSON, parseDate, parseNumber, splitMakeModel, detectTrimAndSpec, ImportReport } from '../src/lib/excel'
import path from 'node:path'
import fs from 'node:fs'

const prisma = new PrismaClient()

function usage() {
  console.log('Usage: pnpm import --file "./data.xlsx"')
}

function getArg(name: string) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return null
}

type InvestorRow = { Investor?: string | null; 'Initial Investment'?: any; [k: string]: any }
type InventoryRow = {
  ID?: any
  VIN?: any
  'Make/Model'?: string | null
  Year?: any
  'Trim / Spec'?: string | null
  Status?: string | null
  'Date Purchased'?: any
  Investor?: string | null
  'Purchase Price'?: any
  'Total Cost'?: any
  'List Price'?: any
  'Sold Price'?: any
  'Date Sold'?: any
  Notes?: string | null
}
type InfoRow = { ID?: any; Color?: string | null; 'Tire Year'?: any; 'Рынок средняя (AED)'?: any }
type ExpenseRow = { Date?: any; VIN?: any; Model?: string | null; Description?: string | null; Amount?: any; Category?: string | null; Investor?: string | null; Notes?: string | null }
type ExtraIncomeRow = { Date?: any; Source?: string | null; Amount?: any; Notes?: string | null }

async function main() {
  const file = getArg('file')
  if (!file) {
    usage()
    process.exit(1)
  }
  const abs = path.resolve(process.cwd(), file)
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs)
    process.exit(1)
  }

  const report: ImportReport = {
    investors: { created: 0, updated: 0, errors: [] },
    vehicles: { created: 0, updated: 0, errors: [] },
    expenses: { created: 0, updated: 0, errors: [] },
    extra_income: { created: 0, updated: 0, errors: [] },
    info: { updated: 0, errors: [] },
  }

  const { sheets } = loadWorkbook(abs)

  // Investors
  const investors = sheetToJSON<InvestorRow>(sheets.Investors)
    .filter((r) => (r.Investor || '').toString().toLowerCase() !== 'totals')
  for (const row of investors) {
    const name = (row.Investor || '').toString().trim()
    if (!name) continue
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
      report.investors.errors.push(`Investor '${name}': ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Investors', row: row as any, error: e.message } })
    }
  }

  // Vehicles (Inventory)
  const inventory = sheetToJSON<InventoryRow>(sheets.Inventory)
  for (const row of inventory) {
    const vinRaw = row.VIN
    const vin = vinRaw == null ? null : vinRaw.toString()
    const { make, model } = splitMakeModel(row['Make/Model'] || '')
    const year = parseNumber(row.Year)
    const trimSpec = detectTrimAndSpec(row['Trim / Spec'])
    const status = (row.Status || 'On Sale') as any
    const date_purchased = parseDate(row['Date Purchased'])
    const investorName = (row.Investor || '').toString().trim()
    const investor = investorName ? await prisma.investors.findUnique({ where: { name: investorName } }) : null
    if (!investor) {
      if (investorName) {
        report.vehicles.errors.push(`Unknown investor '${investorName}' for VIN ${vin}`)
        await prisma.import_errors.create({ data: { sheet: 'Inventory', row: row as any, error: `Unknown investor '${investorName}'` } })
      }
      continue
    }
    const purchase_price = parseNumber(row['Purchase Price']) ?? 0
    const total_cost = parseNumber(row['Total Cost']) ?? 0
    const list_price = parseNumber(row['List Price'])
    const sold_price = parseNumber(row['Sold Price'])
    const date_sold = parseDate(row['Date Sold'])
    const notes = row.Notes || null

    try {
      // Upsert by VIN if present, else skip
      if (!make || !year || !date_purchased) throw new Error('Missing required fields (make/year/date_purchased)')
      if (vin) {
        const existing = await prisma.vehicles.findUnique({ where: { vin } })
        if (existing) {
          await prisma.vehicles.update({
            where: { id: existing.id },
            data: {
              make, model, year: year!, trim: trimSpec.trim, spec: trimSpec.spec, status,
              date_purchased: date_purchased!, investor_id: investor.id,
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
              vin, make, model, year: year!, trim: trimSpec.trim, spec: trimSpec.spec, status,
              date_purchased: date_purchased!, investor_id: investor.id,
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

  // INFO sheet: update color, tire_year, market_avg by ID mapping to VIN/index not always reliable
  const info = sheetToJSON<InfoRow>(sheets.INFO)
  for (const row of info) {
    const id = row.ID != null ? String(row.ID) : null
    if (!id) continue
    // Try by VIN if ID is VIN-like, else skip (we cannot infer exact mapping without file spec)
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
  const expenses = sheetToJSON<ExpenseRow>(sheets.Expenses)
  for (const row of expenses) {
    const date = parseDate(row.Date)
    const amount = parseNumber(row.Amount)
    const category = (row.Category || '').toString().trim()
    const description = (row.Description || '').toString()
    const notes = row.Notes || null
    const investorName = (row.Investor || '').toString().trim()
    let investor_id: string | null = null
    if (investorName) {
      const inv = await prisma.investors.findUnique({ where: { name: investorName } })
      investor_id = inv?.id || null
      if (!inv) {
        report.expenses.errors.push(`Unknown investor '${investorName}' in Expenses`)
        await prisma.import_errors.create({ data: { sheet: 'Expenses', row: row as any, error: `Unknown investor '${investorName}'` } })
      }
    }
    let vehicle_id: string | null = null
    if (row.VIN != null) {
      const v = await prisma.vehicles.findUnique({ where: { vin: String(row.VIN) } })
      vehicle_id = v?.id || null
      if (!v) {
        report.expenses.errors.push(`VIN not found '${row.VIN}' in Expenses`)
        await prisma.import_errors.create({ data: { sheet: 'Expenses', row: row as any, error: `VIN not found '${row.VIN}'` } })
      }
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
          investor_id: investor_id || undefined,
          vehicle_id: vehicle_id || undefined,
        }
      })
      report.expenses.created++
    } catch (e: any) {
      report.expenses.errors.push(`Expense: ${e.message}`)
      await prisma.import_errors.create({ data: { sheet: 'Expenses', row: row as any, error: e.message } })
    }
  }

  // Extra income
  const exinc = sheetToJSON<ExtraIncomeRow>(sheets['Extra income'])
  for (const row of exinc) {
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

  console.log('Import completed:')
  console.log(JSON.stringify(report, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

