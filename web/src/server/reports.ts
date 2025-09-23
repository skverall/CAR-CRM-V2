import { Prisma, CarStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { listCapitalAccounts } from '@/server/capital'

const DECIMAL_ZERO = new Prisma.Decimal(0)

function sumExpenses(expenses: Array<{ amount: Prisma.Decimal; fxRateToAed: Prisma.Decimal; type?: string }>) {
  return expenses.reduce((total, expense) => total.add(expense.amount.mul(expense.fxRateToAed)), DECIMAL_ZERO)
}

export async function getDashboardOverview() {
  const [cars, expenses, incomes, accounts, cashflow] = await Promise.all([
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

  const cashflowSeries = cashflow.map((txn) => ({
    date: txn.date.toISOString().slice(0, 10),
    amount: txn.amountAed.toNumber(),
  }))

  return {
    carsInWork,
    totalProfitAed: totalProfit.toNumber(),
    totalRevenueAed: incomeTotal.toNumber(),
    accounts,
    expenseDistribution: Object.entries(expenseDistribution).map(([type, amount]) => ({
      type,
      amountAed: amount.toNumber(),
    })),
    cashflowSeries,
  }
}
