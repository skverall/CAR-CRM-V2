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
