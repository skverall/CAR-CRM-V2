import { Prisma, CarStatus, CapitalAccountType } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { listCapitalAccounts } from '@/server/capital'

const DECIMAL_ZERO = new Prisma.Decimal(0)

function sumExpenses(expenses: Array<{ amount: Prisma.Decimal; fxRateToAed: Prisma.Decimal; type?: string }>) {
  return expenses.reduce((total, expense) => total.add(expense.amount.mul(expense.fxRateToAed)), DECIMAL_ZERO)
}

export async function getDashboardOverview() {
  const [cars, expenses, incomes, capitalAccounts, cashflowTxns] = await Promise.all([
    prisma.car.findMany({
      include: {
        expenses: true,
        incomes: true,
      },
    }),
    prisma.expense.findMany({
      select: { type: true, amount: true, fxRateToAed: true, isPersonal: true },
    }),
    prisma.income.findMany({
      select: { amount: true, fxRateToAed: true },
    }),
    listCapitalAccounts(),
    prisma.capitalTxn.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'asc' },
      select: { date: true, amountAed: true },
    }),
  ])

  const carsInWork = cars.filter((car) => ![CarStatus.SOLD, CarStatus.ARCHIVED].includes(car.status)).length

  let totalProfit = DECIMAL_ZERO

  for (const car of cars) {
    if (car.status !== CarStatus.SOLD) continue
    const expenseSum = sumExpenses(car.expenses.filter((expense) => !expense.isPersonal))
    const revenue = sumExpenses(car.incomes)
    const buyCost = car.buyPrice.mul(car.buyRate)
    totalProfit = totalProfit.add(revenue.sub(buyCost.add(expenseSum)))
  }

  const expenseDistribution = expenses.reduce<Record<string, Prisma.Decimal>>((acc, expense) => {
    if (expense.isPersonal) return acc
    const amountAed = expense.amount.mul(expense.fxRateToAed)
    acc[expense.type] = (acc[expense.type] ?? DECIMAL_ZERO).add(amountAed)
    return acc
  }, {})

  const incomeTotal = sumExpenses(incomes)

  const accounts = capitalAccounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balanceAed: account.balanceAed,
  }))

  const capitalSummary = accounts.reduce<Record<CapitalAccountType, number>>((summary, account) => {
    summary[account.type] = (summary[account.type] ?? 0) + account.balanceAed
    return summary
  }, {} as Record<CapitalAccountType, number>)

  const profitSplit = totalProfit.lte(DECIMAL_ZERO)
    ? []
    : [
        { label: 'Investor', amountAed: totalProfit.mul(0.5).toNumber() },
        { label: 'Assistant', amountAed: totalProfit.mul(0.25).toNumber() },
        { label: 'Owner', amountAed: totalProfit.mul(0.25).toNumber() },
      ]

  const cashflowDaily = cashflowTxns.reduce<Map<string, Prisma.Decimal>>((map, txn) => {
    const key = txn.date.toISOString().slice(0, 10)
    const current = map.get(key) ?? DECIMAL_ZERO
    map.set(key, current.add(txn.amountAed))
    return map
  }, new Map())

  const cashflowSeries = Array.from(cashflowDaily.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, amount]) => ({ date, amount: amount.toNumber() }))

  return {
    carsInWork,
    totalProfitAed: totalProfit.toNumber(),
    totalRevenueAed: incomeTotal.toNumber(),
    accounts,
    capitalSummary: {
      business: capitalSummary[CapitalAccountType.BUSINESS] ?? 0,
      investor: capitalSummary[CapitalAccountType.INVESTOR] ?? 0,
      owner: capitalSummary[CapitalAccountType.OWNER] ?? 0,
      assistant: capitalSummary[CapitalAccountType.ASSISTANT] ?? 0,
    },
    expenseDistribution: Object.entries(expenseDistribution).map(([type, amount]) => ({
      type,
      amountAed: amount.toNumber(),
    })),
    profitSplit,
    cashflowSeries,
  }
}

type ReportFilterInput = {
  from?: string
  to?: string
}

export async function getReportSummary(filters: ReportFilterInput) {
  const fromDate = filters.from ? new Date(filters.from) : undefined
  const toDate = filters.to ? new Date(filters.to) : undefined

  const expenseWhere: Prisma.ExpenseWhereInput = { isPersonal: false }
  const generalExpenseWhere: Prisma.ExpenseWhereInput = { isPersonal: true }
  const incomeWhere: Prisma.IncomeWhereInput = {}
  const carWhere: Prisma.CarWhereInput = {}

  if (fromDate || toDate) {
    expenseWhere.date = {}
    generalExpenseWhere.date = {}
    incomeWhere.date = {}
    carWhere.buyDate = {}
    if (fromDate) {
      expenseWhere.date.gte = fromDate
      generalExpenseWhere.date.gte = fromDate
      incomeWhere.date.gte = fromDate
      carWhere.buyDate.gte = fromDate
    }
    if (toDate) {
      expenseWhere.date.lte = toDate
      generalExpenseWhere.date.lte = toDate
      incomeWhere.date.lte = toDate
      carWhere.buyDate.lte = toDate
    }
  }

  const [expenses, generalExpenses, incomes, purchases] = await Promise.all([
    prisma.expense.findMany({
      where: expenseWhere,
      include: {
        car: {
          select: { id: true, vin: true, make: true, model: true, year: true, source: true },
        },
      },
    }),
    prisma.expense.findMany({ where: generalExpenseWhere }),
    prisma.income.findMany({
      where: incomeWhere,
      include: {
        car: {
          select: { id: true, vin: true, make: true, model: true, year: true, source: true },
        },
      },
    }),
    prisma.car.findMany({
      where: carWhere,
      select: { id: true, vin: true, make: true, model: true, year: true, source: true, buyPrice: true, buyRate: true },
    }),
  ])

  const carMap = new Map<
    string,
    {
      id: string
      vin: string
      make: string
      model: string
      year: number
      source: string | null
      buyCostAed: number
      expensesAed: number
      revenueAed: number
    }
  >()

  const ensureCar = (car: { id: string; vin: string; make: string; model: string; year: number; source: string | null }) => {
    if (!carMap.has(car.id)) {
      carMap.set(car.id, {
        id: car.id,
        vin: car.vin,
        make: car.make,
        model: car.model,
        year: car.year,
        source: car.source,
        buyCostAed: 0,
        expensesAed: 0,
        revenueAed: 0,
      })
    }
    return carMap.get(car.id)!
  }

  let totalRevenue = 0
  let totalDirectExpenses = 0

  for (const car of purchases) {
    const entry = ensureCar({ ...car, source: car.source })
    const buyPrice = car.buyPrice instanceof Prisma.Decimal ? car.buyPrice.toNumber() : Number(car.buyPrice)
    const buyRate = car.buyRate instanceof Prisma.Decimal ? car.buyRate.toNumber() : Number(car.buyRate)
    entry.buyCostAed += buyPrice * buyRate
    totalDirectExpenses += buyPrice * buyRate
  }

  const expenseByType = new Map<string, number>()
  const revenueBySource = new Map<string, number>()

  for (const expense of expenses) {
    if (!expense.car) continue
    const entry = ensureCar(expense.car)
    const amountAed = expense.amount.mul(expense.fxRateToAed).toNumber()
    entry.expensesAed += amountAed
    totalDirectExpenses += amountAed

    const typeKey = expense.type.toLowerCase()
    expenseByType.set(typeKey, (expenseByType.get(typeKey) ?? 0) + amountAed)
  }

  for (const income of incomes) {
    if (!income.car) continue
    const entry = ensureCar(income.car)
    const amountAed = income.amount.mul(income.fxRateToAed).toNumber()
    entry.revenueAed += amountAed
    totalRevenue += amountAed

    const sourceKey = income.car.source ?? 'Не указан'
    revenueBySource.set(sourceKey, (revenueBySource.get(sourceKey) ?? 0) + amountAed)
  }

  const generalExpensesAed = generalExpenses.reduce((sum, expense) => sum + expense.amount.mul(expense.fxRateToAed).toNumber(), 0)
  const carSummaries = Array.from(carMap.values()).map((item) => ({
    ...item,
    profitAed: item.revenueAed - (item.buyCostAed + item.expensesAed),
  }))

  carSummaries.sort((a, b) => b.profitAed - a.profitAed)

  const expenseDistribution = Array.from(expenseByType.entries())
    .map(([type, amount]) => ({ type, amountAed: amount }))
    .sort((a, b) => b.amountAed - a.amountAed)

  const sourceDistribution = Array.from(revenueBySource.entries())
    .map(([source, amount]) => ({ source, amountAed: amount }))
    .sort((a, b) => b.amountAed - a.amountAed)

  return {
    filters: {
      from: fromDate?.toISOString() ?? null,
      to: toDate?.toISOString() ?? null,
    },
    totals: {
      revenueAed: totalRevenue,
      directExpensesAed: totalDirectExpenses,
      generalExpensesAed,
      profitAed: totalRevenue - (totalDirectExpenses + generalExpensesAed),
    },
    cars: carSummaries,
    expenseByType: expenseDistribution,
    revenueBySource: sourceDistribution,
  }
}
